const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const candidateData = {
      referenceCode: "PAC-TEST-001",
      fullName: "Test DB Candidate",
      dateOfBirth: "1990-01-01",
      electionId: "elec_test",
      electionName: "President",
      officeContested: "President",
      jurisdiction: "National",
      contactEmail: "test@example.com",
      contactPhone: "12345"
    };

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

    console.log("Candidate created:", candidate);
    
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
        reasonForReview: 'New candidate intake.',
        documentsCount: 0,
        claimsCount: 0,
        sourceChecksCount: 0,
        discrepanciesCount: 0,
        openItemsCount: 1
      }
    });
    console.log("Case created:", vCase);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
