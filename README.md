# CampusCare

A premium campus support workflow with a React/Vite frontend and an Express/MongoDB Atlas backend.

## Features

- JWT authentication with `USER`, `STAFF`, and `ADMIN` authorization
- Automatic fixed admin seeding with a database-enforced single-admin constraint
- Staff registration and admin approval workflow
- Complaint creation, tracking, assignment, status updates, remarks, image evidence, and discussion
- Admin dashboard, staff dispatch dashboard, and user complaint dashboard
- Auth rate limiting, Helmet headers, validation, password hashing, and centralized errors

## Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster and database user
- An Atlas network access rule that permits the backend host

Local MongoDB is intentionally rejected. `MONGODB_URI` must start with `mongodb+srv://`.

## Configure

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=campuscare.service@gmail.com
ADMIN_PASSWORD=admin@123
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
```

The frontend does not need a `.env` file for local development because Vite proxies `/api` to the backend. For deployment, create `frontend/.env` when the API uses a different origin:

```env
VITE_API_URL=https://api.example.com/api
```

Change the default admin password in non-demo environments. The admin is seeded automatically when the API first starts.

## Run

In two terminals:

```powershell
cd backend
npm install
npm start
```

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Role Workflow

1. A user registers as **User** and can sign in immediately.
2. A staff member registers as **Staff** and must wait for admin approval.
3. The admin signs in using the configured fixed credentials and approves pending staff.
4. Users create complaints, admins assign verified staff, and staff update assigned work.

## API Summary

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/health`
- `GET /api/admin/pending-staff`, `PATCH /api/admin/approve-staff/:id`, `DELETE /api/admin/staff/:id`
- `GET /api/admin/stats`, `GET /api/admin/complaints`, `PATCH /api/admin/complaints/:id/assign`
- `POST /api/complaints`, `GET /api/complaints/my`, `GET /api/complaints/:id`
- `GET /api/staff/complaints`, `PATCH /api/staff/complaints/:id`, `PATCH /api/staff/remarks/:id`

## Verification

```powershell
cd frontend
npm run build
```

The backend can fully start only after a valid Atlas URI and JWT secret are supplied.
