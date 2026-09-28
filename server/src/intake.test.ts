import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { ELECTIONS } from './elections';

const mockCandidateCreate = jest.fn<(args: { data: any }) => Promise<any>>();
const mockCaseCreate = jest.fn<(args: { data: any }) => Promise<any>>();
const mockTransaction = jest.fn(async (operation: any) => operation({
  candidate: { create: mockCandidateCreate }, verificationCase: { create: mockCaseCreate },
}));
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({ $transaction: mockTransaction })) }));
import app from './index';
import { generateToken } from './auth';

describe('candidate intake and election scope', () => {
  const token = generateToken({ role: 'VERIFICATION_ANALYST' });
  const payload = {
    referenceCode: 'TEST-2027-001', fullName: 'Test Candidate', dateOfBirth: '1980-01-01',
    electionId: ELECTIONS[0].id, electionName: ELECTIONS[0].name,
    officeContested: 'President', jurisdiction: 'National (All States)',
    contactEmail: 'test@example.com', contactPhone: '',
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockCandidateCreate.mockImplementation(async ({ data }: { data: any }) => ({ id: 'candidate-id', ...data }));
    mockCaseCreate.mockImplementation(async ({ data }: { data: any }) => ({ id: 'server-case-id', ...data }));
  });

  it('returns the server case from the same transaction as the candidate', async () => {
    const result = await request(app).post('/api/candidates').set('Authorization', `Bearer ${token}`).send(payload);
    expect(result.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockCandidateCreate).toHaveBeenCalledTimes(1);
    expect(mockCaseCreate).toHaveBeenCalledTimes(1);
    expect(result.body.data.cases[0]).toMatchObject({ id: 'server-case-id', candidateId: 'candidate-id', electionName: payload.electionName });
  });

  it('rejects offices outside the selected election without writing records', async () => {
    const result = await request(app).post('/api/candidates').set('Authorization', `Bearer ${token}`).send({ ...payload, officeContested: 'Governor' });
    expect(result.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('rejects missing jurisdiction without writing records', async () => {
    const result = await request(app).post('/api/candidates').set('Authorization', `Bearer ${token}`).send({ ...payload, jurisdiction: '' });
    expect(result.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('does not allow a blank or failed extraction to become verified', async () => {
    const result = await request(app).patch('/api/cases/test/review').set('Authorization', `Bearer ${token}`).send({ workflowStatus:'VERIFIED',stage:'COMPLETED',recommendation:{recommendationType:'REQUIREMENTS_SATISFIED'},rfis:[],documents:[{credentialType:'BIRTH_CERTIFICATE',extractionStatus:'FAILED',extractedFields:[]}] });
    expect(result.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('rejects impossible birth dates and flags underage candidates for review', async () => {
    const invalid = await request(app).post('/api/candidates').set('Authorization', `Bearer ${token}`).send({ ...payload, dateOfBirth: '2026-02-30' });
    expect(invalid.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
    const underage = await request(app).post('/api/candidates').set('Authorization', `Bearer ${token}`).send({ ...payload, dateOfBirth: '2010-01-01' });
    expect(underage.status).toBe(200);
    expect(underage.body.data.cases[0].workflowStatus).toBe('NEEDS_REVIEW');
  });
});
