const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medical_case_management',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_jwt_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NAGER_API_URL: process.env.NAGER_API_URL || 'https://date.nager.at/api/v3',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin User',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@medical.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  VIEWER_NAME: process.env.VIEWER_NAME || 'Dr. Viewer',
  VIEWER_EMAIL: process.env.VIEWER_EMAIL || 'viewer@medical.local',
  VIEWER_PASSWORD: process.env.VIEWER_PASSWORD || 'ViewerPassword123!',
  ENGINEER_NAME: process.env.ENGINEER_NAME || 'Biomedical Engineer',
  ENGINEER_EMAIL: process.env.ENGINEER_EMAIL || 'engineer@medical.local',
  ENGINEER_PASSWORD: process.env.ENGINEER_PASSWORD || 'EngineerPassword123!'
};
