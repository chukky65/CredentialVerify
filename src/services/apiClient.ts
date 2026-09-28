/// <reference types="vite/client" />
import { Candidate, VerificationCase } from '../types';

const API_BASE = import.meta.env?.VITE_API_URL || '/api';

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
  async saveCaseReview(caseId: string, payload: unknown): Promise<void> {
    const response = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}/review`, {
      method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Case review has not synced to the server');
  },
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

  async signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Sign-in failed');
    localStorage.setItem('token', data.token);
    localStorage.setItem('credential_verify_user', JSON.stringify(data.user));
    return data.user;
  }
};
