# SmartStock — Deployment Guide

This guide covers deploying **SmartStock** using the following cloud architecture:

- **Database**: [Neon](https://neon.tech) (Managed PostgreSQL with SSL)
- **Backend API**: [Render](https://render.com) (Docker Web Service from `backend/Dockerfile`)
- **Frontend UI**: [Vercel](https://vercel.com) (Vite + React SPA from `frontend/`)

---

## 1. Architecture Overview

```text
Browser (HTTPS)
   │
   ▼
Vercel (React + Vite SPA)
   │  VITE_API_BASE_URL=https://<render-service>.onrender.com/api
   ▼
Render (Docker Container: Spring Boot 4 / Java 21)
   │  DB_URL=jdbc:postgresql://<neon-host>/<dbname>?sslmode=require
   ▼
Neon (PostgreSQL 16+ with SSL)
```

---

## 2. Step-by-Step Neon PostgreSQL Setup

1. Sign in to **Neon** and create a new project (for example, `smartstock-prod`).
2. Select a region close to your planned **Render** region (for example, Singapore or US East) to minimize database latency.
3. Open your Neon project **Connection Details** and copy:
   - **Host** (for example, `ep-example-123456.ap-southeast-1.aws.neon.tech`)
   - **Database name** (for example, `neondb` or `smartstock`)
   - **Role / Username** (for example, `neondb_owner`)
   - **Password**
4. Convert the Neon connection details into a **JDBC URL with SSL enabled**:

   ```text
   jdbc:postgresql://<neon-host>/<dbname>?sslmode=require
   ```

   **Example:**
   ```text
   jdbc:postgresql://ep-example-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   > **Important:** Do **not** embed the username or password inside `DB_URL`. Pass them separately in `DB_USERNAME` and `DB_PASSWORD`, and do not switch the prefix away from `jdbc:postgresql://`.

5. **Schema & Roles Initialization:**
   - You do **not** need to run manual `CREATE TABLE` scripts.
   - When the Spring Boot backend boots against the fresh Neon database with `spring.jpa.hibernate.ddl-auto=update`, Hibernate creates all tables (`users`, `roles`, `categories`, `suppliers`, `products`, `inventory_adjustments`, `orders`, `order_items`) and constraints.
   - `DataInitializer` automatically seeds the `ADMIN`, `STAFF`, and `CUSTOMER` roles on startup.

---

## 3. Generate a Production JWT Secret

`JwtService` decodes `JWT_SECRET` using **Base64** (`Decoders.BASE64.decode(secret)`) and signs tokens with **HMAC-SHA256** (requiring at least 256 bits / 32 bytes).

Generate a fresh production secret (do not reuse your local dev secret):

- **Git Bash / macOS / Linux:**
  ```bash
  openssl rand -base64 32
  ```
- **PowerShell:**
  ```powershell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }) -as [byte[]])
  ```
  *(Or use a cryptographically strong generator such as `System.Security.Cryptography.RandomNumberGenerator` in .NET / `openssl rand -base64 32`.)*

---

## 4. Render Backend Deployment

You can deploy either via the included `render.yaml` Blueprint or manually in the Render Dashboard.

### Option A: Manual Web Service Setup (Recommended for First Setup)

1. Push your repository to GitHub (`https://github.com/Indraik/SmartStock`).
2. In **Render Dashboard**, click **New +** → **Web Service**.
3. Connect the `Indraik/SmartStock` GitHub repository and select branch `main`.
4. Configure the service settings:
   - **Name**: `smartstock-backend` (or your preferred name)
   - **Runtime / Language**: `Docker`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `./Dockerfile` (relative to `backend`)
   - **Instance Type**: `Free` (or paid tier for zero cold starts)
   - **Health Check Path**: Leave blank (default TCP port check) so Spring Security's `denyAll()` fallback does not fail HTTP `/` probes.
5. Add the **Environment Variables** below before creating the service.

### Render Environment Variables

| Key | Value / Format | Required | Notes |
|---|---|---|---|
| `DB_URL` | `jdbc:postgresql://<neon-host>/<dbname>?sslmode=require` | Yes | Neon JDBC URL with SSL |
| `DB_USERNAME` | `<neon-username>` | Yes | Neon database role |
| `DB_PASSWORD` | `<neon-password>` | Yes | Neon database password |
| `JWT_SECRET` | `<base64-encoded-256bit-secret>` | Yes | Generated via `openssl rand -base64 32` |
| `CORS_ALLOWED_ORIGINS` | `https://<your-app>.vercel.app` | Yes | Add your Vercel URL once deployed (comma-separated, no trailing slash) |
| `JPA_SHOW_SQL` | `false` | Recommended | Avoids verbose SQL logs in production |
| `JPA_FORMAT_SQL` | `false` | Recommended | Cleaner production logs |
| `PORT` | *(Auto-injected by Render)* | Auto | `application.properties` binds `server.port=${PORT:8080}` |

6. Deploy the service and wait for the multi-stage Maven + Java 21 Docker build to finish.
7. Copy your live Render URL, for example:
   ```text
   https://smartstock-backend.onrender.com
   ```

---

## 5. Vercel Frontend Deployment

1. In **Vercel Dashboard**, click **Add New...** → **Project** and import `Indraik/SmartStock`.
2. Configure **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable**:

   | Name | Value | Environment |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` | Production (and Preview if desired) |

   > **Important:** Do **not** add trailing slashes after `/api`, and never put secrets in `VITE_*` variables because Vite embeds them in client-side JavaScript.

4. Click **Deploy**.
5. Client-side routing is already handled by `frontend/vercel.json`, which rewrites all paths (`/(.*)`) to `/index.html` so refreshing pages like `/admin/orders` or `/customer/catalog` works cleanly.

---

## 6. Production CORS Configuration

Once Vercel assigns your production URL (for example, `https://smartstock-ui.vercel.app`):

1. Open **Render Dashboard** → your backend service → **Environment**.
2. Set `CORS_ALLOWED_ORIGINS` to your exact Vercel origin (no trailing slash):
   ```text
   https://smartstock-ui.vercel.app
   ```
   To allow both Vercel production and local Vite development during testing:
   ```text
   https://smartstock-ui.vercel.app,http://localhost:5173
   ```
   > Never use `*` in production. `SecurityConfig.java` reads `CORS_ALLOWED_ORIGINS` as a comma-separated list and allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` with `Authorization` and `Content-Type` headers.
3. Save the environment variable; Render will automatically redeploy or restart the backend with the updated origin.

---

## 7. Initial Administrator Account Creation

Public registration (`POST /api/auth/register`) always creates `CUSTOMER` accounts and never accepts a role parameter. To create your first `ADMIN` account securely after deployment:

1. Open your deployed Vercel app at `https://<your-app>.vercel.app/register`.
2. Register an account using your chosen admin name, email, and strong password (8–72 characters). This creates the user row in Neon with a proper BCrypt password hash.
3. Open **Neon Dashboard** → **SQL Editor** and run:

   ```sql
   UPDATE users
   SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN'),
       updated_at = NOW()
   WHERE email = 'your-admin-email@example.com';
   ```

4. Verify the update:
   ```sql
   SELECT u.id, u.name, u.email, r.name AS role, u.enabled
   FROM users u
   JOIN roles r ON u.role_id = r.id
   WHERE u.email = 'your-admin-email@example.com';
   ```
5. Sign in at `https://<your-app>.vercel.app/login`. You will land on `/admin/dashboard` and can then manage `STAFF` and `CUSTOMER` accounts from **Users** in the Admin UI.

---

## 8. Deployment Verification Checklist

1. **Backend Reachability**:
   - Visit `https://<your-render-service>.onrender.com/api/products` in a browser or `curl`.
   - Expected response: `401 Unauthorized` JSON (`{"status":401,"message":"Authentication required"}`), confirming Spring Boot and Spring Security are live.
2. **CORS Preflight**:
   ```bash
   curl -i -X OPTIONS https://<your-render-service>.onrender.com/api/auth/login \
     -H "Origin: https://<your-app>.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type"
   ```
   Expected: `200 OK` with `Access-Control-Allow-Origin: https://<your-app>.vercel.app`.
3. **End-to-End Flows in Browser**:
   - Register a customer account and verify login works.
   - Sign in as the promoted `ADMIN` account, create a category, supplier, and product, and verify Dashboard summary loads.
   - Sign in as a `STAFF` user (promoted by Admin via Users page), test `ADD`/`REMOVE` inventory adjustment and order confirmation.
   - Sign in as a `CUSTOMER`, add an item to cart, place an order, refresh `/customer/orders`, and verify Vercel rewrite keeps the route loaded without 404.

---

## 9. Common Deployment Errors & Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Login shows *"Unable to reach the server"* or browser console logs CORS error | `CORS_ALLOWED_ORIGINS` missing, wrong URL, or has a trailing `/` | Set `CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app` in Render (no trailing `/`). |
| Frontend requests go to `http://localhost:8080/api` or fail with empty base URL | `VITE_API_BASE_URL` was not set before Vercel built the app | Set `VITE_API_BASE_URL` in Vercel **Environment Variables** and trigger a **Redeploy**. |
| 404 Not Found on page refresh (e.g. `/admin/dashboard`) | Missing SPA rewrite rules on Vercel | Ensure `frontend/vercel.json` is committed and Root Directory in Vercel is `frontend`. |
| Render build fails or container fails to bind port | `PORT` not bound or wrong Root Directory | Ensure Render Root Directory is `backend`, Dockerfile Path is `./Dockerfile`, and `application.properties` has `server.port=${PORT:8080}`. |
| Backend fails at startup with PostgreSQL SSL / auth error | Malformed `DB_URL` or wrong Neon credentials | Use `jdbc:postgresql://<host>/<db>?sslmode=require` and verify `DB_USERNAME`/`DB_PASSWORD`. |
| `JwtService` startup failure (`WeakKeyException` or Base64 error) | `JWT_SECRET` is not valid Base64 or shorter than 32 decoded bytes | Generate a 32-byte Base64 secret using `openssl rand -base64 32`. |
| First request after idle period takes 30–60s | Render Free tier cold start | Wait up to 60 seconds for the container to wake up and retry. |

---

## 10. Local Development Instructions

### Backend (Local PostgreSQL)
```powershell
cd D:\Projects\SmartStock\backend
$env:DB_PASSWORD="your_local_postgres_password"
$env:JWT_SECRET="your_local_base64_jwt_secret"
.\mvnw.cmd spring-boot:run
```
Defaults in `application.properties`:
- `DB_URL`: `jdbc:postgresql://localhost:5432/smartstock`
- `DB_USERNAME`: `postgres`
- `PORT`: `8080`
- `CORS_ALLOWED_ORIGINS`: `http://localhost:5173`

### Frontend (Local Vite Dev Server)
```powershell
cd D:\Projects\SmartStock\frontend
cp .env.example .env
npm install
npm run dev
```
The dev server runs on `http://localhost:5173`.
