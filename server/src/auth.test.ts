import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { hashPassword } from './passwords';
const findFirst = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual<any>('@prisma/client');
  return { ...actual, PrismaClient: jest.fn(() => ({ staffAccount: { findFirst: (...args: any[]) => findFirst(...args) } })) };
});
import app from './index';
describe('staff sign-in', () => {
  it('rejects arbitrary credentials and accepts only an active account password', async () => {
    process.env.JWT_SECRET = 'a-test-secret-with-at-least-32-characters';
    findFirst.mockResolvedValue(null);
    expect((await request(app).post('/api/auth/login').send({email:'unknown',password:'anything'})).status).toBe(401);
    findFirst.mockResolvedValue({id:'staff',email:'reviewer@example.com',staffId:'STAFF-1',name:'Reviewer',role:'VERIFICATION_ANALYST',active:true,passwordHash:hashPassword('a-long-test-password')});
    expect((await request(app).post('/api/auth/login').send({email:'reviewer@example.com',password:'wrong'})).status).toBe(401);
    const result=await request(app).post('/api/auth/login').send({email:'reviewer@example.com',password:'a-long-test-password'});
    expect(result.status).toBe(200); expect(result.body.token).toBeTruthy(); expect(result.body.user.passwordHash).toBeUndefined(); expect(result.body.user.id).toBe('staff');
  });
});
