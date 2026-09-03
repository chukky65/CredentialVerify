import { Candidate, VerificationCase } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
    // Since this is a prototype and the backend doesn't store the file, 
    // we mock the upload completely on the frontend to avoid ANY Vercel 
    // serverless payload limits, timeouts, or network failures.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: 'File uploaded successfully',
          document: {
            id: `doc_${Date.now()}`,
            filename: file.name,
            credentialType: credentialType
          }
        });
      }, 1500); // Simulate realistic 1.5s network delay
    });
  }
};
