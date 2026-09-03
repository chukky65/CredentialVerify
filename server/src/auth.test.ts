import request from 'supertest';
import app from './index';

describe('Authentication Middleware and Endpoints', () => {
  let token = '';

  beforeAll(() => {
    // Override demo mode to test actual auth logic if necessary,
    // or just rely on the fallback. 
    process.env.NODE_ENV = 'test';
    // If DEMO_MODE is true, it just bypasses the strict logic, so we can test the token endpoint directly.
  });

  it('should reject access to protected routes without a token', async () => {
    // If DEMO_MODE is true, it will actually pass. Let's force it false for the test.
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = 'false';

    const res = await request(app).get('/api/candidates');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access token required');

    process.env.DEMO_MODE = originalDemoMode;
  });

  it('should authenticate a valid login and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should allow access to protected routes with a valid token', async () => {
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = 'false'; // force strict check

    const res = await request(app)
      .get('/api/candidates')
      .set('Authorization', `Bearer ${token}`);
    
    // Either 200 or 500 (if DB is down). Since Postgres isn't running, it will be 500.
    // The point is it shouldn't be 401 or 403.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);

    process.env.DEMO_MODE = originalDemoMode;
  });
});
