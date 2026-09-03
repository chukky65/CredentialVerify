import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the Supabase PostgreSQL database...');

  const candidate = await prisma.candidate.create({
    data: {
      referenceCode: 'CAND-' + Date.now(),
      fullName: 'Hon. Jane Doe',
      dateOfBirth: '1980-05-15',
      electionId: 'ELEC-2026',
      electionName: 'General Election 2026',
      officeContested: 'Mayor',
      jurisdiction: 'Metro City',
      contactEmail: 'jane.doe@example.com',
      contactPhone: '555-1234',
      submissionDate: new Date(),
      status: 'UNDER_REVIEW',
      completenessScore: 85,
      assignedReviewerId: 'REV-001',
      assignedReviewerName: 'Alice Verification',
      is_demo: false,
    },
  });

  const vCase = await prisma.verificationCase.create({
    data: {
      caseReference: 'CASE-' + Date.now(),
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      electionName: candidate.electionName,
      officeContested: candidate.officeContested,
      jurisdiction: candidate.jurisdiction,
      workflowStatus: 'NEEDS_REVIEW',
      stage: 'INTAKE',
      priority: 'HIGH',
      assignedReviewerId: 'REV-001',
      assignedReviewerName: 'Alice Verification',
      submissionDate: new Date(),
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      ageHours: 2,
      reasonForReview: 'Standard credential check',
      documentsCount: 1,
      claimsCount: 2,
      sourceChecksCount: 0,
      discrepanciesCount: 0,
      openItemsCount: 1,
      is_demo: false,
    },
  });

  console.log(`Created Candidate: ${candidate.fullName} and Case: ${vCase.caseReference}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
