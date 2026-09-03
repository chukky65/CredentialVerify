# Architecture

## Target Architecture

The application will transition from a client-side prototype to a full-stack production application. 

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router DOM (to be installed)
- **State Management:** React Query for server state, React Context for local UI state.
- **Styling:** Tailwind CSS v4

### Backend API (Proposed)
- **Framework:** Fastify or NestJS (TypeScript) running on Node.js LTS.
- **Hosting:** Google Cloud Run.
- **Communication:** RESTful JSON API documented via OpenAPI 3.1.

### Database
- **Engine:** PostgreSQL (Cloud SQL).
- **Access Layer:** Prisma or Drizzle ORM for typed queries.
- **Migrations:** Maintained migration system using the ORM.

### Document Storage
- **Storage:** Google Cloud Storage (Private Bucket).
- **Security:** Presigned URLs for temporary access. No public URLs. SHA-256 validation.

### Authentication & Authorization
- **Identity:** Google Cloud Identity Platform (OIDC).
- **Authorization:** Server-side RBAC (Role-Based Access Control) using JWT claims or DB-backed permissions.

### Background Processing
- **Queue:** Google Cloud Tasks or Pub/Sub for asynchronous processing (e.g., OCR extraction, report generation).
- **Secrets:** Google Secret Manager.
