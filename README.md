# RBAC Admin Dashboard

A **production-ready Role-Based Access Control (RBAC) Admin Dashboard** built with **Next.js, TypeScript, Prisma, and PostgreSQL**, featuring secure authentication, fine-grained permission management, and an AI-assisted admin command interface.

This project demonstrates **real-world access control design**, backend validation, frontend enforcement, and deployment-grade practices.

---

## 🧠 What is RBAC? (Explained Simply)

Imagine a school:

* **Students** can only enter their classroom
* **Teachers** can access all classrooms
* **The Principal** can access everything

Instead of giving everyone individual keys, we assign **roles**, and roles decide what actions are allowed.

That’s RBAC:

* **Users → Roles → Permissions**
* Easy to manage
* Hard to break
* Safe by default

---

## 🌐 Live Demo

🔗 **Live Application:** [https://rbac-admin-tool.vercel.app](https://rbac-admin-tool.vercel.app)

> Deployed on **Vercel** with a **Neon PostgreSQL** database. The demo showcases full RBAC functionality including authentication, role & permission management, and the AI command assistant.

---

## 🚀 Key Highlights

* 🔐 Secure JWT authentication with httpOnly cookies
* 🧩 Modular RBAC system (Users, Roles, Permissions)
* 🤖 AI Command Box for natural-language admin actions
* 🛡️ Backend + frontend safety checks (no trust in UI)
* 🧠 Edge-case handling (self-admin lockout prevention)
* 🌐 Cloud-ready PostgreSQL (Neon)
* ⚡ Deployed on Vercel (Production)

---

## 🛠 Tech Stack

### Frontend

* Next.js 16 (App Router)
* React 19
* TypeScript (Strict Mode)
* TailwindCSS

### Backend

* Next.js API Routes
* Prisma ORM v7
* PostgreSQL (Neon)

### Security & Auth

* JWT authentication
* httpOnly cookies
* bcrypt password hashing
* Middleware-based route protection

### DevOps

* Vercel deployment
* Environment-based configuration
* Prisma migrations

---

## 📁 Project Structure

```
RBAC-admin-tool/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── permissions/   # Permission CRUD
│   │   ├── roles/         # Role CRUD + mappings
│   │   └── users/         # User management
│   ├── dashboard/         # Protected dashboard pages
│   └── page.tsx           # Landing/login page
├── lib/
│   └── prisma.ts          # Prisma client singleton
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── middleware.ts          # Auth middleware
```

---

## 🧩 RBAC Design Principles

* Users **never** receive permissions directly
* Permissions are **only assigned to roles**
* Users gain access **only via roles**
* Admin role protections:

  * Automatically receives new permissions
  * Cannot remove its own admin access
  * Cannot be deleted accidentally

---

## 🤖 AI Command Assistant (Bonus Feature)

Admins can manage RBAC using **natural language**, safely.

### Example Commands

```
Create permission users.export
Assign users.read permission to Editor role
Assign Admin role to admin@rbac.com

Delete permission reports.test
```

### Safety Rules

* No ambiguous commands
* No implicit role creation
* No Admin role modification
* Allowlisted actions only
* Safe failure (no side effects on uncertainty)

If the AI is unsure → **no action is taken**

---

## 🔐 Authentication Flow

1. User logs in with email + password
2. Password verified using bcrypt
3. JWT generated and stored in httpOnly cookie
4. Middleware validates JWT for protected routes
5. Backend re-checks authorization on every request

> UI checks are **never trusted alone**

---

## 🧪 Demo Credentials

```
Email: admin@rbac.com
Password: admin123
Role: Admin
```

> Demo credentials are for **testing and portfolio use only**

---

## 📡 API Endpoints

### Authentication

* `POST /api/auth/signup`
* `POST /api/auth/login`
* `GET /api/auth/me`
* `POST /api/auth/logout`

### Permissions

* `GET /api/permissions`
* `POST /api/permissions`
* `PUT /api/permissions/[id]`
* `DELETE /api/permissions/[id]`

### Roles

* `GET /api/roles`
* `POST /api/roles`
* `PUT /api/roles/[id]`
* `DELETE /api/roles/[id]`
* `POST /api/roles/[id]/permissions`

### Users

* `GET /api/users`
* `POST /api/users/[id]/roles`
* `GET /api/users/[id]/roles`
* `DELETE /api/users/[id]`

### AI

* `POST /api/ai-command`

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  password   String
  created_at DateTime @default(now())
  user_roles UserRole[]
}

model Role {
  id         String   @id @default(uuid())
  name       String   @unique
  created_at DateTime @default(now())
  user_roles UserRole[]
  role_permissions RolePermission[]
}

model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  created_at  DateTime @default(now())
  role_permissions RolePermission[]
}

model UserRole {
  user_id String
  role_id String
  user    User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  role    Role @relation(fields: [role_id], references: [id], onDelete: Cascade)
  @@id([user_id, role_id])
}

model RolePermission {
  role_id       String
  permission_id String
  role          Role       @relation(fields: [role_id], references: [id], onDelete: Cascade)
  permission    Permission @relation(fields: [permission_id], references: [id], onDelete: Cascade)
  @@id([role_id, permission_id])
}
```

---

## ⚙️ Local Setup & Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/RBAC-admin-tool.git
cd RBAC-admin-tool
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@host:5432/dbname"
JWT_SECRET="your-strong-secret"
GEMINI_API_KEY="your_gemini_api_key"
```

---

### 4️⃣ Generate Prisma Client & Migrate DB

```bash
npx prisma generate
npx prisma migrate dev
```

---

### 5️⃣ Start Development Server

```bash
npm run dev
```

Open 👉 [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment (Vercel)

* Push code to GitHub
* Import repo into **Vercel**
* Add environment variables in Vercel Dashboard
* Deploy 🚀

✔️ Auto-deploy enabled on every push to `main`

---

## 🔒 Security Measures Implemented

* bcrypt password hashing
* JWT authentication with httpOnly cookies
* Backend authorization enforcement
* Middleware route protection
* Prisma ORM (SQL injection safe)
* Admin self-lockout prevention
* AI command allowlisting
* Environment-based secrets

> Backend **never trusts frontend input**

---

## 🧠 Real-World Edge Cases Handled

* Prevent deleting last Admin
* Prevent Admin removing own Admin role
* Prevent duplicate role/permission assignment
* Case-insensitive role & permission checks
* Safe rollback on partial failures
* AI command ambiguity → no mutation

---

## 🛠 Development Roadmap (Completed)

This project was built incrementally, following a structured, real-world development workflow.  
All phases listed below are **fully completed**.

### Phase 1: Database & Backend Foundation
- ✅ PostgreSQL setup using **Neon**
- ✅ Prisma schema design (Users, Roles, Permissions, mappings)
- ✅ Database migrations
- ✅ Environment configuration

### Phase 2: Authentication & Security
- ✅ Signup API with **bcrypt** password hashing
- ✅ Login API with **JWT-based authentication**
- ✅ httpOnly cookie implementation
- ✅ Authentication middleware for protected routes
- ✅ API testing using PowerShell scripts

### Phase 3: Core RBAC APIs
- ✅ Permission CRUD APIs
- ✅ Role CRUD APIs
- ✅ Role ↔ Permission mapping
- ✅ User ↔ Role assignment
- ✅ Comprehensive API testing

### Phase 4: Frontend Dashboard UI
- ✅ Login & Signup pages with form validation
- ✅ Dashboard layout with sidebar navigation
- ✅ Permissions management with CRUD modals
- ✅ Roles management with permission checkbox assignment
- ✅ Users management with role assignment
- ✅ Protected routes
- ✅ Logout functionality
- ✅ Clean, consistent UI design (no gradients)

### Phase 5: AI Command Assistant (Bonus)
- ✅ AI command input interface
- ✅ Natural language intent parsing
- ✅ Command → RBAC action mapping, such as:
  - `Create a role called Manager`
  - `Assign users.read permission to Editor role`
  - `Remove admin role from user@email.com`
- ✅ `/api/ai-command` endpoint
- ✅ Real-time command execution feedback
- ✅ Strict safety rules (allowlisting & safe failure)

### Phase 6: Polish & Deployment
- ✅ Centralized error handling
- ✅ Loading states & user feedback
- ✅ Responsive UI improvements
- ✅ Deployment on **Vercel**
- ✅ Production testing with real data

---

## 🎯 Why This Project Matters

This is **not CRUD demo code**.

This project demonstrates:

* Proper RBAC architecture
* Secure authentication patterns
* Backend-first authorization
* TypeScript + Prisma correctness
* Production debugging & deployment discipline
* Responsible AI usage in admin systems

Exactly what **real engineering teams expect**.

---

## 📄 License

MIT License

Feel free to fork, learn, and extend 🚀
