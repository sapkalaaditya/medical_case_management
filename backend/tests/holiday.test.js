const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Holiday API Feature Tests', () => {
  let adminToken;

  beforeEach(async () => {
    await User.create({
      name: 'Holiday Tester',
      email: 'tester@medical.local',
      password: 'Password123!',
      role: 'admin'
    });

    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'tester@medical.local', password: 'Password123!' });

    adminToken = loginRes.body.data.token;
  });

  test('Guest cannot access holiday API without authentication (401)', async () => {
    const res = await request(app).get('/api/holidays?date=2026-08-15&country=IN');
    expect(res.status).toBe(401);
  });

  test('Authenticated user can query public holidays (returns 200 with resilient response)', async () => {
    const res = await request(app)
      .get('/api/holidays?date=2026-08-15&country=IN')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('isHoliday');
    expect(res.body.data).toHaveProperty('countryCode', 'IN');
  });

  test('Missing date parameter returns success with isHoliday: false and friendly message', async () => {
    const res = await request(app)
      .get('/api/holidays')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isHoliday).toBe(false);
  });
});
