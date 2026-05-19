# LeadFlow — Backend API

A production-ready REST API for lead management built with Node.js, Express, and PostgreSQL.

## Live API
https://leadflow-backend-jxdn.onrender.com

## Features
- RESTful API with full CRUD operations
- PostgreSQL database hosted on Supabase
- Status pipeline: New → Contacted → Qualified → Closed
- Webhook endpoint with secret token authentication for external lead ingestion
- Filter leads by status via query params
- CORS configured for production frontend

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Render

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/leads` | Get all leads (filter by `?status=New`) |
| POST | `/leads` | Create a new lead |
| PATCH | `/leads/:id` | Update lead status |
| POST | `/webhook/lead` | Ingest lead from external source |

## Webhook Usage
Include the secret token in the request header:
x-webhook-secret: leadflow_secret_123

## Local Setup

```bash
# Clone the repo
git clone https://github.com/Rashiiibhanushali/leadflow-backend.git
cd leadflow-backend

# Install dependencies
npm install

# Create .env file
DATABASE_URL=your_supabase_connection_string
WEBHOOK_SECRET=your_secret
PORT=3000

# Run the server
node index.js
```

## Frontend
[leadflow-frontend](https://github.com/Rashiiibhanushali/leadflow-frontend)
