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
    // Convert file to base64 to bypass Vercel serverless multipart issues
    const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
    
    const fileBase64 = await toBase64(file);

    const headers: Record<string, string> = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filename: file.name,
        fileBase64,
        credentialType
      }),
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return response.json();
  }
};
