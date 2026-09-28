import express from 'express';
import { documentRoutes } from './documentRoutes';
import { checkPassword } from './passwords';
import cors from 'cors';
import dotenv from 'dotenv';



import { assessAge } from './ageValidation';
import { hasBlockingExtraction } from './extractionQuality';
import { saveDocuments, saveRfis, serializeCandidate } from './reviewPersistence';
import { PrismaClient, Prisma } from '@prisma/client';
import { normalizeElection, isValidElectionOffice } from './elections';
import { authenticateToken, generateToken } from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// DEMO_MODE toggle
const isDemoMode = process.env.DEMO_MODE === 'true';

// Temporary instance of Prisma
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: isDemoMode ? 'demo' : 'production' });
});

// Staff login validates a server-managed account; demo personas cannot access originals.
app.post('/api/auth/login', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || password.length > 1024) return res.status(400).json({ error: 'Email/staff ID and password required' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ error: 'Secure sign-in is not configured' });
  try {
    const account = await prisma.staffAccount.findFirst({ where: { OR: [{ email: email.trim().toLowerCase() }, { staffId: email.trim() }] } });
    if (!account?.active || !checkPassword(password, account.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken({ sub: account.id, email: account.email, role: account.role });
    res.json({ token, user: { id: account.id, name: account.name, email: account.email, staffId: account.staffId, role: account.role, jurisdiction: 'National (All States)', mfaEnabled: false, isActive: true, lastLogin: new Date().toISOString() } });
  } catch { res.status(503).json({ error: 'Sign-in service unavailable' }); }
});
app.use('/api/documents', documentRoutes(prisma));
// Create Candidate Endpoint
app.post('/api/candidates', authenticateToken, async (req, res) => {
  try {
    const candidateData = normalizeElection(req.body);
    if (!isValidElectionOffice(candidateData) || !candidateData.jurisdiction?.trim()) {
      return res.status(400).json({ error: 'Select a valid election, contested office and jurisdiction' });
    }
    const age = assessAge(candidateData.dateOfBirth, candidateData.officeContested);
    if (age.invalid) return res.status(400).json({ error: age.flags[0] });
    const documents = Array.isArray(candidateData.uploadedDocuments) ? candidateData.uploadedDocuments : [];
    const initialStatus = documents.length || age.flags.length ? 'NEEDS_REVIEW' : 'PENDING';
    const result = await prisma.$transaction(async (tx) => {
    
      // Create candidate in Supabase
      const candidate = await tx.candidate.create({
        data: {
          referenceCode: candidateData.referenceCode,
          fullName: candidateData.fullName,
          otherNames: candidateData.otherNames || '',
          dateOfBirth: candidateData.dateOfBirth,
          electionId: candidateData.electionId,
          electionName: candidateData.electionName,
          officeContested: candidateData.officeContested,
          jurisdiction: candidateData.jurisdiction,
          contactEmail: candidateData.contactEmail,
          contactPhone: candidateData.contactPhone,
          submissionDate: candidateData.submissionDate || new Date().toISOString(),
          assignedReviewerId: candidateData.assignedReviewerId || 'usr_1',
          assignedReviewerName: candidateData.assignedReviewerName || 'Elena Vance',
          status: initialStatus,
          completenessScore: 100,
          lastUpdated: new Date().toISOString()
        }
      });

      // Also create a case for the candidate
      const vCase = await tx.verificationCase.create({
        data: {
          caseReference: `CASE-2026-${candidate.referenceCode.split('-').pop()}-IN`,
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          electionName: candidate.electionName,
          officeContested: candidate.officeContested,
          jurisdiction: candidate.jurisdiction,
          workflowStatus: initialStatus,
          stage: documents.length ? 'ANALYSIS' : 'INTAKE',
          priority: 'STANDARD',
          assignedReviewerId: candidate.assignedReviewerId,
          assignedReviewerName: candidate.assignedReviewerName,
          submissionDate: candidate.submissionDate,
          slaDeadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
          ageHours: 1,
          reasonForReview: age.flags.join(' ') || (documents.length ? 'Document evidence awaiting analyst review.' : 'Awaiting document intake.'),
          documentsCount: candidateData.documentIds ? candidateData.documentIds.length : 0,
          claimsCount: documents.reduce((count: number, doc: any) => count + (doc.extractedFields?.length || 0), 0),
          sourceChecksCount: 0,
          discrepanciesCount: 0,
          openItemsCount: 1
        }
      });

      await saveDocuments(tx, candidate.id, documents);
      return { ...candidate, cases: [vCase] };
    });
    res.json({ source: 'postgres', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Persist human review state and its supporting records atomically.
app.patch('/api/cases/:caseId/review', authenticateToken, async (req, res) => {
  const payload = req.body;
  const statuses = ['PENDING', 'NEEDS_REVIEW', 'INFO_REQUIRED', 'VERIFIED', 'CONTRADICTED', 'RESTRICTED'];
  const stages = ['INTAKE', 'ANALYSIS', 'SOURCE_CHECK', 'DISCREPANCY_REVIEW', 'ADJUDICATION', 'COMPLETED'];
  if (!statuses.includes(payload.workflowStatus) || !stages.includes(payload.stage) ||
      !Array.isArray(payload.documents) || !Array.isArray(payload.rfis)) return res.status(400).json({ error: 'Invalid review state' });
  if (payload.workflowStatus === 'VERIFIED' && payload.recommendation?.recommendationType !== 'REQUIREMENTS_SATISFIED') {
    return res.status(400).json({ error: 'A recorded human recommendation is required to verify a case' });
  }
  if (payload.workflowStatus === 'VERIFIED' && (!payload.documents.length || payload.documents.some(hasBlockingExtraction))) return res.status(400).json({ error: 'Resolve missing, failed or uncertain extracted evidence before verification' });
  try {
    const id = String(req.params.caseId);
    const existing = await prisma.verificationCase.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Case not found' });
    await prisma.$transaction(async tx => {
      await saveDocuments(tx, existing.candidateId, payload.documents);
      await saveRfis(tx, existing, payload.rfis);
      await tx.verificationCase.update({ where: { id }, data: {
        workflowStatus: payload.workflowStatus, stage: payload.stage,
        recommendation: payload.recommendation || Prisma.DbNull,
        reasonForReview: payload.reasonForReview || existing.reasonForReview,
        documentsCount: payload.documents.length,
        claimsCount: payload.documents.reduce((count: number, doc: any) => count + (doc.extractedFields?.length || 0), 0),
      } });
      await tx.candidate.update({ where: { id: existing.candidateId }, data: { status: payload.workflowStatus } });
    });
    res.json({ saved: true });
  } catch (error) {
    console.error('Review persistence failed', error);
    res.status(500).json({ error: 'Review could not be persisted' });
  }
});

// Candidate Endpoints
app.get('/api/candidates', authenticateToken, async (req, res) => {

  
  try {
    const candidates = await prisma.candidate.findMany({ include: { documents: { include: { extractedFields: true, qualityWarnings: true, originals: { where: { completedAt: { not: null } }, select: { id: true }, take: 1 } } } } });
    res.json({ source: 'postgres', data: candidates.map(serializeCandidate).map(normalizeElection) });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Cases Endpoints
app.get('/api/cases', authenticateToken, async (req, res) => {

  
  try {
    const cases = await prisma.verificationCase.findMany({ include: { candidate: true, rfis: { include: { attachments: true } } } });
    res.json({ source: 'postgres', data: cases.map(({ candidate, ...item }) => {
      const registration = normalizeElection(candidate);
      return { ...item, electionName: registration.electionName, officeContested: registration.officeContested, jurisdiction: registration.jurisdiction };
    }) });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    if (isDemoMode) {
      console.log(`[server]: DEMO_MODE is ACTIVE. Using mock dataset.`);
    } else {
      console.log(`[server]: PRODUCTION MODE. Using PostgreSQL via Prisma.`);
    }
  });
}

export default app;
