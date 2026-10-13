const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { Case } = require('../src/models/Case');

describe('Medical Case Management Feature Tests', () => {
  let adminUser, viewerUser, engineerUser;
  let adminToken, viewerToken, engineerToken;
  let sampleCase;

  // Helper to log in and get token
  const loginUser = async (email, password) => {
    const res = await request(app)
      .post('/api/login')
      .send({ email, password });
    return res.body.data.token;
  };

  beforeEach(async () => {
    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@test.local',
      password: 'AdminPassword123!',
      role: 'admin'
    });

    // 2. Create Viewer
    viewerUser = await User.create({
      name: 'Dr. Observer',
      email: 'viewer@test.local',
      password: 'ViewerPassword123!',
      role: 'viewer'
    });

    // 3. Create Engineer
    engineerUser = await User.create({
      name: 'Bio Eng',
      email: 'engineer@test.local',
      password: 'EngineerPassword123!',
      role: 'engineer'
    });

    // Get tokens
    adminToken = await loginUser('admin@test.local', 'AdminPassword123!');
    viewerToken = await loginUser('viewer@test.local', 'ViewerPassword123!');
    engineerToken = await loginUser('engineer@test.local', 'EngineerPassword123!');

    // Seed one sample case created by admin
    sampleCase = await Case.create({
      caseNumber: 'CASE-0001',
      patientReference: 'PT-1001',
      surgeonName: 'Dr. Strange',
      implantType: 'Titanium Hip Stem',
      status: 'Planning',
      priority: 'High',
      surgeryDate: new Date('2026-11-20'),
      createdBy: adminUser._id
    });
  });

  // TEST 3: Guest cannot access case APIs
  test('3. A guest cannot access case APIs (401), including /api/cases and /api/cases/:id', async () => {
    const listRes = await request(app).get('/api/cases');
    expect(listRes.status).toBe(401);
    expect(listRes.body.success).toBe(false);

    const getRes = await request(app).get(`/api/cases/${sampleCase._id}`);
    expect(getRes.status).toBe(401);
    expect(getRes.body.success).toBe(false);

    const createRes = await request(app).post('/api/cases').send({
      caseNumber: 'CASE-9999',
      patientReference: 'PT-9999',
      surgeonName: 'Dr. House',
      implantType: 'Knee Joint',
      status: 'Draft',
      priority: 'Low'
    });
    expect(createRes.status).toBe(401);
  });

  // TEST 4: Admin can create a case
  test('4. Admin can create a case (201, createdBy equals admin id)', async () => {
    const payload = {
      caseNumber: 'CASE-0002',
      patientReference: 'PT-2002',
      surgeonName: 'Dr. Gregory House',
      implantType: 'Ceramic Hip Cup',
      status: 'In Review',
      priority: 'Medium',
      surgeryDate: '2026-12-01'
    };

    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.caseNumber).toBe('CASE-0002');
    // Populated createdBy should contain admin's ID
    expect(res.body.data.createdBy._id.toString()).toBe(adminUser._id.toString());
  });

  // TEST 5: Creating a case with a duplicate Case Number fails
  test('5. Creating a case with a duplicate Case Number fails (422 with field-level error on caseNumber)', async () => {
    const duplicatePayload = {
      caseNumber: 'CASE-0001', // Already exists
      patientReference: 'PT-5000',
      surgeonName: 'Dr. Watson',
      implantType: 'Spinal Cage',
      status: 'Draft',
      priority: 'Low'
    };

    const res = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(duplicatePayload);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors).toHaveProperty('caseNumber');
    expect(res.body.errors.caseNumber[0]).toMatch(/already exists/i);
  });

  // TEST 6: Viewer cannot delete a case
  test('6. Viewer cannot delete a case (403) and the case still exists afterwards', async () => {
    const res = await request(app)
      .delete(`/api/cases/${sampleCase._id}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    // Verify case still exists in the database
    const caseInDb = await Case.findById(sampleCase._id);
    expect(caseInDb).not.toBeNull();
    expect(caseInDb.caseNumber).toBe('CASE-0001');
  });

  // EXTRA TEST: Viewer cannot create or update cases
  test('Extra: Viewer cannot create (403) or update (403) a case', async () => {
    // Create attempt
    const createRes = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        caseNumber: 'CASE-0003',
        patientReference: 'PT-3003',
        surgeonName: 'Dr. Who',
        implantType: 'Cranial Plate',
        status: 'Draft',
        priority: 'Low'
      });
    expect(createRes.status).toBe(403);

    // Update attempt
    const updateRes = await request(app)
      .put(`/api/cases/${sampleCase._id}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ surgeonName: 'Dr. Changed' });
    expect(updateRes.status).toBe(403);
  });

  // EXTRA TEST: Updating same case preserves unique validation
  test('Extra: Update with the same caseNumber on the same case passes', async () => {
    const res = await request(app)
      .put(`/api/cases/${sampleCase._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        caseNumber: 'CASE-0001',
        surgeonName: 'Dr. Stephen Strange'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.surgeonName).toBe('Dr. Stephen Strange');
  });

  // EXTRA TEST: Engineer can create and update, but cannot delete (403)
  test('Extra: Engineer can create/update cases, but cannot delete (403)', async () => {
    // Engineer creates case
    const createRes = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        caseNumber: 'CASE-0004',
        patientReference: 'PT-4004',
        surgeonName: 'Dr. McCoy',
        implantType: 'Bone Screw',
        status: 'Planning',
        priority: 'Medium'
      });
    expect(createRes.status).toBe(201);
    const createdId = createRes.body.data._id;

    // Engineer updates case
    const updateRes = await request(app)
      .put(`/api/cases/${createdId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ status: 'Approved' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('Approved');

    // Engineer attempts delete -> 403
    const deleteRes = await request(app)
      .delete(`/api/cases/${createdId}`)
      .set('Authorization', `Bearer ${engineerToken}`);
    expect(deleteRes.status).toBe(403);
  });

  // EXTRA TEST: Search, filter, and pagination
  test('Extra: Pagination and search work on GET /api/cases', async () => {
    // Seed a second case
    await Case.create({
      caseNumber: 'CASE-0005',
      patientReference: 'PT-5005',
      surgeonName: 'Dr. Meredith Grey',
      implantType: 'Heart Valve',
      status: 'Approved',
      priority: 'Low',
      createdBy: adminUser._id
    });

    // 1. Search for Grey
    const searchRes = await request(app)
      .get('/api/cases?search=Grey')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.items.length).toBe(1);
    expect(searchRes.body.data.items[0].surgeonName).toBe('Dr. Meredith Grey');

    // 2. Filter by status
    const filterRes = await request(app)
      .get('/api/cases?status=Planning')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.items.every((c) => c.status === 'Planning')).toBe(true);

    // 3. Pagination payload shape
    const pageRes = await request(app)
      .get('/api/cases?page=1&limit=1')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(pageRes.status).toBe(200);
    expect(pageRes.body.data.pagination).toHaveProperty('page', 1);
    expect(pageRes.body.data.pagination).toHaveProperty('limit', 1);
    expect(pageRes.body.data.pagination).toHaveProperty('total');
    expect(pageRes.body.data.pagination).toHaveProperty('totalPages');
  });

  // EXTRA TEST: Dashboard stats endpoint
  test('Extra: Dashboard stats returns accurate counts', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('planning');
    expect(res.body.data).toHaveProperty('inReview');
    expect(res.body.data).toHaveProperty('approved');
    expect(res.body.data).toHaveProperty('completed');
  });

  // EXTRA TEST: Invalid ID returns 404
  test('Extra: Invalid or non-existent ObjectId returns 404', async () => {
    const invalidIdRes = await request(app)
      .get('/api/cases/invalid-non-existing-id')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(invalidIdRes.status).toBe(404);

    const nonExistentIdRes = await request(app)
      .get('/api/cases/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(nonExistentIdRes.status).toBe(404);
  });
});
