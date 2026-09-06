# HireHub

> A full-stack job portal designed to connect job seekers with employers through a modern, secure, and scalable web application.

HireHub is a full-stack web application that provides a platform where users can discover job opportunities, create professional profiles, apply for jobs, and manage their applications.

The platform is being developed with a modular backend architecture and a modern React-based frontend.

---

## 🚀 Project Status

**Currently in development**  

The project is being developed incrementally, starting with the backend architecture and database integration, followed by authentication, job management, applications, and the frontend.

---

## 🎯 Objectives

The main objectives of HireHub are to:

- Provide a centralized platform for job seekers and recruiters.
- Allow candidates to search and apply for jobs.
- Allow recruiters to create and manage job postings.
- Provide role-based access for different types of users.
- Track job applications efficiently.
- Build a secure and scalable REST API.
- Provide a responsive and user-friendly interface.

---

## ✨ Planned Features

### 👤 Authentication & Authorization

- User registration and login
- Secure password hashing
- JWT-based authentication
- Role-based authorization
- Candidate and recruiter roles
- Protected routes

### 🔎 Job Search & Discovery

- Browse available jobs
- Search jobs by keywords
- Filter jobs by:
  - Location
  - Job type
  - Experience
  - Salary
  - Skills
- View detailed job information

### 💼 Job Management

Recruiters will be able to:

- Create job postings
- Update job postings
- Delete job postings
- Manage active job listings
- View applications for their jobs

### 📄 Applications

Candidates will be able to:

- Apply for jobs
- Track submitted applications
- View application status
- Manage their applications

Recruiters will be able to:

- View applicants
- Review applications
- Update application status

### 👨‍💼 User Profiles

Candidates will be able to manage:

- Personal information
- Skills
- Education
- Experience
- Resume
- Profile information

### 📊 Dashboards

Separate dashboards for:

**Candidates**  
- Applied jobs 
- Application status
- Profile management

**Recruiters**  
- Posted jobs 
- Applicants
- Application management
- Job statistics

---

# 🏗️ Architecture

HireHub follows a client-server architecture.

```text
                    HireHub
                       │
          ┌────────────┴────────────────────┐
          │                                 │
      Frontend                           Backend
          │                                 │
       React                            Express.js
          │                                 │
       Vite                              Routes
          │                                 │
       API Calls                        Controllers
          │                                 │
          │                             Mongoose
          │                                 │
          │                              MongoDB
          │
          └──────── HTTP / REST API ────────┘
