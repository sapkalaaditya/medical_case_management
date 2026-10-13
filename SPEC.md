# MASTER PROMPT — Medical Case Management App (MERN Stack)

> Copy everything below the line into Antigravity.

---

## ROLE

You are a senior full-stack engineer and mentor. Build a complete, working, well-documented **Medical Case Management web app** using the **MERN stack** (MongoDB, Express, React, Node.js). The app is a take-home internship assignment for "Software Developer Intern" at Jajal Medical. The original brief asked for Laravel + MySQL; I am substituting MERN because it is the stack I know. Equivalents are mapped below. Every requirement of the original brief must still be met.

I am a final-year B.Tech CSE student (fresher). **I must be able to explain every line of code**, so write clean, simple, commented code, avoid clever abstractions, and explain what you do in each phase.

Use **dummy data only**. No real patient data anywhere.

---

## 1. TECH STACK (fixed)

| Layer | Choice |
|---|---|
| Backend | Node.js (LTS), Express.js |
| Database | MongoDB + Mongoose (local MongoDB or Atlas; connection string from `.env`) |
| Frontend | React (Vite), React Router, Axios, plain CSS or Tailwind (responsive: laptop + phone) |
| Auth | JWT (bcrypt-hashed passwords). Tokens must be **revocable on logout** (see §5) |
| Validation | `express-validator` or `zod`, in separate validator files (equivalent of Laravel Form Requests) |
| Authorization | Policy module + middleware (equivalent of Laravel Policy/Gate) |
| Testing | Jest + Supertest + `mongodb-memory-server` |
| Seeding | Node seed script using `@faker-js/faker` |
| Security | `helmet`, `cors` (configured), `express-rate-limit` on login, `express-mongo-sanitize`, bcrypt |
| Git | Git, clear commit messages, public GitHub repo |

Laravel-to-MERN mapping to follow: Migrations → Mongoose schemas + indexes. Factory/Seeder → `seed/` script. Form Request → `validators/`. Policy → `policies/casePolicy.js`. Sanctum tokens → JWT stored server-side by `jti` so logout revokes it. `$fillable` → explicit field whitelisting. Feature tests → Jest + Supertest.

---

## 2. PROJECT STRUCTURE

```
medical-case-management/
├── backend/
│   ├── src/
│   │   ├── config/        (db.js, env.js)
│   │   ├── models/        (User.js, Case.js, ApiToken.js)
│   │   ├── controllers/   (authController.js, caseController.js, dashboardController.js)
│   │   ├── routes/        (authRoutes.js, caseRoutes.js, dashboardRoutes.js)
│   │   ├── middleware/    (authenticate.js, authorize.js, errorHandler.js, validate.js)
│   │   ├── policies/      (casePolicy.js)
│   │   ├── validators/    (authValidator.js, caseValidator.js)
│   │   ├── utils/         (apiResponse.js)
│   │   ├── seed/          (seed.js)
│   │   ├── app.js         (express app, exported for tests)
│   │   └── server.js      (starts the server)
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/ (api/, components/, context/, pages/, routes/, styles/)
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── database.md
│   ├── traceability.md
│   ├── deployment.md
│   └── code-walkthrough.md
├── postman/ (exported collection JSON)
├── .gitignore
└── README.md
```

---

## 3. DATA MODEL

### User
`name` (required), `email` (required, unique, lowercase), `password` (bcrypt hash, never returned in responses, `select: false`), `role` (enum: `admin`, `viewer`; add `engineer` for the bonus), timestamps.

### Case
| Field | Rule |
|---|---|
| `_id` | Auto-generated (MongoDB ObjectId) |
| `caseNumber` | Required, **unique index**, format like `CASE-0001` (validate with regex `^CASE-\d{4,}$`) |
| `patientReference` | Required, dummy code (e.g. `PT-1042`), not a real name |
| `surgeonName` | Required |
| `implantType` | Required |
| `status` | Required, enum: `Draft, Planning, In Review, Approved, Completed, Cancelled`; **index on status** |
| `priority` | Required, enum: `Low, Medium, High` |
| `surgeryDate` | Optional, valid date |
| `createdBy` | `ObjectId` ref to `User`, required, **set automatically from the logged-in user** (never accepted from request body) |
| `createdAt / updatedAt` | Mongoose `timestamps: true` |

Add an index on `caseNumber` (unique) and `status`. Strip `__v` from JSON output if desired.

---

## 4. ROLES AND PERMISSIONS

| Role | View | Create/Edit | Change status | Delete |
|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | No |
| Engineer (BONUS) | Yes | Yes | Yes | No |

Implement all checks in `policies/casePolicy.js` with functions like `viewAny`, `view`, `create`, `update`, `changeStatus`, `delete`, and apply them through an `authorize('create')` style middleware. **Server-side enforcement is mandatory**: a Viewer who calls a delete/create/update endpoint directly must get **403**, regardless of what the UI shows.

Because status changes are Admin-only (Engineer in bonus), if a non-allowed user attempts to change `status` through the update endpoint it must also be blocked with 403.

---

## 5. AUTHENTICATION (API + Web use the same JWT system)

- `POST /api/login` verifies email and password, creates a JWT containing user id and a unique `jti`, **stores the `jti` in the `ApiToken` collection** (with `userId`, `expiresAt`, TTL index), and returns the token.
- The `authenticate` middleware reads `Authorization: Bearer <token>`, verifies the signature, **checks that the `jti` still exists in `ApiToken`**, loads the user, and attaches `req.user`. Otherwise respond **401**.
- `POST /api/logout` deletes that token's `ApiToken` record, so the token stops working immediately.
- Wrong email or password → **401** with a clear message ("Invalid email or password"), without revealing which one was wrong. Show this message on the React login page.
- Rate-limit `/api/login` (e.g. 10 attempts per 15 min); in test environment disable or relax the limiter so tests are not flaky.
- Secrets (`JWT_SECRET`, `MONGO_URI`) come only from `.env`.
- The React app stores the token in memory plus `localStorage` (document this trade-off in README under limitations) and sends it via an Axios interceptor. An Axios response interceptor must log the user out and redirect to `/login` on any 401.
- CSRF note for README: since auth uses a Bearer header and not cookies, classic CSRF does not apply; explain this reasoning in README.

---

## 6. REST API (all responses use ONE consistent JSON shape)

```json
{ "success": true, "data": { }, "message": "..." }
```
Errors:
```json
{ "success": false, "data": null, "message": "Validation failed", "errors": { "caseNumber": ["Case number already exists"] } }
```
Create `utils/apiResponse.js` helpers (`success(res, data, message, status)` and `fail(res, message, status, errors)`) and use them everywhere, including the global error handler, the 404 handler for unknown routes/ids, and invalid ObjectId cases (return 404 or 422, never a 500 crash).

| Method | Endpoint | Purpose | Who |
|---|---|---|---|
| POST | `/api/login` | Get token | Anyone |
| POST | `/api/logout` | Revoke token | Logged-in |
| GET | `/api/cases` | List (paginated) | Admin, Viewer (+Engineer) |
| POST | `/api/cases` | Create | Admin (+Engineer) |
| GET | `/api/cases/:id` | Get one (populate `createdBy` name/email) | Admin, Viewer (+Engineer) |
| PUT | `/api/cases/:id` | Update | Admin (+Engineer) |
| DELETE | `/api/cases/:id` | Delete | Admin only |
| GET | `/api/dashboard/stats` | Dashboard counts | Any logged-in user |
| GET | `/api/me` | Current user + role (used by the React app) | Logged-in |

Status codes: **200** OK, **201** created, **401** not logged in, **403** not allowed, **404** not found, **422** validation error (with field-level messages keyed by field name).

### List endpoint behaviour (`GET /api/cases`)
- Pagination: `?page=1&limit=10` (default 10 per page). Return `data.items` plus `data.pagination { page, limit, total, totalPages }`.
- Search: `?search=` matches `caseNumber` OR `surgeonName`, case-insensitive. **Escape regex special characters** in the user input before building the regex (security).
- Filter: `?status=Approved` (validate against allowed list; ignore or 422 on invalid value).
- BONUS: `?priority=High`, and sorting `?sortBy=createdAt&order=desc` using a **whitelist** of sortable fields.
- Populate `createdBy` (name only).

### Dashboard stats
Return counts for: **Total cases, Planning, In Review, Approved, Completed** (use `countDocuments` or an aggregation with `$group`; no unsafe queries).

---

## 7. VALIDATION (backend mandatory, in validator files, not inside controllers)

`caseValidator.js` must check:
- Required: `caseNumber`, `patientReference`, `surgeonName`, `implantType`, `status`, `priority`.
- `caseNumber` format and **unique** check on create (return 422, not just a DB duplicate-key 500). On update, the unique check **must ignore the case currently being edited**. Also handle Mongo duplicate key error `11000` in the error handler as a fallback and map it to 422.
- `status` and `priority` must be from the allowed lists.
- `surgeryDate` optional, must be a valid date if present.
- Trim strings, enforce sensible max lengths.
- **Mass-assignment protection**: build the document from a whitelist `pick(req.body, [caseNumber, patientReference, surgeonName, implantType, status, priority, surgeryDate])`. Never pass `req.body` straight to Mongoose. `createdBy` is set only from `req.user._id`.
- Also validate login body (email format, password required).

The React form shows validation errors **next to each field** using the `errors` object from the 422 response, plus basic client-side checks for UX (backend remains the source of truth).

---

## 8. FRONTEND (React, 5 screens, responsive)

Routes with a `ProtectedRoute` wrapper (redirect guests to `/login`). Use an `AuthContext` that holds `user`, `token`, `login()`, `logout()`.

1. **Login / Logout** (`/login`): email + password form, shows the clear error message for wrong credentials, logout button in the navbar.
2. **Dashboard** (`/`): cards for Total, Planning, In Review, Approved, Completed (from `/api/dashboard/stats`).
3. **Case list** (`/cases`): table with pagination (10 per page), search box (Case Number or Surgeon Name, debounced), Status filter dropdown, View / Edit / Delete buttons **shown only to roles allowed** (Viewer sees View only; confirm dialog before delete). BONUS: priority filter and clickable sortable column headers. On phones the table must scroll or collapse into cards.
4. **Create / Edit form** (`/cases/new`, `/cases/:id/edit`): **one reusable `CaseForm` component** for both modes, per-field error messages, loading and success feedback. Viewer must not reach these routes (route guard + server 403).
5. **Case details** (`/cases/:id`): all fields, including **who created it and when** (createdBy name, createdAt, updatedAt).

Also: 404 page, loading and error states, a simple clean navbar showing the user name and role. BONUS: on the form, show public holidays for the chosen Surgery Date (see §12).

---

## 9. TESTS (Jest + Supertest + mongodb-memory-server)

Write **at least these 6 feature tests** (name them clearly), plus extras if time allows:

1. Valid login succeeds (200, returns token).
2. Invalid login is rejected (401, correct message).
3. A guest cannot access case APIs (401), including `/api/cases` and `/api/cases/:id`.
4. Admin can create a case (201, `createdBy` equals admin id).
5. Creating a case with a duplicate Case Number fails (422 with field-level error on `caseNumber`).
6. Viewer cannot delete a case (403) and the case still exists afterwards.

Good extras: logout revokes the token (subsequent call returns 401), update with the same caseNumber on the same case passes, Viewer cannot create/update (403), pagination and search work, invalid id returns 404.

Add `npm test` script. Tests must use an isolated in-memory DB and never touch the real database. All tests must pass before the final commit.

---

## 10. SEEDING

`npm run seed` must:
- Create **1 Admin and 1 Viewer** (plus 1 Engineer if the bonus is done).
- Read dummy emails and passwords from environment variables (defaults documented in `.env.example` and README, **not hard-coded in source**).
- Create **at least 25 dummy cases** with faker, mixed statuses and priorities, unique case numbers `CASE-0001…`, assigned to the users via `createdBy`.
- Be safe to re-run (clear old seeded data first or upsert).

---

## 11. SECURITY CHECKLIST (implement and mention in README)

- Policy-based authorization enforced server-side.
- Only Mongoose queries, no `$where`, no string-built queries; `express-mongo-sanitize` enabled; regex input escaped.
- Mass-assignment prevention via whitelisting.
- bcrypt password hashing; password never returned.
- `helmet`, configured `cors` (origin from `.env`), login rate limiting, JSON body size limit.
- **Never commit `.env`**, passwords, or keys. Commit `.env.example` for both backend and frontend. `.gitignore` must include `node_modules`, `.env`, build output, coverage.

---

## 12. BONUS TASKS (do after core is fully working and tested)

1. **Engineer role** (create, edit, change status, cannot delete): update model enum, policy, seed, UI, tests (Engineer can create, Engineer cannot delete → 403).
2. **Priority filter + column sorting** on case list (UI + API, whitelisted sort fields).
3. **Public holidays from Nager.Date**: backend endpoint `GET /api/holidays?date=YYYY-MM-DD&country=IN` that calls the Nager.Date API through Axios. Base URL in `.env` (`NAGER_API_URL`), **timeout set** (e.g. 3000 ms), failures handled gracefully (return success with an empty list and a friendly message; never crash). Show the holiday name next to the Surgery Date field in the form.
4. **`docs/deployment.md`** (about half a page): how I would host on AWS: EC2 for the Node app (PM2 + Nginx reverse proxy), MongoDB Atlas (or DocumentDB) instead of RDS and a note on RDS being the MySQL equivalent, S3 for files, security groups, environment secrets (SSM Parameter Store/Secrets Manager), HTTPS with ACM/Let's Encrypt.
5. **Live deployment** on free hosts: backend on Render, database on MongoDB Atlas free tier, frontend on Vercel or Netlify. Give me exact click-by-click steps and the env vars to set, plus the CORS setting. Add the live URL to the README.

---

## 13. DOCUMENTATION TO GENERATE

**README.md** must contain: project overview and tech stack (and a short, honest note that the stack was changed from Laravel/MySQL to MERN, with the mapping table); folder structure; setup steps (clone, `npm install` in backend and frontend, copy `.env.example` to `.env`, seed, run both servers); test login credentials (dummy); how to run tests; full API endpoint list with sample request/response; security measures; assumptions and known limitations (e.g. token in localStorage, no email reset, no file uploads); and a "what I would do next" section for anything unfinished.

**docs/database.md**: collections, fields, types, indexes, and the User → Case relationship (`cases.createdBy` references `users._id`) with a simple text diagram.

**docs/traceability.md**: at least these 3 rows (add more if useful) with the real file and function names from the code:

| ID | Requirement (input) | Implementation (output) | Verification |
|---|---|---|---|
| REQ-001 | Admin shall be able to create a case | `caseController.createCase` + `CaseForm` | Test: admin creates case |
| REQ-002 | Case Number shall be unique | Unique index + `caseValidator` rule | Test: duplicate rejected (422) |
| REQ-003 | Only Admin shall delete cases | `casePolicy.delete` + `authorize('delete')` | Test: viewer gets 403 |

**docs/code-walkthrough.md** (extra, for me): a beginner-friendly explanation of the request flow (route → middleware → validator → policy → controller → model → response), what each file does, and 15 likely interview questions with short answers about this project (JWT, bcrypt, middleware, Mongoose indexes, why 401 vs 403, CORS, mass assignment, NoSQL injection, pagination, testing with an in-memory DB, etc.).

**Postman collection**: export to `postman/medical-case-api.postman_collection.json` with all endpoints, an environment variable for `baseUrl` and `token`, and a login request that stores the token.

---

## 14. HOW TO WORK (process rules)

1. **First, show me a short plan** and the list of phases. Ask me nothing unless truly blocked; make reasonable assumptions and note them.
2. Build in these phases, running and verifying each before moving on:
   1. Repo init, `.gitignore`, folder structure, backend skeleton
   2. Models, indexes, DB config
   3. Auth (login, logout, revocable JWT, authenticate middleware)
   4. Policy + authorization middleware
   5. Case CRUD, validators, list search/filter/pagination, dashboard stats
   6. Seeder
   7. Backend tests (all passing)
   8. React app (auth, dashboard, list, form, details)
   9. Docs, Postman collection, README
   10. Bonus tasks
   11. Final full check
3. After each phase, give me a 3 to 5 line explanation of what was built and why, in simple language.
4. **Git**: initialise the repo and make a commit after every logical step. Use clear messages in this style, never "update", "changes", "final" or "fix":
   - `Initialize project structure and gitignore`
   - `Add User and Case Mongoose models with indexes`
   - `Add JWT login and logout with token revocation`
   - `Add case policy and authorization middleware`
   - `Add case CRUD API with form validators`
   - `Add search, status filter and pagination to case list`
   - `Add dashboard stats endpoint`
   - `Add seed script with dummy users and cases`
   - `Add backend feature tests`
   - `Add React login page and auth context`
   - `Add dashboard, case list, form and details pages`
   - `Add README, database and traceability docs`
   - `Add Postman collection`
   - (bonus commits: `Add engineer role`, `Add priority filter and sorting`, `Add Nager.Date holiday lookup`, `Add deployment doc`)
5. Never commit `.env`, real secrets, or `node_modules`.
6. At the end run: backend tests, the seed script, a manual smoke test of the API (login, create, duplicate, viewer delete 403, logout), and a production build of the frontend. Report the results.
7. Finish with a **final checklist** mapping every item of the assignment (features 1 to 5, API table, DB rules, validation, security, 6 tests, Git, README, docs, bonuses) to Done / Not done, with the file that proves it.

---

## 15. DEFINITION OF DONE

- Admin and Viewer can log in with the seeded credentials from the README; wrong credentials show a clear error.
- Guests cannot see any case page or call any case API.
- Dashboard counts, case list (pagination, search, status filter), create/edit (one reused form with per-field errors), and details page all work.
- Viewer cannot create, edit, change status, or delete, both in the UI and on the server (403).
- All API endpoints return the consistent JSON shape with correct status codes and field-level 422 errors.
- 6+ tests pass with `npm test`.
- README, `docs/database.md`, `docs/traceability.md`, Postman collection, and `.env.example` files are present.
- Clean Git history with meaningful commit messages, ready to push to a public GitHub repo.

Start now with the plan, then begin Phase 1.
