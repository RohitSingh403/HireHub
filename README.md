# 💼 HireHub

> A modern full-stack job portal that connects candidates and recruiters through a secure, role-based recruitment platform.

HireHub is a production-oriented full-stack web application designed to simulate a real-world recruitment ecosystem.

The platform provides separate workflows for **Candidates, Recruiters, and Administrators**, with JWT authentication, role-based authorization, ownership validation, job management, company management, and application tracking.

---

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication
- Secure password hashing with bcrypt
- Role-based access control
- Protected API routes
- Recruiter ownership validation
- Candidate-only application access
- Admin self-registration prevention
- Centralized error handling
- Duplicate resource detection
- MongoDB ObjectId validation

### 👨‍💻 Candidate

- Browse available jobs
- View individual job details
- Apply for jobs
- Prevent duplicate applications
- View personal applications
- Track application status

### 🏢 Recruiter

- Create and manage company profiles
- Create job listings
- Update job listings
- Delete job listings
- View applicants for owned jobs
- Update application status
- Manage recruitment workflow

### 📋 Application Management

Supported application statuses:

```text
Applied
   ↓
Shortlisted
   ↓
Hired

or

Applied
   ↓
Rejected