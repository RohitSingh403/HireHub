# HireHub

> A full-stack job portal designed to connect job seekers and recruiters through a secure, role-based web application.

HireHub is a full-stack job portal built with React, Node.js, Express.js, and MongoDB.

The project is being developed incrementally with a focus on clean backend architecture, authentication, authorization, resource ownership, RESTful API design, and real-world application workflows.

---

## 🚀 Project Status

**Currently in active development**

The backend foundation and core job/application workflows are implemented and tested.

### Current Progress

- ✅ Backend server setup
- ✅ MongoDB database integration
- ✅ Environment configuration
- ✅ User registration
- ✅ User login
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Authentication middleware
- ✅ Role-based authorization
- ✅ Candidate role
- ✅ Recruiter role
- ✅ Admin role defined
- ✅ Company creation
- ✅ Company ownership validation
- ✅ Job creation
- ✅ Job listing
- ✅ Job details
- ✅ Job updating
- ✅ Job deletion
- ✅ Recruiter job ownership validation
- ✅ Candidate job applications
- ✅ Duplicate application prevention
- ✅ Candidate application history
- ✅ Recruiter applicant management
- ✅ Recruiter job ownership protection
- 🚧 Application status management
- 🚧 Advanced job search and filtering
- 🚧 Candidate profiles
- 🚧 Recruiter dashboards
- 🚧 Candidate dashboards
- 🚧 Frontend implementation
- 🚧 Production deployment

---

# 🎯 Project Objectives

HireHub aims to provide a realistic job marketplace where:

- Candidates can discover and apply for jobs.
- Recruiters can create and manage job postings.
- Recruiters can manage applications submitted to their jobs.
- Users are protected through JWT authentication.
- Access is controlled using role-based authorization.
- Resource ownership is enforced at the backend level.
- Applications are linked to candidates and jobs.
- The system follows a modular REST API architecture.
- The application can be extended into a production-ready platform.

---

# ✨ Core Features

## 👤 Authentication & Authorization

HireHub uses JWT-based authentication and role-based authorization.

### Implemented

- User registration
- User login
- Password hashing using bcrypt
- JWT token generation
- JWT authentication middleware
- Protected API routes
- Role-based authorization
- Candidate authorization
- Recruiter authorization
- Authenticated user information endpoint

### Supported Roles

```text
candidate
recruiter
admin
