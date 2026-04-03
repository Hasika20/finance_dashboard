# Finance Dashboard Backend

This repository contains the backend implementation for a Finance Dashboard platform. It is designed to evaluate API design, data modeling, role-based access control (RBAC), and architecture layout. The application is built entirely in strict **TypeScript**, utilizing **Express.js** and the **Prisma ORM** backed by a local SQLite database for ease of evaluation.

---

## 🛠 Features Implemented

1. **User and Role Management (RBAC)**
   - Secure Authentication using JWT and bcrypt password hashing.
   - Distinct roles: `ADMIN`, `ANALYST`, and `VIEWER`.
   - Admins can manage users, assign roles, and deactivate compromised accounts.
2. **Financial Records Management**
   - Full CRUD APIs for managing records (Amount, Date, Type, Category, Description).
   - "Soft Delete" architecture: deleted records are hidden and retained for auditing rather than permanently removed.
   - Dynamic query endpoints supporting pagination (`page`, `limit`), sorting (`sortBy`), date filtering (`startDate`, `endDate`), and keyword searching.
3. **Dashboard Analytics**
   - **Summary aggregations:** Calculates total income, total expenses, and current net balance directly via optimized Prisma database-level calculations.
   - **Category breakdown:** Calculates the financial footprint and distribution across predefined categories.
   - **Financial Health Score:** A custom dynamic algorithm determining financial stability.
4. **Resilient Error Handling & Validation**
   - Uses **Zod** schema validation to catch bad user input cleanly before touching the database.
   - Wraps endpoints in a global error handler to standardize error codes globally natively.
5. **Code Testing**
   - Houses an isolated, automated integration testing suite written with **Jest** and **Supertest** ensuring all primary flows securely work.

---

## 📂 Project Structure

This project uses a highly scalable module/layer-based architecture separating HTTP routing from internal business logic. 

```text
src/
├── config/           # Environment variable loading and Prisma connection
├── middlewares/      # Interceptors (Zod Validator, Error Handler, JWT Auth / RBAC Authorize)
├── modules/          # Feature domains
│   ├── auth/         # Login, Registration & Profile routes/controllers/services
│   ├── dashboard/    # Analytics calculation routes/controllers/services
│   ├── records/      # Financial records routes/controllers/services
│   └── users/        # User management routes/controllers/services
├── types/            # Global custom TypeScript definitions (e.g., Express Request extensions)
├── utils/            # Helper functions for standardizing JSON responses and pagination
├── __tests__/        # Automated integration testing suite 
├── app.ts            # Core Express app setup (Middlewares, Route Mounting)
├── server.ts         # Server bootstrapper
└── swagger.ts        # OpenAPI / Swagger specification configuration
```

---

## 🚀 Step-by-Step Setup Guide

Follow these exact steps to run the project locally.

### 1. Prerequisites
- **Node.js** (v16.0 or higher recommended)
- **npm** (comes with Node)

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy the example). 
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="finance-dashboard-super-secret-key"
JWT_EXPIRES_IN="7d"
PORT=9000
NODE_ENV="development"
```

### 3. Install Dependencies
Install all required Node modules.
```bash
npm install
```

### 4. Database Setup & Seeding
This project uses an embedded SQLite database (`dev.db`). Initialize the Prisma schema, apply migrations, and populate the database with mock realistic testing data:
```bash
# Generate the Prisma client types
npm run generate

# Create the SQLite tables
npm run migrate

# Insert fake financial records and setup the original Admin accounts
npm run seed
```

### 5. Start the Server
Run the local Typescript development server:
```bash
npm run dev
```
*(The server will immediately bind and start listening on `http://localhost:9000`)*

---

## 📖 Interacting with the API (Usage)

Once the server is booted, the easiest way to click through and test this backend is using the built-in Sandbox.

1. Open your web browser and navigate to: **`http://localhost:9000/api-docs`**. 
2. Scroll to the **Authentication** tab. Use the `POST /api/auth/login` endpoint.
3. Use the seeded Admin credentials to log in:
   ```json
   {
     "email": "admin@finance.com",
     "password": "password123"
   }
   ```
4. Copy the long `token` provided in the JSON response payload.
5. Scroll up to the **Authorize** icon (the green lock). Click it, and paste your token literally (do not add quotes or type "Bearer", Swagger handles that automatically).
6. Click **Authorize**.
7. You are now logged in permanently to the sandbox! You can open any other locked endpoint (like `GET /api/dashboard/summary`), click *Try it out*, hit execute, and the backend will process the request and return live database data.

---

## 🧪 Testing

This project comes equipped with programmatic integration tests validating the access control and aggregations.
Simply run:
```bash
npm run test
```
This command runs Jest without disrupting the local development loops and executes the entire testing block validating that API routes function successfully top to bottom.
