📦 User Management & Authentication API

A production-ready User Authentication & Role-Based Access Control (RBAC) API built with Node.js, Express, TypeScript, MongoDB, JWT.

🚀 Features

JWT Authentication (cookie + bearer token)

Role-based access control (STUDENT, ADMIN, SUPER_ADMIN)

Secure login & logout

User CRUD operations

Fetch users by role

Soft delete users

Pagination & search

Dropdown-friendly user listing

Password hashing with bcrypt

🧱 Tech Stack

Node.js

Express

TypeScript

MongoDB + Mongoose

JWT

bcrypt

Cookie-based auth

🔐 User Roles
Role	Description
STUDENT	Basic user
ADMIN	Manage users (read-only)
SUPER_ADMIN	Full access (create, update, delete users)
🔑 Authentication
JWT Token

Stored in HTTP-only cookies

Also supports Authorization: Bearer <token>

Middleware

protect → ensures user is authenticated

authorize(...roles) → restricts access by role

📌 API Routes
🔑 Auth Routes
Method	Endpoint	Description	Access
POST	/sign-in	Login user	Public
POST	/sign-out	Logout user	Authenticated
GET	/me	Get logged-in user info	Authenticated
👤 User CRUD Routes
Method	Endpoint	Description	Access
GET	/users	Get all users (paginated)	ADMIN, SUPER_ADMIN
POST	/users	Create a new user	SUPER_ADMIN
GET	/users/:id	Get user by ID	Authenticated
PUT	/users/:id	Update user	Authenticated
DELETE	/users/:id	Soft delete user	SUPER_ADMIN
🎭 Users by Role
Method	Endpoint	Description	Access
GET	/users/role/:role	Get users by role	ADMIN, SUPER_ADMIN

Valid roles:

STUDENT
ADMIN
SUPER_ADMIN

📋 Dropdown Users
Method	Endpoint	Description	Access
GET	/users-dropdown	Get users for dropdown	Authenticated

Returns:

[
  { "_id": "...", "name": "John Doe" }
]

🔍 Pagination & Search
Query Params
GET /users?page=1&limit=10&search=john

Param	Description
page	Page number
limit	Items per page (max 100)
search	Search by name or email
🧾 Example Login Response
{
  "statusCode": 200,
  "data": {
    "_id": "64f1...",
    "email": "admin@example.com",
    "role": "ADMIN",
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}

⚙️ Environment Variables

Create a .env file:

PORT=5000
MONGO_URI=mongodb://localhost:27017/your-db
JWT_ACCESS_TOKEN_SECRET=your_super_secret_key
NODE_ENV=development

🛡️ Security Practices

Passwords hashed using bcrypt

JWT stored in HTTP-only cookies

Soft delete (isDeleted: true)

Role-based authorization

Password excluded from all responses

📁 Project Structure
src/
│── controllers/
│   └── user.controller.ts
│── models/
│   └── user.model.ts
│── middlewares/
│   └── authProtect.ts
│── routes/
│   └── user.routes.ts
│── utils/
│   ├── asyncHandler.ts
│   ├── ApiResponse.ts
│   └── errorResponse.ts
