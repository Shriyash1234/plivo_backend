# Status Page Backend

Backend service for the status page application. Provides REST APIs, JWT authentication, multi-tenant organization management, incident/service handling, and Socket.io real-time updates.

## Tech Stack
- Node.js (Express)
- MongoDB with Mongoose ODM
- Socket.io for WebSocket updates
- JSON Web Tokens for auth (swappable with external providers)

## Project Structure
```
backend/
├── server.js
├── .env.example
├── package.json
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    └── utils/
```

- **controllers**: HTTP boundary logic only.
- **services**: Business rules and orchestration.
- **models**: Mongoose schemas.
- **middleware**: Cross-cutting concerns (auth, validation, error handling).
- **routes**: Route -> controller wiring.
- **utils**: Shared infrastructure utilities (socket, event bus, slugify).

## Setup
1. Copy `.env.example` to `.env` and update values.
   - `MONGO_URI` – connection string for MongoDB
   - `CLIENT_URL` – comma-separated list of frontend origins allowed by CORS (e.g. `http://localhost:3000`)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The API listens on `PORT` (default 5000). `/health` returns a simple heartbeat.

## Authentication & Authorization
- Custom JWT auth with password-based login.
- Registration either creates a new organization (admin role) or consumes an invite token for an existing org.
- `authMiddleware.authenticate` guards private routes.
- `requireRole('admin')` enforces admin-only operations.
- Tokens encode `sub`, `organization`, and `role`.

## Core Domain

### Organizations
- Admins can create organizations and invite teammates.
- Invites generate a token that must be supplied during registration.
- Existing users without an organization can be added directly.

### Services
- CRUD endpoints scoped by organization.
- Status updates recorded in `statusHistory`.
- Emits `status:update` events for Socket.io clients.

### Incidents & Maintenance
- Support for ongoing incidents, scheduled maintenance (`incidentType`).
- Associates with one or more services.
- Status transitions tracked via `updates`.
- Resolution timestamps recorded.

### Public Status Page
- `/api/public/organizations` returns lightweight `{ id, name, slug }` records so frontends can show a directory of status pages.
- `/api/public/status?organizationId=<id-or-slug>` exposes:
  - organization metadata
  - overall status (derived from service health)
  - service list
  - active + past incidents
  - combined timeline of status/incident updates

## Socket.io
- Initialized in `server.js` via `utils/socket`.
- Listens to domain events emitted on the shared event bus.
- Broadcasts `status:update` to connected clients whenever services/incidents change.

## Available Scripts
- `npm start` – start in production mode
- `npm run dev` – run with Nodemon
- `npm run lint` – lint (configured once rules added)
- `npm test` – placeholder

## Next Steps
- Wire up automated tests (Jest or Vitest).
- Add rate limiting & audit logs.
- Enrich invites with expiry/window and email delivery.
- Integrate with external auth provider if desired (swap out auth service).
