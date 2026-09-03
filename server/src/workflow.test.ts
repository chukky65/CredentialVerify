import { determineCaseStatus } from './workflowEngine';

describe('Workflow Engine', () => {
  it('should upgrade status to VERIFIED if recommendation is REQUIREMENTS_SATISFIED', () => {
    const status = determineCaseStatus('NEEDS_REVIEW', 0, 'REQUIREMENTS_SATISFIED');
    expect(status).toBe('VERIFIED');
  });

  it('should change status to CONTRADICTED if there are open discrepancies', () => {
    const status = determineCaseStatus('NEEDS_REVIEW', 1);
    expect(status).toBe('CONTRADICTED');
  });

  it('should revert status to NEEDS_REVIEW when all discrepancies are resolved', () => {
    const status = determineCaseStatus('CONTRADICTED', 0);
    expect(status).toBe('NEEDS_REVIEW');
  });

  it('should not change status to CONTRADICTED if already RESTRICTED', () => {
    const status = determineCaseStatus('RESTRICTED', 1);
    expect(status).toBe('RESTRICTED');
  });

  it('should set status to INFO_REQUIRED when more info is needed', () => {
    const status = determineCaseStatus('NEEDS_REVIEW', 0, 'ADDITIONAL_INFO_REQUIRED');
    expect(status).toBe('INFO_REQUIRED');
  });
});
