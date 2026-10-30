# VeriDoc AI — Production Intelligent Document Processing Platform

VeriDoc AI is an enterprise document intelligence and financial verification engine that automatically classifies, extracts, reconciles, and searches complex business documents.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │           React + Vite SPA             │
                      │          (Vercel Deployment)           │
                      └──────────────────┬─────────────────────┘
                                         │ Bearer JWT (Supabase Auth)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Node.js Express API           │
                      │         (Render Web Service)           │
                      └────────────┬─────────────┬─────────────┘
          Uploads Document Buffer  │             │ Enqueues Job
                                   ▼             ▼
    ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
    │     Supabase Private Storage    │   │       Supabase PostgreSQL       │
    │        bucket: "documents"      │   │  (10 Tables + RLS + Job Queue)  │
    └────────────────┬────────────────┘   └────────────────┬────────────────┘
                     │                                     │
                     │ Atomic RPC: claim_next_document_job │
                     ▼                                     ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                 Python AI Processing Engine                   │
        │                  (Render Background Worker)                   │
        │                                                               │
        │  1. PyMuPDF Digital Text & Selective Tesseract OCR            │
        │  2. Heuristic & Pattern Category Classification               │
        │  3. Gemini 2.5 Structured Extraction (google-genai SDK)        │
        │  4. Deterministic Financial & Reconciliation Validation       │
        │  5. Page-aware Token Chunking & Knowledge Grounding           │
        │  6. Atomic Result Persistence & Heartbeat Updates             │
        └───────────────────────────────────────────────────────────────┘
```

---

## Document Categories Supported

1. **Invoices**: Invoice number, dates, vendor details, customer details, tax ID, line-item arithmetic verification, tax/subtotal reconciliation.
2. **Bank Statements**: Bank name, account holder, masked account number, opening/closing balance, deposits, withdrawals, normalized transaction table, duplicate transaction detection, balance reconciliation.
3. **Purchase Orders**: PO number, order date, delivery date, buyer & supplier details, line items, grand total reconciliation.
4. **Large PDF Documents**: Page-by-page text extraction, OCR fallback, token-aware chunking, chunk summaries, overall document executive summary, full-text search, and natural-language Q&A with source citations.
5. **Unknown**: Graceful fallback category for unclassified business records.

---

## Database Migrations (Supabase PostgreSQL)

Execute the migrations in sequential order via the Supabase Dashboard SQL Editor or Supabase CLI:

1. `supabase/migrations/20260101000000_create_veridoc_schema.sql`
   - Creates tables: `profiles`, `documents`, `document_extractions`, `document_chunks`, `document_transactions`, `document_line_items`, `document_jobs`, `verification_records`, `audit_logs`, `document_relations`.
   - Enables Row Level Security (RLS) on all user-owned tables (`auth.uid() = user_id`).
   - Configures the private storage bucket `documents`.

2. `supabase/migrations/20260101000001_claim_job_rpc.sql`
   - Creates the atomic queue RPC `claim_next_document_job(p_worker_id, p_stale_minutes)` using `SELECT FOR UPDATE SKIP LOCKED`.
   - Creates heartbeat updater `update_job_heartbeat`.
   - Creates stale job recovery `reclaim_stale_jobs`.

---

## Environment Variables

### 1. Frontend (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Backend API (`backend/.env`)
```bash
NODE_ENV=development
PORT=5000
CLIENT_ORIGINS=http://localhost:5173,https://your-production-app.vercel.app
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MAX_FILE_SIZE_MB=25
MAX_UPLOAD_FILES=10
```

### 3. AI Worker (`ai-worker/.env`)
```bash
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_STORAGE_BUCKET=documents
JOB_POLL_INTERVAL_SECONDS=5
JOB_MAX_ATTEMPTS=3
JOB_STALE_AFTER_MINUTES=20
MAX_FILE_SIZE_MB=25
MAX_PDF_PAGES=200
MAX_OCR_PAGES=100
GEMINI_MAX_RETRIES=2
```

---

## Local Development Startup

### 1. Backend API
```bash
cd backend
npm install
npm run build
npm start
# Server listens on http://0.0.0.0:5000 (Health check: http://localhost:5000/health)
```

### 2. Frontend SPA
```bash
cd frontend
npm install
npm run build
npm run dev
# Vite runs at http://localhost:5173
```

### 3. Python AI Worker
```bash
cd ai-worker
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.worker
```

---

## Production Deployment Guide

### Vercel (Frontend)
1. Import repository on Vercel.
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api`
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-public-anon-key`
7. Deploy. `vercel.json` automatically guarantees single-page direct link routing (`/* -> /index.html`).

### Render (Backend Web Service)
1. Create a **New Web Service** connected to the repository.
2. Root Directory: `backend`.
3. Runtime: `Node`.
4. Build Command: `npm ci && npm run build`.
5. Start Command: `npm start`.
6. Health Check Path: `/health`.
7. Configure Environment Variables as specified in `backend/.env.example`.

### Render (Python AI Worker)
1. Create a **New Background Worker** connected to the repository.
2. Root Directory: `ai-worker`.
3. Runtime: `Docker` (using the provided `Dockerfile`).
4. Plan: `Standard` (Worker requires continuous background execution).
5. Configure Environment Variables as specified in `ai-worker/.env.example`.

Alternatively, deploy using the root blueprint:
```bash
render.yaml
```

