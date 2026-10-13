const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth Feature Tests', () => {
  let seededUser;

  beforeEach(async () => {
    seededUser = await User.create({
      name: 'Test Doctor',
      email: 'doctor@medical.local',
      password: 'CorrectPassword123!',
      role: 'admin'
    });
  });

  // TEST 1: Valid login succeeds
  test('1. Valid login succeeds (200, returns token)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'doctor@medical.local',
        password: 'CorrectPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('doctor@medical.local');
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.message).toBe('Login successful');
  });

  // TEST 2: Invalid login is rejected
  test('2. Invalid login is rejected (401, correct message)', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'doctor@medical.local',
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toBe('Invalid email or password');
  });

  // EXTRA TEST: Logout revokes the token immediately
  test('Extra: Logout revokes token so subsequent requests return 401', async () => {
    // 1. Log in to get token
    const loginRes = await request(app)
      .post('/api/login')
      .send({
        email: 'doctor@medical.local',
        password: 'CorrectPassword123!'
      });

    const token = loginRes.body.data.token;

    // 2. Call /api/me with token -> 200
    const meRes1 = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes1.status).toBe(200);

    // 3. Logout
    const logoutRes = await request(app)
      .post('/api/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // 4. Calling /api/me now fails with 401 because token was revoked
    const meRes2 = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes2.status).toBe(401);
  });
});
