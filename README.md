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

Public registration accepts `candidate` or `recruiter`. Any other role, including `admin`, is rejected. The user model still lists `admin` as a possible value. Nothing in this branch creates that account or shows an admin screen.

| Role | What they can do |
| --- | --- |
| Candidate | Register, sign in, browse open jobs, read a recommended match, apply once, read the application timeline, edit a profile |
| Recruiter | Register, sign in, create and update their company, post and edit their jobs, rank applicants, move an application one legal stage |

Sign-in returns the account to its home. Candidates land on their home. Recruiters land on their hiring desk.

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

```bash
npm install
npm test
npm run dev
```

`npm test` starts an in-memory MongoDB and does not read `.env`. It checks ownership, a known match score, a skill gap, a salary miss, illegal stage changes, and pagination. GitHub Actions installs the backend dependencies and runs the same command on push and pull request. A failing test fails the workflow.

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

Job lists, recommendations, and applicant lists page with `limit` and `cursor`. The default page is 10 and the maximum is 50. The screens load the next page.

This branch does not include a live site, resume parsing, a kanban board, messages, interview scheduling, admin, or billing.
