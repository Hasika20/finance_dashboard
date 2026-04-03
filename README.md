# Finance Dashboard Backend

A Node.js backend for managing financial records and dashboard analytics. Built with Express, TypeScript, and Prisma.

## Prerequisites
- Node.js (v16+)
- npm

## Setup Instructions

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Database Setup:
The project uses SQLite for local development. Generate the Prisma client and run migrations:
\`\`\`bash
npm run generate
npm run migrate
\`\`\`

3. Seed the Database:
\`\`\`bash
npm run seed
\`\`\`

4. Run the Development Server:
\`\`\`bash
npm run dev
\`\`\`
The server will start on port 9000 by default.

## Usage Guide (Testing via Swagger)

With the server running, navigate to `http://localhost:9000/api-docs` in your browser. All API testing can be done interactively from there.

1. **Get an Access Token**
   - Scroll to the `POST /api/auth/login` endpoint.
   - Click "Try it out".
   - Use the seeded Admin credentials:
     ```json
     {
       "email": "admin@finance.com",
       "password": "password123"
     }
     ```
   - Click **Execute** and copy the long `token` string from the response.

2. **Authorize the Session**
   - Scroll to the very top of the page.
   - Click the green **Authorize** icon.
   - Paste the token directly into the box (no `Bearer ` prefix needed).
   - Click **Authorize** then **Close**.

3. **Test the Endpoints**
   - You can now test any protected endpoints. For example, open `GET /api/dashboard/summary`, click "Try it out", and click **Execute** to see the financial calculations!

## Running Tests
To run the automated integration test suite:
\`\`\`bash
npm test
\`\`\`

## API Documentation
Once the server is running, the Swagger API documentation is available at:
- http://localhost:9000/api-docs

## Tech Stack
- Express
- TypeScript
- Prisma ORM (SQLite)
- JSON Web Tokens (JWT)
- Jest & Supertest
