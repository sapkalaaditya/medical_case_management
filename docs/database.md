# Database Architecture & Data Model Documentation

This document describes the database design, schema definitions, indexes, and entity relationships for the **Medical Case Management System** implemented with MongoDB and Mongoose.

---

## 1. Entity-Relationship Overview

The database contains three primary collections:
1. **`users`**: System users (Admins, Viewers, Biomedical Engineers).
2. **`cases`**: Surgical medical cases and implant specifications.
3. **`apitokens`**: Active server-side JWT session identifiers (`jti`) enabling instant token revocation on logout.

### Relationship Diagram

```
 +---------------------------------------------------+
 |                      users                        |
 +---------------------------------------------------+
 | _id            : ObjectId (PK)                    |
 | name           : String                           |
 | email          : String (Unique Index, Lowercase) |
 | password       : String (Bcrypt Hash, Hidden)     |
 | role           : Enum ('admin','viewer','engineer')|
 | createdAt      : Date                             |
 | updatedAt      : Date                             |
 +---------------------------------------------------+
                          | 1
                          |
                          | has many (createdBy)
                          v N
 +---------------------------------------------------+
 |                      cases                        |
 +---------------------------------------------------+
 | _id            : ObjectId (PK)                    |
 | caseNumber     : String (Unique Index, CASE-XXXX) |
 | patientReference: String (De-identified PT-XXXX)  |
 | surgeonName    : String                           |
 | implantType    : String                           |
 | status         : Enum (Index)                     |
 | priority       : Enum ('Low','Medium','High')     |
 | surgeryDate    : Date (Optional)                  |
 | createdBy      : ObjectId (FK -> users._id)       |
 | createdAt      : Date                             |
 | updatedAt      : Date                             |
 +---------------------------------------------------+
```

And for active tokens:

```
 +---------------------------------------------------+
 |                    apitokens                      |
 +---------------------------------------------------+
 | _id            : ObjectId (PK)                    |
 | userId         : ObjectId (FK -> users._id)       |
 | jti            : String (Unique Index, UUID v4)   |
 | expiresAt      : Date (TTL Index -> auto expires) |
 | createdAt      : Date                             |
 +---------------------------------------------------+
```

---

## 2. Collection Schemas in Detail

### 2.1 `users` Collection

Defined in [`backend/src/models/User.js`](file:///c:/Users/Aadi/Desktop/medical-case-management/backend/src/models/User.js).

| Field | Type | Required | Constraints & Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Primary Key generated automatically by MongoDB. |
| `name` | `String` | Yes | Trimming enabled; max length 100 characters. |
| `email` | `String` | Yes | Unique index, normalized to lowercase, validated against regex `^\S+@\S+\.\S+$`. |
| `password` | `String` | Yes | Bcrypt hash (min 6 chars before hash). Configured with `select: false` so it is never leaked in standard queries. |
| `role` | `String` | Yes | Enum: `['admin', 'viewer', 'engineer']`. Default: `'viewer'`. |
| `createdAt` | `Date` | Auto | Mongoose timestamp. |
| `updatedAt` | `Date` | Auto | Mongoose timestamp. |

**Indexes**:
- `email`: `1` (Unique index)

---

### 2.2 `cases` Collection

Defined in [`backend/src/models/Case.js`](file:///c:/Users/Aadi/Desktop/medical-case-management/backend/src/models/Case.js).

| Field | Type | Required | Constraints & Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Primary Key generated automatically by MongoDB. |
| `caseNumber` | `String` | Yes | Unique index. Pattern validated: `^CASE-\d{4,}$` (e.g., `CASE-0001`). |
| `patientReference` | `String` | Yes | De-identified clinical code (e.g., `PT-1042`). No real patient names stored. |
| `surgeonName` | `String` | Yes | Trimming enabled; max length 100 characters. |
| `implantType` | `String` | Yes | Trimming enabled; surgical implant model/spec. |
| `status` | `String` | Yes | Enum index: `['Draft', 'Planning', 'In Review', 'Approved', 'Completed', 'Cancelled']`. Default: `'Draft'`. |
| `priority` | `String` | Yes | Enum: `['Low', 'Medium', 'High']`. Default: `'Medium'`. |
| `surgeryDate` | `Date` | No | Optional scheduled date. Stored in ISO UTC format. |
| `createdBy` | `ObjectId` | Yes | References `users._id`. Strictly set on backend from authenticated session (`req.user._id`). |
| `createdAt` | `Date` | Auto | Mongoose timestamp; default sorting field. |
| `updatedAt` | `Date` | Auto | Mongoose timestamp. |

**Indexes**:
- `caseNumber`: `1` (Unique index — prevents duplicate clinical numbers at database level)
- `status`: `1` (Single field index — speeds up filtering by lifecycle phase)

---

### 2.3 `apitokens` Collection

Defined in [`backend/src/models/ApiToken.js`](file:///c:/Users/Aadi/Desktop/medical-case-management/backend/src/models/ApiToken.js).

| Field | Type | Required | Constraints & Description |
|---|---|---|---|
| `_id` | `ObjectId` | Yes | Primary Key. |
| `userId` | `ObjectId` | Yes | References `users._id`. Identifies the token owner. |
| `jti` | `String` | Yes | Unique index. Cryptographic UUID assigned to the JWT on issue. |
| `expiresAt` | `Date` | Yes | MongoDB TTL index (`expireAfterSeconds: 0`). Automatically pruned when expired. |
| `createdAt` | `Date` | Auto | Timestamp. |

**Indexes**:
- `jti`: `1` (Unique index — O(1) lookup during every authenticated request)
- `expiresAt`: `1` (TTL index — MongoDB background thread removes expired tokens automatically)

---

## 3. Data Integrity & Validation Rules

1. **Unique Case Numbers**:
   - Enforced at two layers:
     - **Mongoose / MongoDB Unique Index**: Prevents race conditions.
     - **Application Validator ([`caseValidator.js`](file:///c:/Users/Aadi/Desktop/medical-case-management/backend/src/validators/caseValidator.js))**: Checks existence before write and provides field-level `422 Unprocessable Entity` responses.
     - On updates, the validator excludes the document currently being modified.
2. **Mass-Assignment Protection**:
   - Controllers utilize explicit field whitelisting ([`pick`](file:///c:/Users/Aadi/Desktop/medical-case-management/backend/src/controllers/caseController.js)).
   - Fields like `createdBy`, `_id`, `__v`, and `role` cannot be overwritten by client payloads.
3. **Audit Trail**:
   - All cases retain their initial creator (`createdBy`) and modification timestamps (`createdAt`, `updatedAt`).
