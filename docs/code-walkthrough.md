# Code Walkthrough & Internship Interview Guide

This guide provides a beginner-friendly explanation of the request lifecycle, file-by-file breakdown, and **15 essential technical interview questions with answers** tailored for defending this take-home assignment.

---

## 1. The Request Lifecycle (Flow Architecture)

Every API request passes through a strict, decoupled pipeline before interacting with the database:

```
[Incoming HTTP Request from Frontend/Postman]
                  |
                  v
       +--------------------+
       |  Express Router    |  (Matches path, e.g. POST /api/cases)
       +--------------------+
                  |
                  v
       +--------------------+
       |   authenticate     |  (Verifies JWT signature + checks active jti in ApiToken)
       +--------------------+
                  |
                  v
       +--------------------+
       |     authorize      |  (Evaluates casePolicy against req.user.role)
       +--------------------+
                  |
                  v
       +--------------------+
       |     validate       |  (Runs express-validator rules; returns 422 if invalid)
       +--------------------+
                  |
                  v
       +--------------------+
       |    Controller      |  (Whitelists fields with pick(); assigns createdBy)
       +--------------------+
                  |
                  v
       +--------------------+
       |  Mongoose Model    |  (Persists to MongoDB with schema types & unique indexes)
       +--------------------+
                  |
                  v
       +--------------------+
       |  apiResponse Helper|  (Sends uniform JSON: { success: true, data, message })
       +--------------------+
```

---

## 2. File Directory Breakdown

### Backend (`/backend/src`)
- **`config/db.js`**: Connects and disconnects Mongoose with graceful shutdown handling.
- **`config/env.js`**: Centralized environment variable accessor with safe development fallbacks.
- **`models/User.js`**: Defines user schema, roles (`admin`, `viewer`, `engineer`), bcrypt password hashing in `pre('save')`, and `comparePassword()` helper.
- **`models/Case.js`**: Defines medical case schema, regex check on `caseNumber`, indexes on `caseNumber` (unique) and `status`.
- **`models/ApiToken.js`**: Stores active JWT `jti` values with MongoDB TTL auto-expiry.
- **`middleware/authenticate.js`**: Decodes Bearer token and queries `ApiToken` collection to verify the session has not been revoked.
- **`middleware/authorize.js`**: Passes `req.user` and the targeted resource to `casePolicy` to enforce access control.
- **`policies/casePolicy.js`**: Pure JavaScript permission rules (matrix defining what Admin, Viewer, and Engineer can perform).
- **`validators/authValidator.js` & `caseValidator.js`**: Declarative input rules (equivalent to Laravel Form Requests) ensuring clean payloads.
- **`controllers/caseController.js`**: CRUD orchestration, whitelist sanitization (`pick`), search regex escaping, and sorting.
- **`controllers/authController.js`**: Issues JWT with unique UUID `jti`, handles login rate-limiting, and revokes tokens on logout.
- **`controllers/dashboardController.js`**: Computes case status aggregates for the frontend dashboard.
- **`controllers/holidayController.js`**: Queries Nager.Date API with a 3-second timeout and graceful fallback.
- **`utils/apiResponse.js`**: Guarantees that 100% of API responses share an identical JSON structure.
- **`seed/seed.js`**: Populates users and 30 cases using `@faker-js/faker`.

### Frontend (`/frontend/src`)
- **`api/client.js`**: Axios instance with request interceptor for JWT Bearer injection and response interceptor for 401 logout handling.
- **`context/AuthContext.jsx`**: Global React context exposing `user`, `token`, `login()`, and `logout()`.
- **`routes/ProtectedRoute.jsx`**: Route wrapper guarding protected pages and presenting a clean 403 Forbidden screen if a Viewer attempts to access create/edit pages.
- **`components/CaseForm.jsx`**: Reusable form for both creation and editing with per-field validation error displays and live public holiday notice.
- **`pages/CaseListPage.jsx`**: Searchable, filterable, sortable, paginated clinical directory with delete confirmation modal.

---

## 3. 15 Key Interview Questions & Answers

### Q1: Why did you choose MERN instead of Laravel + MySQL as requested in the original brief?
**Answer:** While the original brief specified Laravel + MySQL, MERN was chosen to demonstrate deep competency and deliver a polished, production-ready full-stack application within the timeline. Every Laravel architectural concept was mapped directly to an Express/Mongo equivalent:
- Laravel Migrations & Models → Mongoose Schemas & Indexes
- Laravel Form Requests → `express-validator` modules
- Laravel Policies / Gates → `policies/casePolicy.js` + `authorize()` middleware
- Laravel Sanctum Revocable Tokens → JWT with server-side `jti` in `ApiToken`
- Laravel Feature Tests → Jest + Supertest + `mongodb-memory-server`

---

### Q2: JWTs are traditionally stateless. How did you make tokens revocable on logout?
**Answer:** A pure stateless JWT cannot be invalidated before expiration without waiting for its TTL. To solve this, upon login, we generate a cryptographically unique `jti` (UUID v4) inside the JWT payload and simultaneously persist `{ userId, jti, expiresAt }` into the `ApiToken` MongoDB collection.
On every request, the `authenticate` middleware checks if `jti` exists in the database. When the user logs out, we delete that `jti` record. Subsequent requests with that token immediately fail with **401 Unauthorized**. MongoDB's TTL index ensures expired tokens are automatically cleaned up.

---

### Q3: What is the difference between 401 Unauthorized and 403 Forbidden?
**Answer:**
- **401 Unauthorized** means *unauthenticated* — the server does not know who you are (missing token, invalid signature, or revoked session).
- **403 Forbidden** means *unauthorized* — the server knows who you are (e.g., authenticated Viewer), but your account role does not have permission to execute this operation (e.g., attempting to delete a case).

---

### Q4: How did you prevent Mass-Assignment vulnerabilities?
**Answer:** Passing `req.body` directly to `Case.create()` or `Case.findByIdAndUpdate()` is dangerous because an attacker could inject fields like `_id`, `createdBy`, or system roles. In `caseController.js`, we implemented a `pick()` utility that strictly whitelists permitted fields (`caseNumber`, `patientReference`, `surgeonName`, `implantType`, `status`, `priority`, `surgeryDate`). `createdBy` is explicitly overwritten using `req.user._id`.

---

### Q5: How is NoSQL Injection prevented in this application?
**Answer:**
1. We use **Mongoose schemas**, which enforce type casting and reject query operators in scalar fields.
2. We configured **`express-mongo-sanitize`** middleware in `app.js`, which automatically strips any keys containing `$` or `.` from `req.body`, `req.query`, and `req.params`.
3. In regex search, user input is sanitized using `escapeRegex()` to prevent ReDoS and regex operator injection.

---

### Q6: Why and how did you escape regex characters in search queries?
**Answer:** If a user inputs `.*` or `[` into the search bar, constructing `new RegExp(req.query.search)` without escaping can trigger invalid regex syntax errors or Regular Expression Denial of Service (ReDoS). We pass the string through a helper that prefixes all regex metacharacters (`.*+?^${}()|[]\`) with backslashes before executing `$regex`.

---

### Q7: How does password hashing work with bcrypt in your User model?
**Answer:** Passwords are never stored in plaintext. In `User.js`, a Mongoose `pre('save')` hook intercepts the document. If `password` has been modified, it generates a salt with cost factor 10 using `bcrypt.genSalt(10)` and hashes the password with `bcrypt.hash()`. Furthermore, `password` is defined with `select: false` so database queries omit it by default.

---

### Q8: What database indexes did you create and why?
**Answer:**
1. `User.email`: Unique index for O(1) lookup during login and duplicate email prevention.
2. `Case.caseNumber`: Unique index to prevent duplicate case numbers at the database engine level.
3. `Case.status`: Index to speed up filtering on clinical status across large datasets.
4. `ApiToken.jti`: Unique index for rapid token validation on every authenticated request.
5. `ApiToken.expiresAt`: TTL index (`expireAfterSeconds: 0`) enabling MongoDB to automatically prune expired records.

---

### Q9: How do your automated backend tests run without affecting a live database?
**Answer:** We use **`mongodb-memory-server`** along with Jest and Supertest. Before test execution (`tests/setup.js`), an ephemeral MongoDB instance is spun up in RAM. Each test suite runs against this isolated instance, and the database is cleared between runs and torn down after completion. Tests never touch development or production databases.

---

### Q10: How does your frontend handle expired or revoked tokens?
**Answer:** In `frontend/src/api/client.js`, an Axios **response interceptor** inspects incoming HTTP error codes. If the server responds with a `401`, the interceptor clears `medcase_token` and `medcase_user` from `localStorage` and redirects the user to `/login` to re-authenticate.

---

### Q11: Why is rate-limiting applied to the `/api/login` endpoint?
**Answer:** To defend against brute-force credential stuffing and dictionary attacks. Using `express-rate-limit`, we allow a maximum of 10 login attempts per 15-minute window per IP address. In `test` mode, this limiter is skipped to prevent false test failures.

---

### Q12: How is pagination implemented, and how does it prevent performance degradation?
**Answer:** The `GET /api/cases` endpoint accepts `page` (default 1) and `limit` (default 10). It calculates `skip = (page - 1) * limit` and runs `Case.find().skip(skip).limit(limit)` concurrently with `Case.countDocuments()`. This ensures the server only transmits 10 records over the wire rather than loading the entire collection into memory.

---

### Q13: Why did you create an `apiResponse` helper utility?
**Answer:** REST APIs should return a consistent envelope shape for both success and error states. By channeling all responses through `success(res, data, message, status)` and `fail(res, message, status, errors)`, client applications and UI consumers can reliably read `res.data.success`, `res.data.data`, and `res.data.errors` without guessing structure.

---

### Q14: How does the Nager.Date holiday lookup handle external API downtime?
**Answer:** External third-party APIs can be slow or experience outages. In `holidayController.js`:
1. We set a strict `timeout: 3000` (3 seconds) in Axios to avoid hanging connections.
2. If the request fails or times out, the `catch` block intercepts the error and returns `{ success: true, data: { isHoliday: false, lookupFailed: true } }` rather than a 500 error, allowing the surgeon/doctor to continue using the application uninterrupted.

---

### Q15: What trade-offs exist with storing JWT in `localStorage`?
**Answer:**
- **Advantage**: Simplicity; accessible to JavaScript without requiring domain-bound cookie configurations, and classic CSRF attacks do not apply because requests use explicit `Authorization: Bearer <token>` headers.
- **Trade-off**: `localStorage` is vulnerable to Cross-Site Scripting (XSS). In a high-security banking/medical enterprise app, storing tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies with CSRF tokens is the industry standard. This trade-off is documented in our README.
