# SmartStock — React Frontend

Frontend web application for **SmartStock (Inventory & Order Management System)** built with React, Vite, Tailwind CSS, Axios, React Router, Recharts, and Lucide icons.

## Tech Stack

- **React 18** + **Vite 6** (JavaScript)
- **React Router DOM v7** — Client-side routing and role-based route guards
- **Axios** — Centralized HTTP client with JWT interceptor and error handling
- **Tailwind CSS v4** — Utility-first enterprise SaaS styling
- **Recharts** — Dashboard bar charts backed by live Spring Boot summary data
- **Lucide React** — Crisp UI icons
- **React Hot Toast** — Lightweight toast notifications

## Prerequisites

- **Node.js 20+** and **npm 10+**
- **SmartStock Spring Boot Backend** running on `http://localhost:8080`
- **PostgreSQL** database configured for the backend

## Environment Variables

Copy `.env.example` to `.env` inside `frontend/`:

```bash
cp .env.example .env
```

Available variables:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL of the Spring Boot REST API |

> Never commit `.env` files containing secrets. Only `.env.example` is tracked in Git.

## Installation & Running

```bash
cd frontend
npm install
npm run dev
```

The Vite development server starts on **http://localhost:5173** (`strictPort: true`), which matches the Spring Security CORS configuration (`app.cors.allowed-origins=http://localhost:5173`).

### Other Scripts

- `npm run build` — Creates a production bundle in `frontend/dist/`
- `npm run lint` — Runs ESLint across `src/`
- `npm run preview` — Previews the production build locally

## API Integration Architecture

All API calls live in `src/services/`:

- `api.js` — Shared Axios instance (`baseURL` from `VITE_API_BASE_URL`), attaches `Authorization: Bearer <token>`, handles `401` by clearing invalid sessions and emitting `smartstock:unauthorized`, and preserves `403` errors without logging the user out.
- `authService.js` — `POST /auth/login`, `POST /auth/register`
- `userService.js` — `GET /users/me`, `GET /users`, `GET /users/{id}`, `PATCH /users/{id}/status`, `PATCH /users/{id}/role`
- `categoryService.js` — `GET /categories`, `POST /categories`, `PUT /categories/{id}`, `PATCH /categories/{id}/status`
- `supplierService.js` — `GET /suppliers`, `POST /suppliers`, `PUT /suppliers/{id}`, `PATCH /suppliers/{id}/status`
- `productService.js` — `GET /products`, `GET /products/{id}`, `POST /products`, `PUT /products/{id}`, `PATCH /products/{id}/status`, `DELETE /products/{id}`
- `inventoryService.js` — `GET /inventory`, `GET /inventory/low-stock`, `PATCH /inventory/{productId}`, `GET /inventory/{productId}/history`
- `orderService.js` — `POST /orders`, `GET /orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status`, `PATCH /orders/{id}/cancel`
- `dashboardService.js` — `GET /dashboard/summary`

## Authentication & Authorization Flow

1. **Login / Registration**:
   - Public registration (`POST /api/auth/register`) always creates a `CUSTOMER` account (no role dropdown).
   - Login (`POST /api/auth/login`) returns a JWT (`token`, `tokenType`, `userId`, `name`, `email`, `role`).
   - Passwords are never stored in browser storage.
2. **Session Restoration**:
   - The JWT is stored in `localStorage` (`smartstock_token`).
   - *Security trade-off*: `localStorage` is simple for an educational SPA, though susceptible to XSS compared to `HttpOnly` cookies. To mitigate stale client state, on every page refresh `AuthContext` calls `GET /api/users/me` to verify the token and retrieve the authoritative user profile and role from the backend.
3. **Route Protection**:
   - `ProtectedRoute` ensures an authenticated session exists before rendering the app shell.
   - `RoleRoute` enforces role-specific routes (`ADMIN`, `STAFF`, `CUSTOMER`) and redirects unauthorized access to `/unauthorized`.
   - Backend `@PreAuthorize` and `SecurityConfig` remain the authoritative security boundary.

## Role-Based Navigation

- **ADMIN**: Dashboard, Products, Categories, Suppliers, Inventory, Low-Stock Alerts, Orders, Users, Profile
- **STAFF**: Products (read-only), Inventory (`ADD`/`REMOVE` only), Low-Stock Products, Orders (view, place for customer by ID, `CONFIRMED`/`PROCESSING` transitions), Profile
- **CUSTOMER**: Home Dashboard, Product Catalog (active items only; internal stock counts & suppliers hidden), Shopping Cart, My Orders (view & cancel `PENDING`/`CONFIRMED`), Profile
