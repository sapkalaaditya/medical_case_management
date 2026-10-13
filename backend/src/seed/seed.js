const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { Case, CASE_STATUSES, CASE_PRIORITIES } = require('../models/Case');
const ApiToken = require('../models/ApiToken');

const SAMPLE_IMPLANTS = [
  'Titanium Hip Stem 12mm',
  'Ceramic Acetabular Cup 48mm',
  'Total Knee Femoral Component',
  'Tibial Tray Posterior Stabilized',
  'Cervical Spine Fusion Cage PEEK',
  'Thoracolumbar Pedicle Screw System',
  'Custom Cranial Reconstruction Plate',
  'Anatomic Shoulder Glenoid Vault',
  'Reverse Shoulder Humeral Stem',
  'Bio-absorbable Interference Screw'
];

/**
 * Database Seed Script
 * Creates Admin, Viewer, and Engineer accounts and at least 25 medical cases
 */
const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await connectDB();

    console.log('[Seeder] Cleaning existing records...');
    await ApiToken.deleteMany({});
    await Case.deleteMany({});
    await User.deleteMany({});

    console.log('[Seeder] Creating dummy users from environment configuration...');
    // Create Admin user
    const adminUser = await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: 'admin'
    });

    // Create Viewer user
    const viewerUser = await User.create({
      name: env.VIEWER_NAME,
      email: env.VIEWER_EMAIL,
      password: env.VIEWER_PASSWORD,
      role: 'viewer'
    });

    // Create Engineer user (Bonus)
    const engineerUser = await User.create({
      name: env.ENGINEER_NAME,
      email: env.ENGINEER_EMAIL,
      password: env.ENGINEER_PASSWORD,
      role: 'engineer'
    });

    console.log(`[Seeder] Created 3 users:`);
    console.log(`  - Admin:    ${adminUser.email} (role: admin)`);
    console.log(`  - Viewer:   ${viewerUser.email} (role: viewer)`);
    console.log(`  - Engineer: ${engineerUser.email} (role: engineer)`);

    console.log('[Seeder] Generating 30 dummy medical cases...');
    const creators = [adminUser._id, engineerUser._id];
    const dummyCases = [];

    for (let i = 1; i <= 30; i++) {
      const caseNumber = `CASE-${String(i).padStart(4, '0')}`;
      const patientReference = `PT-${faker.number.int({ min: 1000, max: 9999 })}`;
      const surgeonName = `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`;
      const implantType = SAMPLE_IMPLANTS[(i - 1) % SAMPLE_IMPLANTS.length];
      const status = CASE_STATUSES[(i - 1) % CASE_STATUSES.length];
      const priority = CASE_PRIORITIES[(i - 1) % CASE_PRIORITIES.length];
      const surgeryDate = i % 4 === 0 ? null : faker.date.soon({ days: 45 });
      const createdBy = creators[i % creators.length];

      dummyCases.push({
        caseNumber,
        patientReference,
        surgeonName,
        implantType,
        status,
        priority,
        surgeryDate,
        createdBy
      });
    }

    await Case.insertMany(dummyCases);
    console.log(`[Seeder] Successfully seeded ${dummyCases.length} medical cases.`);
    console.log('[Seeder] Database seeding completed successfully.');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] Failed to seed database: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
