# Medical Case Management System (MERN Stack)

A production-grade, secure, full-stack **Medical Case Management Web Application** designed for clinical teams, surgeons, and biomedical engineers to plan, track, and manage patient surgical cases and implant specifications.

> **Take-Home Internship Assignment**: Software Developer Intern at Jajal Medical.  
> **Stack Substitution Note**: The original assignment brief specified Laravel + MySQL. MERN (MongoDB, Express, React, Node.js) was substituted to demonstrate deep engineering competence in this modern JavaScript stack while preserving 100% of the architectural, security, and functional requirements.

---

## 1. Architectural Mapping: Laravel/MySQL to MERN

| Laravel + MySQL Concept | MERN Equivalent Implemented Here | Implementation Location |
|---|---|---|
| **Database Migrations** | Mongoose Schemas with Schema Validation & Database Indexes | [`backend/src/models/User.js`](backend/src/models/User.js), [`Case.js`](backend/src/models/Case.js) |
| **Model Factories & Seeders** | Node.js Seed Script using `@faker-js/faker` | [`backend/src/seed/seed.js`](backend/src/seed/seed.js) |
| **Form Requests** | Declarative Validation Middleware using `express-validator` | [`backend/src/validators/caseValidator.js`](backend/src/validators/caseValidator.js) |
| **Policies & Gates** | Decoupled Policy Module + `authorize(action)` Middleware | [`backend/src/policies/casePolicy.js`](backend/src/policies/casePolicy.js) |
| **Sanctum Revocable Tokens** | JWT with cryptographic `jti` verified against `ApiToken` collection | [`backend/src/middleware/authenticate.js`](backend/src/middleware/authenticate.js) |
| **`$fillable` Mass Assignment** | Strict field whitelisting helper (`pick()`) | [`backend/src/controllers/caseController.js`](backend/src/controllers/caseController.js) |
| **PHPUnit / Pest Feature Tests** | Jest + Supertest + in-memory database (`mongodb-memory-server`) | [`backend/tests/`](backend/tests/) |
| **Blade / Vue UI** | React 18 (Vite), React Router v6, Axios interceptors, responsive CSS | [`frontend/src/`](frontend/src/) |

---

## 2. Project Directory Structure

```
medical-case-management/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (Mongoose), env.js (Environment loader)
│   │   ├── models/          # User.js, Case.js, ApiToken.js (MongoDB schemas & indexes)
│   │   ├── controllers/     # authController, caseController, dashboardController, holidayController
│   │   ├── routes/          # authRoutes, caseRoutes, dashboardRoutes, holidayRoutes
│   │   ├── middleware/      # authenticate, authorize, errorHandler, validate
│   │   ├── policies/        # casePolicy.js (Role permission rules)
│   │   ├── validators/      # authValidator.js, caseValidator.js (express-validator rules)
│   │   ├── utils/           # apiResponse.js (Standardized JSON envelope)
│   │   ├── seed/            # seed.js (Generates 3 users + 30 cases)
│   │   ├── app.js           # Express app definition (exported for Supertest)
│   │   └── server.js        # HTTP server listener
│   ├── tests/               # Feature tests (auth.test.js, case.test.js, holiday.test.js)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # client.js (Axios instance with JWT & 401 interceptors)
│   │   ├── components/      # CaseForm.jsx (Reusable Create/Edit form), Navbar.jsx
│   │   ├── context/         # AuthContext.jsx (Global session state)
│   │   ├── pages/           # LoginPage, DashboardPage, CaseListPage, CaseDetailsPage, NotFoundPage
│   │   ├── routes/          # ProtectedRoute.jsx (Route guard with 403 page)
│   │   ├── styles/          # index.css (Dark clinical theme design system)
│   │   ├── App.jsx          # Route configurations
│   │   └── main.jsx         # Vite entry point
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── docs/
│   ├── database.md          # Database schemas, field types, indexes, and ER diagram
│   ├── traceability.md      # Requirements-to-code traceability matrix
│   ├── deployment.md        # Enterprise AWS architecture + free cloud tier deploy guide
│   └── code-walkthrough.md  # Request lifecycle walkthrough + 15 interview Q&A
├── postman/
│   └── medical-case-api.postman_collection.json # Exported Postman collection v2.1
├── SPEC.md                  # Project master specifications
├── .gitignore
└── README.md
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18.x or v20.x (LTS)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or free MongoDB Atlas cluster connection string.

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/medical-case-management.git
cd medical-case-management

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Files

```bash
# In backend directory:
cp .env.example .env

# In frontend directory:
cp .env.example .env
```

Verify `backend/.env` contents:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medical_case_management
JWT_SECRET=super_secret_dev_key_medical_2026
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
NAGER_API_URL=https://date.nager.at/api/v3
ADMIN_NAME="Admin User"
ADMIN_EMAIL="admin@medical.local"
ADMIN_PASSWORD="AdminPassword123!"
VIEWER_NAME="Dr. Viewer"
VIEWER_EMAIL="viewer@medical.local"
VIEWER_PASSWORD="ViewerPassword123!"
ENGINEER_NAME="Biomedical Engineer"
ENGINEER_EMAIL="engineer@medical.local"
ENGINEER_PASSWORD="EngineerPassword123!"
```

### 3. Seed Database
Run the seeder to wipe old data and create Admin, Viewer, and Engineer accounts along with 30 realistic dummy medical cases:

```bash
cd backend
npm run seed
```

### 4. Start Development Servers

**Terminal 1 — Backend API Server (Port 5000):**
```bash
cd backend
npm run dev
# or npm start
```

**Terminal 2 — Frontend React App (Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 4. Test Login Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@medical.local` | `AdminPassword123!` | View all, Create cases, Edit cases, Change status, Delete cases |
| **Viewer** | `viewer@medical.local` | `ViewerPassword123!` | View all, View case details (Cannot create, edit, or delete — 403 on server) |
| **Engineer** *(Bonus)* | `engineer@medical.local` | `EngineerPassword123!` | View all, Create cases, Edit cases, Change status (Cannot delete — 403 on server) |

---

## 5. Running Automated Tests

All tests run using **Jest**, **Supertest**, and an isolated in-memory MongoDB server (**`mongodb-memory-server`**). Tests never touch or mutate your development or production database.

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- **Test 1**: Valid login returns 200, user data, and JWT token.
- **Test 2**: Invalid login returns 401 with generic error message.
- **Test 3**: Guest (unauthenticated) access to case APIs returns 401.
- **Test 4**: Admin creates case (201) with `createdBy` set automatically.
- **Test 5**: Creating duplicate Case Number fails (422 field error on `caseNumber`).
- **Test 6**: Viewer cannot delete case (403) and the case remains in DB.
- **Bonus & Extras**:
  - Logout immediately revokes token (`ApiToken` record deleted; next call returns 401).
  - Viewer cannot create or update cases (403).
  - Engineer can create and update, but cannot delete (403).
  - Updating same case with same caseNumber passes without duplicate collision.
  - Search (regex escaped), status filtering, and pagination logic verified.
  - Dashboard stats aggregate verification.
  - Public holiday endpoint resilience and authentication.

---

## 6. REST API Documentation

All API responses follow a single consistent JSON shape:

**Success Response Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation description"
}
```

**Error Response Envelope:**
```json
{
  "success": false,
  "data": null,
  "message": "Human readable explanation",
  "errors": {
    "fieldName": ["Validation rule error message"]
  }
}
```

### Endpoints Table

| Method | Endpoint | Description | Permitted Roles | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/login` | Authenticate user & issue revocable JWT | Public (Rate-limited) | 200, 401, 422, 429 |
| `POST` | `/api/logout` | Revoke token server-side | Authenticated | 200, 401 |
| `GET` | `/api/me` | Fetch currently logged-in user & role | Authenticated | 200, 401 |
| `GET` | `/api/dashboard/stats` | Retrieve case counts across statuses | Authenticated | 200, 401 |
| `GET` | `/api/cases` | Paginated list with search, filter, and sorting | Admin, Viewer, Engineer | 200, 401 |
| `POST` | `/api/cases` | Create medical case | Admin, Engineer | 201, 401, 403, 422 |
| `GET` | `/api/cases/:id` | Get single case with populated creator | Admin, Viewer, Engineer | 200, 401, 404 |
| `PUT` | `/api/cases/:id` | Update case (whitelisted fields) | Admin, Engineer | 200, 401, 403, 422, 404 |
| `DELETE`| `/api/cases/:id` | Delete case | Admin only | 200, 401, 403, 404 |
| `GET` | `/api/holidays` | Check if surgery date is a public holiday | Authenticated | 200, 401 |

---

## 7. Security Implementation Checklist

- [x] **Server-Side Authorization**: Enforced via `policies/casePolicy.js` and `authorize()` middleware. Viewers or Engineers calling unauthorized routes receive an immediate HTTP 403.
- [x] **Token Revocation (Logout)**: Unlike pure stateless JWTs, tokens are indexed in `ApiToken` by `jti`. Logout destroys the database token record, immediately invalidating the JWT.
- [x] **Mass-Assignment Defense**: Controller uses `pick()` helper whitelisting only authorized fields (`caseNumber`, `patientReference`, `surgeonName`, `implantType`, `status`, `priority`, `surgeryDate`). `createdBy` is hard-assigned from `req.user._id`.
- [x] **NoSQL Injection Protection**: `express-mongo-sanitize` strips `$` and `.` operators from request parameters; Mongoose schemas enforce strong type casting.
- [x] **Search ReDoS & Regex Escaping**: Special characters in `search` queries are escaped before `$regex` creation via `escapeRegex()`.
- [x] **Password Protection**: Passwords are hashed with `bcryptjs` (salt rounds 10) in a Mongoose `pre('save')` hook and excluded from query results by default (`select: false`).
- [x] **Security Headers & CORS**: `helmet` headers active; `cors` configured with whitelist origin from `env.CLIENT_URL`.
- [x] **Brute-Force Rate Limiting**: `/api/login` is rate-limited to 10 attempts per 15 minutes via `express-rate-limit` (relaxed during test suite runs).
- [x] **CSRF Considerations**: Auth uses an explicit `Authorization: Bearer <token>` header, not browser cookies. Browsers do not attach Bearer headers automatically in cross-origin requests, mitigating classic cross-site request forgery attacks.

---

## 8. Assumptions & Known Limitations

1. **Token in `localStorage`**: The React frontend stores the JWT in `localStorage` for session persistence across page reloads. In high-compliance enterprise healthcare settings, storing tokens in `HttpOnly`, `SameSite=Strict` cookies with CSRF defense is preferred to eliminate XSS token exfiltration risks.
2. **De-Identified Patient Data**: All patient data uses synthetic codes (`PT-XXXX`). No real Protected Health Information (PHI) is processed or stored.
3. **Email Verification & Password Reset**: User registration and password reset flows are intentionally omitted per assignment specifications; all accounts are provisioned via the seed script.
4. **File Attachments**: 3D implant DICOM/CAD files are simulated via metadata model strings rather than multipart S3 file uploads.

---

## 9. What I Would Do Next (Production Roadmap)

1. **Audit Logging & Activity Timeline**: Implement an `AuditLog` collection tracking every surgical case modification (who changed `status` from Planning to Approved, timestamp, and field diff).
2. **File & DICOM CAD Uploads**: Integrate AWS S3 presigned URLs for uploading patient anatomical scans (DICOM) and 3D implant model files with antivirus scanning.
3. **Role-Based Granular Permissions**: Allow custom organizational roles (e.g. Lead Surgeon, Anesthesiologist, Quality Assurance Inspector).
4. **Real-time Collaboration**: Add Socket.io or WebSockets to broadcast live status changes on the dashboard and case list when another surgeon or engineer updates a case.

---

## 10. Live Deployment Guide

For full AWS enterprise architecture and click-by-click instructions to deploy to **MongoDB Atlas + Render + Vercel**, see [`docs/deployment.md`](docs/deployment.md).
