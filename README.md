# HireHub

HireHub is a job portal where candidates discover relevant open roles and recruiters run a hiring pipeline. A candidate saves a profile, sees why a role matches, and applies once. A recruiter posts jobs for a company they own and moves each application one stage at a time.

There is no hosted demo. Run it locally.

## Stack

| Layer | What it uses |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind |
| API | Node.js, Express |
| Data | MongoDB, Mongoose |
| Auth | JWT, bcrypt |

The browser talks to Express with Axios. Protected routes check the token, then the role, then the controller. Mongoose stores users, companies, jobs, and applications.

## Roles

Public registration accepts `candidate` or `recruiter`. Any other role, including `admin`, is rejected. The public register page cannot create an admin.

| Role | What they can do |
| --- | --- |
| Candidate | Register, sign in, browse open jobs, read a recommended match, apply once, read the application timeline, edit a profile |
| Recruiter | Register, sign in, create and update their company, post and edit their jobs, rank applicants, move an application one legal stage |
| Admin | Sign in at `/admin/login`, read stored counts, set another user's role to candidate or recruiter, and set a job to open or closed |

Candidates land on their home. Recruiters land on their hiring desk. An admin lands on `/admin`.

## Ownership

`owner` on a company and `createdBy` on a job are set from `req.user.userId` in the JWT. The request body cannot choose them.

A Mongoose `ref` does not prove the related document exists. Creating a job loads the company with `Company.findById` and checks that `company.owner` is the recruiter in the token. A missing company is 404. Another recruiter's company is 403.

Editing a job, or reading its applicants, requires `createdBy` to match the token. Another recruiter is 403. A missing id is 404.

A candidate can apply to an open job once. `Application` has a unique index on `{ candidate, job }`, and a second apply is 409.

## Explainable match

The match is deterministic. There is no model call. The profile stores skills, years of experience, preferred role, location, work mode, and a salary range. Preferred role is saved with the profile. It is not a scoring signal.

| Signal | Weight | Rule |
| --- | --- | --- |
| Skills | 50% | Matched required skills divided by required skills, times 100. Extra skills on the profile do not raise the score. |
| Experience | 20% | 100 when the candidate's years meet or exceed the job minimum. Otherwise candidate years divided by the minimum, times 100. |
| Location | 15% | 100 when the job is remote, or the cities match. Otherwise 0. A candidate who wants remote work scores 0 on an onsite job, even in the same city. |
| Salary | 15% | 100 when the two ranges overlap. Otherwise 0. |

The overall percent is that weighted sum, rounded to the nearest integer. The response lists matched skills and missing skills.

`GET /api/jobs/recommended` returns open jobs that have skills, highest overall first. A job with no skills is omitted. The same function ranks applicants for the recruiter who created the job. Another recruiter is 403 and does not receive a score.

A profile with React and CSS, 1 year, Bengaluru, hybrid, and 70,000–110,000 against a hybrid Bengaluru role that requires React and Node.js, 2 years, and 80,000–120,000 scores 65. Skills are 50, experience is 50, location and salary are 100. Node.js is the missing skill.

## Pipeline

An application is one of: applied, screening, shortlisted, interview, offer, hired, or rejected.

The recruiter may move one step forward, or reject from any stage that is not already hired or rejected:

- applied → screening or rejected
- screening → shortlisted or rejected
- shortlisted → interview or rejected
- interview → offer or rejected
- offer → hired or rejected

Skipping a stage, including applied → hired, is 400. hired and rejected do not change.

A new application starts at applied. `statusHistory` records each successful change with the status, the acting user's id, and a timestamp. The first entry is the candidate. Later entries are the recruiter. The candidate can read that timeline. A candidate cannot change the status.

## How to run it locally

Use Node.js 20 or newer and a MongoDB database. Do not commit `.env`.

```bash
cd backend
cp .env.example .env
```

Set these in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string. The example is `mongodb://127.0.0.1:27017/hirehub`. |
| `JWT_SECRET` | Long random string used to sign tokens. |
| `PORT` | API port. The example and the server default are `5001`. |
| `ADMIN_EMAIL` | Email for the one admin created at startup. Leave it empty to skip that step. |
| `ADMIN_PASSWORD` | Password for that admin. The API stores a hash and does not write this value to the log. |

```bash
npm install
npm test
npm run dev
```

`npm test` starts an in-memory MongoDB and does not read `.env`. It checks ownership, a known match score, a skill gap, a salary miss, illegal stage changes, pagination, and the admin rules: a missing token is 401, a candidate is 403, an expired or bad token is 401, an admin can read the report, an admin cannot change their own role, and registration still rejects admin. GitHub Actions installs the backend dependencies and runs the same command on push and pull request. A failing test fails the workflow.

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints. In development the app calls the API on the same origin: Axios uses `VITE_API_URL` when that variable is set, and otherwise uses a relative `/api` path. The Vite dev server proxies `/api` to `http://localhost:5001`. Point `VITE_API_URL` at the API origin only when the built frontend is served somewhere else.

## What a reviewer can click

1. Register as a recruiter. Create a company. Post a job and leave it open.
2. Sign out. Register as a candidate. Open jobs, then Recommended, and read the percent plus the matched and missing skills. Apply once. Apply again and read the error. Open the application and read the timeline.
3. Sign in as the recruiter. Open the job's applicants. They are ranked with the same match. Move the application one stage forward, or reject it.
4. Create the admin, then open the report. From Users, change the candidate to a recruiter. From Jobs, close the open role. Open `/admin` again in a private window and confirm it sends you to `/admin/login`.

Job lists, recommendations, applicant lists, and the admin lists page with `limit` and `cursor`. The default page is 10 and the maximum is 50. The screens load the next page.

## Admin

The public register page cannot create an admin. It only offers candidate and recruiter, and `POST /api/auth/register` rejects any other role, including `admin`.

The API creates one admin when it starts, and only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `backend/.env`. The password is stored as a bcrypt hash. The password is never written to the log. If a user with that email already exists, startup does nothing to that account.

1. Set `ADMIN_EMAIL` in `backend/.env`.
2. Set `ADMIN_PASSWORD` in `backend/.env`.
3. Restart the API.
4. Open `/admin/login`.
5. Sign in with those values.

A successful admin session lands on `/admin`. `/login` remains the candidate and recruiter sign-in.

Visiting `/admin`, `/admin/users`, `/admin/jobs`, or `/admin/companies` with no token redirects to `/admin/login`. A candidate or recruiter who opens those URLs gets a forbidden page. Those screens do not load admin records for them.

Before the admin screens render, the app calls `GET /api/auth/me`. If that call returns 401, the saved admin session is cleared and the browser returns to `/admin/login`.

The overview is the report. It shows real counts from the database: users by role, companies, jobs by status, and applications by status. There is no chart.

From the users table, an admin can set another user to candidate or recruiter. That route cannot set a role to admin, and it cannot change the signed-in admin's own role. The user list does not include the password hash.

From the jobs table, an admin can set a job to open or closed.

| Method | Path | Who | Result |
| --- | --- | --- | --- |
| GET | `/api/admin/stats` | Admin | Users by role, company count, jobs by status, applications by status |
| GET | `/api/admin/users` | Admin | One page of users, without password hashes |
| PATCH | `/api/admin/users/:id` | Admin | Role becomes `candidate` or `recruiter` |
| GET | `/api/admin/jobs` | Admin | One page of jobs, including status |
| PATCH | `/api/admin/jobs/:id` | Admin | Status becomes `open` or `closed` |
| GET | `/api/admin/companies` | Admin | One page of companies |

A missing token is 401. An expired or bad token is 401. Any role other than admin is 403.

This branch does not include a live site, resume parsing, a kanban board, messages, interview scheduling, billing, SSO, a security event log, or integrations.
