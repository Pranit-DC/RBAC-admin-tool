# RBAC Admin Dashboard

A full-stack Role-Based Access Control (RBAC) management system built with Next.js, TypeScript, Prisma, and PostgreSQL. Secure, scalable, and production-ready.

## RBAC Explanation (For a Kid)

RBAC is like a school where teachers have keys to all classrooms, students can only enter their own classroom, and the principal can go everywhere. Each person gets a "role" (teacher, student, principal) that decides what doors they can open. Instead of giving everyone their own special key, we just say "all teachers can do this" and "all students can do that" – making it simple and safe!

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM 7
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT + httpOnly Cookies, bcrypt
- **Deployment**: Vercel (ready)

---

## Project Structure

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

## Development Roadmap

### Phase 1: Database & Backend (COMPLETE)
- [x] PostgreSQL setup (Neon)
- [x] Prisma schema design (5 models)
- [x] Database migrations
- [x] Environment configuration

### Phase 2: Authentication (COMPLETE)
- [x] Signup API with bcrypt hashing
- [x] Login API with JWT generation
- [x] httpOnly cookie implementation
- [x] Auth middleware for protected routes
- [x] API testing via PowerShell scripts

### Phase 3: Core RBAC APIs (COMPLETE)
- [x] Permission CRUD APIs
- [x] Role CRUD APIs
- [x] Role ↔ Permission mapping
- [x] User ↔ Role assignment
- [x] Comprehensive API testing

### Phase 4: Frontend UI (COMPLETE)
- [x] Login/Signup pages with form validation
- [x] Dashboard layout with sidebar navigation
- [x] Permissions management table with CRUD modals
- [x] Roles management with permission checkbox assignment
- [x] Users management with role assignment
- [x] Protected route implementation
- [x] Logout functionality
- [x] Clean, consistent UI design (no gradients)

### Phase 5: AI Command Box (BONUS - IN PROGRESS)
- [x] AI command input interface
- [x] Natural language intent parsing
- [x] Map commands to CRUD operations:
  - "Create a role called Manager"
  - "Assign users.read permission to Editor role"
  - "Remove admin role from user@email.com"
- [x] API endpoint `/api/ai-command`
- [x] Real-time command execution feedback

### Phase 6: Polish & Deploy
- [ ] Error handling improvements
- [ ] Loading states & user feedback
- [x] Responsive design enhancements
- [ ] Vercel deployment
- [ ] Production testing with real data

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/RBAC-admin-tool.git
cd RBAC-admin-tool
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secure_random_secret_key"
```

### 4. Run Database Migrations
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔑 Test Credentials

```
Email: admin@rbac.com
Password: admin123
Role: Admin (all permissions)
```

---

## 🧪 API Testing

Test the APIs using the included PowerShell scripts:

```powershell
# Test authentication
.\test-api.ps1        # Signup API
.\test-login.ps1      # Login API

# Test RBAC functionality
.\test-rbac-apis.ps1  # Full RBAC workflow
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login & get JWT
- `GET /api/auth/me` - Get current user

### Permissions
- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create permission
- `GET /api/permissions/[id]` - Get permission details
- `PUT /api/permissions/[id]` - Update permission
- `DELETE /api/permissions/[id]` - Delete permission

### Roles
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create role
- `GET /api/roles/[id]` - Get role details
- `PUT /api/roles/[id]` - Update role
- `DELETE /api/roles/[id]` - Delete role
- `POST /api/roles/[id]/permissions` - Assign permissions to role
- `GET /api/roles/[id]/permissions` - Get role's permissions

### Users
- `GET /api/users` - List all users
- `POST /api/users/[id]/roles` - Assign roles to user
- `GET /api/users/[id]/roles` - Get user's roles

---

## 🗄️ Database Schema

```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  password   String
  created_at DateTime @default(now())
  user_roles UserRole[]
}

model Role {
  id         String         @id @default(uuid())
  name       String         @unique
  created_at DateTime       @default(now())
  user_roles UserRole[]
  role_permissions RolePermission[]
}

model Permission {
  id          String         @id @default(uuid())
  name        String         @unique
  description String?
  created_at  DateTime       @default(now())
  role_permissions RolePermission[]
}

model RolePermission {
  role_id       String
  permission_id String
  role          Role       @relation(...)
  permission    Permission @relation(...)
  @@id([role_id, permission_id])
}

model UserRole {
  user_id String
  role_id String
  user    User @relation(...)
  role    Role @relation(...)
  @@id([user_id, role_id])
}
```

---

## Security Features

- JWT-based authentication
- httpOnly cookies (XSS protection)
- bcrypt password hashing (10 rounds)
- Middleware route protection
- CORS configuration
- SQL injection prevention (Prisma ORM)
- Environment variables for sensitive data
- `.env` excluded from version control

> **Security Note**: This README shows API endpoints and schema design for educational/portfolio purposes. All sensitive credentials (DATABASE_URL, JWT_SECRET) are stored in `.env` file which is **never committed** to the repository. The test credentials are for demo purposes only.
---

## License

MIT

---
