import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, generateToken } from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for memory storage (Vercel compatible)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// DEMO_MODE toggle
const isDemoMode = process.env.DEMO_MODE === 'true';

// Temporary instance of Prisma
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: isDemoMode ? 'demo' : 'production' });
});

// Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (isDemoMode || (email && password)) {
    const token = generateToken({ email, role: 'VERIFICATION_ANALYST' });
    return res.json({ token, user: { email, role: 'VERIFICATION_ANALYST' } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Protected Document Upload Endpoint (Accepts JSON to bypass Vercel serverless multipart issues)
app.post('/api/documents/upload', authenticateToken, (req, res) => {
  const { filename, fileBase64, credentialType } = req.body;
  if (!filename || !fileBase64) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // In a real app, you would upload the base64 buffer to AWS S3 or Supabase Storage here.
  // We'll return a mock document object mimicking the database response.
  res.json({ 
    message: 'File uploaded successfully', 
    document: {
      id: `doc_${Date.now()}`,
      filename: filename,
      credentialType: credentialType,
    }
  });
});

// Create Candidate Endpoint
app.post('/api/candidates', authenticateToken, async (req, res) => {
  try {
    const candidateData = req.body;
    
    // Create candidate in Supabase
    const candidate = await prisma.candidate.create({
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
        status: 'PENDING',
        completenessScore: 100,
        lastUpdated: new Date().toISOString()
      }
    });

    // Also create a case for the candidate
    const vCase = await prisma.verificationCase.create({
      data: {
        caseReference: `CASE-2026-${candidate.referenceCode.split('-').pop()}-IN`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        electionName: candidate.electionName,
        officeContested: candidate.officeContested,
        jurisdiction: candidate.jurisdiction,
        workflowStatus: 'PENDING',
        stage: 'INTAKE',
        priority: 'STANDARD',
        assignedReviewerId: candidate.assignedReviewerId,
        assignedReviewerName: candidate.assignedReviewerName,
        submissionDate: candidate.submissionDate,
        slaDeadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        ageHours: 1,
        reasonForReview: 'New candidate intake. Automated extraction pending verification.',
        documentsCount: candidateData.documentIds ? candidateData.documentIds.length : 0,
        claimsCount: 0,
        sourceChecksCount: 0,
        discrepanciesCount: 0,
        openItemsCount: 1
      }
    });

    res.json({ source: 'postgres', data: candidate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Candidate Endpoints
app.get('/api/candidates', authenticateToken, async (req, res) => {
  if (isDemoMode) {
    return res.json({ source: 'demo', data: [] });
  }
  
  try {
    const candidates = await prisma.candidate.findMany();
    res.json({ source: 'postgres', data: candidates });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Cases Endpoints
app.get('/api/cases', authenticateToken, async (req, res) => {
  if (isDemoMode) {
    return res.json({ source: 'demo', data: [] });
  }
  
  try {
    const cases = await prisma.verificationCase.findMany();
    res.json({ source: 'postgres', data: cases });
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
