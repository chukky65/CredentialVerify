import { Candidate, VerificationCase } from '../types';

const API_BASE = 'http://localhost:3001/api';

/**
 * Gets the JWT token from localStorage.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const apiClient = {
  async getCandidates(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE}/candidates`, {
      headers: { 'Authorization': getAuthHeaders().Authorization }
    });
    if (!response.ok) throw new Error('Failed to fetch candidates');
    const data = await response.json();
    return data.data as Candidate[];
  },

  async getCases(): Promise<VerificationCase[]> {
    const response = await fetch(`${API_BASE}/cases`, {
      headers: { 'Authorization': getAuthHeaders().Authorization }
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    const data = await response.json();
    return data.data as VerificationCase[];
  },

  async createCandidate(payload: any): Promise<Candidate> {
    const response = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create candidate');
    const data = await response.json();
    return data.data as Candidate;
  },

  async uploadDocument(file: File, credentialType: string): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('credentialType', credentialType);

    const headers: Record<string, string> = {
      'Authorization': getAuthHeaders().Authorization
    };
    // Note: Do NOT set Content-Type for FormData, the browser sets it automatically with the boundary

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return response.json();
  }
};
