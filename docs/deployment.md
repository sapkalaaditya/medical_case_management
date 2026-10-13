# Deployment Architecture & Production Hosting Guide

This document outlines the cloud production architecture on **Amazon Web Services (AWS)** and provides a practical, step-by-step guide for deploying on free cloud hosting tiers (**MongoDB Atlas + Render + Vercel**).

---

## Part 1: Production AWS Enterprise Architecture

In an enterprise healthcare/biomedical setting, the MERN stack application would be hosted using AWS managed services to guarantee high availability, HIPAA-readiness, and zero-downtime rolling upgrades.

```
                  +----------------------------------+
                  |         AWS Route 53 (DNS)       |
                  +----------------------------------+
                                   |
                  +----------------------------------+
                  |  AWS CloudFront / ALB + ACM      |
                  |  (HTTPS SSL Termination)         |
                  +----------------------------------+
                     /                            \
                    /                              \
  [Static Frontend Assets]               [REST API Traffic]
  +-------------------------+            +----------------------------+
  |    Amazon S3 Bucket     |            |    AWS EC2 (Node.js App)   |
  |  (Vite Build Artifacts) |            |  - Nginx (Reverse Proxy)   |
  +-------------------------+            |  - PM2 (Process Cluster)   |
                                         +----------------------------+
                                                        |
                                          (VPC Peering / Private Subnet)
                                                        |
                                         +----------------------------+
                                         |    MongoDB Atlas / AWS     |
                                         |    DocumentDB Replica Set  |
                                         +----------------------------+
```

### 1. Compute & Application Server (Amazon EC2)
- **Node.js Runtime with PM2**:
  - Node.js LTS running under **PM2** in cluster mode (`pm2 start src/server.js -i max`), enabling automatic crash restarts, zero-downtime reloads, and multi-core utilization.
- **Nginx Reverse Proxy**:
  - Nginx acts as the front-facing web server on port 80/443, proxying API requests (`/api/*`) to PM2 on port 5000 (`http://127.0.0.1:5000`).
  - Nginx handles rate limiting buffers, Gzip/Brotli compression, and SSL termination.

### 2. Database Layer: MongoDB Atlas vs AWS DocumentDB (vs RDS)
- **Primary Database: MongoDB Atlas (or AWS DocumentDB)**:
  - In a MERN stack, MongoDB Atlas provides native JSON schema validation, automated daily backups, point-in-time recovery, and multi-region replica sets.
  - *Comparison Note*: In the original Laravel architecture, **Amazon RDS (MySQL)** would be used. In MERN, **MongoDB Atlas** or **Amazon DocumentDB** (MongoDB-compatible) serves as the direct equivalent.
  - Atlas cluster is locked within a Private Subnet and connected to EC2 via **AWS VPC Peering** or **AWS PrivateLink**.

### 3. Frontend Hosting: Amazon S3 + CloudFront
- The React Vite production build (`frontend/dist/`) is deployed to an **Amazon S3** bucket configured for static website hosting with index fallback.
- **Amazon CloudFront** CDN is positioned in front of S3 for worldwide edge caching, DDoS protection (AWS Shield Standard), and sub-100ms response times.

### 4. Secrets Management & Environment Security
- Application secrets (`MONGO_URI`, `JWT_SECRET`, admin credentials) are stored securely in **AWS Systems Manager (SSM) Parameter Store** (SecureString) or **AWS Secrets Manager**.
- EC2 instances retrieve secrets on boot using an attached **IAM Role with least-privilege policies** — zero secrets are baked into Git or machine images.

### 5. Network Security & HTTPS
- **Security Groups**:
  - EC2 instance: Inbound port 443/80 from Application Load Balancer only; SSH (port 22) restricted to corporate VPN / AWS Systems Manager Session Manager (no open bastion).
  - MongoDB: Inbound port 27017 restricted strictly to the EC2 security group.
- **SSL / TLS**: Automated TLS 1.3 certificates provisioned via **AWS Certificate Manager (ACM)** or Let's Encrypt via Certbot.

---

## Part 2: Step-by-Step Free-Tier Deployment (MongoDB Atlas + Render + Vercel)

For demonstrations and take-home evaluations, the application can be deployed 100% free with the following click-by-click instructions:

### Step 1: Provision MongoDB Database on MongoDB Atlas
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0 sandbox).
3. Under **Security → Database Access**, create a user `medcase_app` with password and role `readWriteAnyDatabase`.
4. Under **Security → Network Access**, add IP address `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect → Drivers → Node.js** and copy your connection string:
   ```
   mongodb+srv://medcase_app:<password>@cluster0.abcde.mongodb.net/medical_cases?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend on Render
1. Push this repository to GitHub.
2. Sign in to [render.com](https://render.com) with GitHub.
3. Click **New + → Web Service** and select this repository.
4. Fill in the build settings:
   - **Name**: `medical-case-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
5. In the **Environment Variables** section, add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGO_URI` | *Your Atlas connection string from Step 1* |
   | `JWT_SECRET` | *Generate a strong 32+ character random string* |
   | `JWT_EXPIRES_IN` | `24h` |
   | `CLIENT_URL` | *Leave empty initially; update in Step 4 with Vercel URL* |
   | `NAGER_API_URL` | `https://date.nager.at/api/v3` |
   | `ADMIN_NAME` | `Admin User` |
   | `ADMIN_EMAIL` | `admin@medical.local` |
   | `ADMIN_PASSWORD` | `AdminPassword123!` |
   | `VIEWER_NAME` | `Dr. Viewer` |
   | `VIEWER_EMAIL` | `viewer@medical.local` |
   | `VIEWER_PASSWORD` | `ViewerPassword123!` |
   | `ENGINEER_NAME` | `Biomedical Engineer` |
   | `ENGINEER_EMAIL` | `engineer@medical.local` |
   | `ENGINEER_PASSWORD` | `EngineerPassword123!` |
6. Click **Create Web Service**.
7. Once deployed, open the Render **Shell** tab and run:
   ```bash
   npm run seed
   ```
   This populates the Atlas database with the seeded users and 30 cases.
8. Copy your Render backend URL (e.g., `https://medical-case-api.onrender.com`).

### Step 3: Deploy Frontend on Vercel
1. Sign in to [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New… → Project** and import this repository.
3. Set project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://medical-case-api.onrender.com/api` (Render backend URL + `/api`) |
5. Click **Deploy**. Vercel will run `vite build` and assign a live URL (e.g., `https://medical-case-management.vercel.app`).

### Step 4: Finalize CORS Setting
1. Return to **Render → Dashboard → medical-case-api → Environment**.
2. Update `CLIENT_URL` to your Vercel URL (e.g., `https://medical-case-management.vercel.app`).
3. Click **Save Changes** (Render will automatically redeploy).
4. Visit your Vercel app and log in with `admin@medical.local` / `AdminPassword123!`.
