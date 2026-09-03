/**
 * Determines the next workflow status of a case based on discrepancies and recommendations.
 */
export const determineCaseStatus = (
  currentStatus: string,
  openDiscrepancies: number,
  recommendationType?: string
): string => {
  if (recommendationType) {
    if (recommendationType === 'REQUIREMENTS_SATISFIED') return 'VERIFIED';
    if (recommendationType === 'ADDITIONAL_INFO_REQUIRED') return 'INFO_REQUIRED';
    if (recommendationType === 'SENIOR_ADJUDICATION_REQUIRED') return 'RESTRICTED';
    if (recommendationType === 'RESTRICTED_INVESTIGATION_REQUIRED') return 'RESTRICTED';
  }

  if (openDiscrepancies > 0 && currentStatus !== 'RESTRICTED' && currentStatus !== 'INFO_REQUIRED') {
    return 'CONTRADICTED';
  }

  if (openDiscrepancies === 0 && currentStatus === 'CONTRADICTED') {
    return 'NEEDS_REVIEW';
  }

  return currentStatus;
};
