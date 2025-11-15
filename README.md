# Feedback Project

This workspace contains two apps:

Quick start (PowerShell):

```powershell
# Frontend
cd .\frontend
npm install
npm run dev

# In a separate terminal, Backend
cd ..\backend
npm install
npm run dev
```

Notes:
MySQL setup (local) and run:

1. Install MySQL and create database `feedback` (or let the server create it):

```powershell
# If you have mysql client, you can run:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS feedback;"
```

2. Copy `backend/.env.example` to `backend/.env` and set DB credentials.

3. Install and run backend:

```powershell
cd .\backend
npm install
# create .env from .env.example, then
npm run dev
```

4. Install and run frontend:

```powershell
cd ..\frontend
npm install
npm run dev
```

Notes:
- Backend will attempt to create the `feedback` database and the `feedbacks` table on startup if credentials allow.
- The backend exposes:
	- `POST /api/feedback` to add feedback (body: name, email, message, rating)
	- `GET /api/feedback` to list all feedbacks
	- `GET /api/stats` to get aggregated stats (total, avgRating, positive, negative)
