# HireHub

HireHub is a small job portal with two working roles. A candidate registers, sees only open jobs, and applies once. A recruiter creates a company, posts jobs, and moves applicants one stage at a time: applied, screening, shortlisted, interview, offer, then hired, or rejected from any open stage.

## Architecture

```text
React (Vite) → Axios → Express route
  → auth, then role, then controller
  → Mongoose → MongoDB
```

Authentication answers who you are. Authorization answers what you may do. Protected routes run `authMiddleware`, then `roleMiddleware`, then the controller. A missing or invalid token stops at auth with 401. A valid token with the wrong role stops at the role check with 403. The controller then returns 400 for bad input, 404 for a missing record, and 403 when the record belongs to someone else.

| Piece | Choice |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind, Zustand, Axios, React Hook Form, Zod |
| Backend | Node.js, Express (ES modules), MongoDB, Mongoose, JWT, bcrypt |
| Entities | User, Company, Job, Application |

A recruiter owns a company. A company has jobs. A job receives applications from candidates.

## Roles

| Role | What they can do |
| --- | --- |
| Candidate | Register, log in, list open jobs, open one, apply once, read their applications, edit a profile, and read a ranked recommendation |
| Recruiter | Register, log in, create and update their company, create and edit their jobs, rank applicants, set application status |
| Admin | A valid role on the user model. Public registration rejects it. There is no admin UI. |

Login sends the account back to the matching home: candidates land on their home, recruiters land on their hiring desk.

## Ownership

`owner` on a company and `createdBy` on a job are set from `req.user.userId` in the JWT. The client body cannot choose them.

A Mongoose `ref` does not prove the related document exists. Job create loads the company with `Company.findById` and checks that `company.owner` is the recruiter in the token. A made-up company id is 404. Another recruiter’s company is 403.

The same rule applies when editing a job or reading its applicants: the job’s `createdBy` must match the token. Another recruiter gets 403. A missing id gets 404.

One candidate cannot apply twice to the same job. `Application` has a unique index on `{ candidate, job }`, and the apply controller rejects a second insert with 409.

## Explainable matching

The match is deterministic. There is no model call. A candidate profile stores skills, years of experience, preferred role, location, work mode, and a salary range. Preferred role is saved so the profile is complete. It is not a signal.

Four signals, fixed weights:

| Signal | Weight | Rule |
| --- | --- | --- |
| Skills | 50 | Matched required skills divided by required skills, times 100. Extra profile skills do not raise the score. The response lists matched and missing skills. |
| Experience | 20 | 100 when the candidate's years meet or exceed the job's minimum years. Otherwise candidate years divided by the minimum, times 100. |
| Location | 15 | 100 when the job is remote, or the cities match. Otherwise 0. Wanting remote while the job is onsite is 0, even in the same city. |
| Salary | 15 | 100 when the candidate range and the job range overlap. Otherwise 0. |

The overall percent is that weighted sum, rounded to the nearest integer. A job with no skills is omitted from `GET /api/jobs/recommended`. The list is open jobs only, highest overall first.

The same function ranks applicants on `GET /api/jobs/:jobId/applications`. Ownership is checked first: another recruiter is 403 and never receives a score. The creating recruiter gets each applicant's percent and the same breakdown.

A profile with React and CSS, 1 year, Bengaluru, hybrid, and 70,000–110,000 against a hybrid Bengaluru role that requires React and Node.js, 2 years, and 80,000–120,000 scores 65. Skills are 50, experience is 50, location and salary are 100. Node.js is the missing skill.

## Hiring pipeline

Stages move in order: applied → screening → shortlisted → interview → offer → hired. From any stage except hired or rejected, the recruiter may reject instead of advancing. The legal moves are:

- applied → screening or rejected
- screening → shortlisted or rejected
- shortlisted → interview or rejected
- interview → offer or rejected
- offer → hired or rejected

Skipping a stage, including applied → hired, is 400. hired and rejected accept no further change.

A new application starts at applied with one `statusHistory` entry: the status, the candidate's user id, and a timestamp. Every successful change appends another entry with the new status, the acting user's id, and a timestamp. Applications saved before this timeline, with status applied, shortlisted, rejected, or hired, still load.

The candidate can open the application and read that timeline. A candidate cannot change the status. Another recruiter is still 403.

## Job reads

`GET /api/jobs` and `GET /api/jobs/:id` use optional auth. They do not use `authMiddleware`.

- No `Authorization` header: the request stays anonymous and only `open` jobs are returned.
- A header that is present but invalid: 401.
- An open job: 200 for anyone.
- A draft or closed job by id: 200 only for the recruiter who created it. Everyone else gets 404, the same body as a missing job.

`authMiddleware` is unchanged. Routes that require a login still return 401 when the header is missing.

The public list accepts `keyword`, `location`, `employmentType`, and `workMode`. Employment type is `full-time`, `part-time`, `contract`, or `internship`. Work mode is `remote`, `hybrid`, or `onsite`. Keyword matches title, description, skills, and location with a case-insensitive regular expression. Location uses the same kind of expression. Those regex filters are not backed by an index.

Drafts and closed jobs are absent from that list, including for their owner. The owner loads them from `GET /api/jobs/mine` or by id.

## Pagination

`GET /api/jobs`, `GET /api/jobs/recommended`, and `GET /api/jobs/:jobId/applications` accept `limit` and `cursor`. The default limit is 10. A larger limit is capped at 50. A limit that is not a positive integer, and a cursor that cannot be read, are 400.

The response includes `nextCursor`. It is `null` when the page is the last one. Send that cursor back to load the following page. The open-job list is newest first (`createdAt`, then `_id`). The job list and the recommended screen append the next page.

Recommended jobs and applicants are scored, then sliced. Their order is overall match, then title or candidate name, then id. The cursor stores the last row's score, label, and id. The open-job query for recommendations still filters `status: "open"` before that in-memory slice.

## Indexes

Each index below matches a query the API actually runs.

| Index | Query |
| --- | --- |
| Job `{ status, createdAt, _id }` | Public list with no employment type or work mode, and `find({ status: "open" })` sorted newest first for recommendations |
| Job `{ status, employmentType, createdAt, _id }` | Public list when employment type is set |
| Job `{ status, workMode, createdAt, _id }` | Public list when work mode is set |
| Job `{ status, employmentType, workMode, createdAt, _id }` | Public list when both equality filters are set |
| Application `{ candidate, job }` unique | Duplicate apply lookup, and the one-application rule |
| Application `{ candidate, createdAt }` | `GET /api/applications/me`, a candidate's applications newest first |
| Application `{ job }` | Recruiter applicant lookup `find({ job })` before the match sort |

A text index on title and skills is still declared. The list does not use `$text`, so that index is not what keyword search hits.

## Security choices in this pass

- JWTs expire in 7 days (`expiresIn: "7d"` on login).
- `password` on the User model is `select: false`. Login loads it with `.select("+password")`. Other reads, including `GET /api/auth/me` and populated applicants, do not return the hash.

Helmet, rate limits, and stricter CORS are intentionally not in this pass.

## How to run

Use Node.js 20+ and a MongoDB database (local or Atlas). Do not commit `.env`.

```bash
cd backend
cp .env.example .env
```

Set `MONGO_URI` and a long `JWT_SECRET`. `PORT` defaults to `5001`, which matches the Vite proxy.

```bash
npm install
npm test
npm run dev
```

`npm test` starts an in-memory MongoDB. It does not use your `.env`. The suite checks: no token 401, wrong role 403, missing resource 404, another recruiter 403, owner success, and a second apply rejected. It also checks open-job reads, JWT expiry, that the password hash is hidden, a known match score, a skill gap, a salary miss, that a recruiter cannot rank another recruiter's applicants, an illegal stage skip, a rejection from screening, that a candidate cannot move an application, and that job, recommendation, and applicant pages return a next cursor without repeating a row.

GitHub Actions runs on push and pull request. The workflow installs backend dependencies with `npm ci` and runs `npm test`. A failing test fails the workflow.

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL. The dev server proxies `/api` to `http://localhost:5001`. For a built frontend on another origin, set `VITE_API_URL` to the API origin.

### Click-through

1. Register as a recruiter. Create a company. Post a job, including minimum years, and leave it open.
2. Log out. Register as a candidate. You land on your home. Save a profile, open Recommended, and read the percent plus the matched and missing skills. Open roles, filter the list, apply, then apply again and read the API error. Open My applications.
3. Log in as the recruiter. Open applicants, read the same breakdown, and move the application one stage forward. Log in as the candidate and open that application to read the timeline.

## API

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/register` | Public. `candidate` or `recruiter` only |
| POST | `/api/auth/login` | Public. Returns a JWT |
| GET | `/api/auth/me` | Any logged-in user |
| PATCH | `/api/auth/me` | Candidate profile. Does not change role |
| POST | `/api/companies` | Recruiter. `owner` comes from the token |
| GET | `/api/companies/me` | Recruiter. Their latest company, or 404 |
| PATCH | `/api/companies/:id` | Owning recruiter |
| GET | `/api/jobs` | Public, open jobs only. Optional filters. `limit` (default 10, max 50) and `cursor`. Returns `nextCursor` |
| GET | `/api/jobs/mine` | Recruiter. Includes draft and closed |
| GET | `/api/jobs/recommended` | Candidate. Open jobs with a score breakdown, highest first. Jobs with no skills are omitted. `limit` and `cursor` |
| GET | `/api/jobs/:id` | Public if open. Creator if draft or closed |
| POST | `/api/jobs` | Recruiter who owns the company |
| PATCH | `/api/jobs/:id` | Creating recruiter |
| DELETE | `/api/jobs/:id` | Creating recruiter |
| POST | `/api/jobs/:jobId/apply` | Candidate, once, and only if the job is open |
| GET | `/api/applications/me` | Candidate |
| GET | `/api/applications/:id` | Owning candidate. Includes the timeline |
| GET | `/api/jobs/:jobId/applications` | Creating recruiter. Applicants ranked by the same match. Each row includes the legal next statuses. `limit` and `cursor` |
| PATCH | `/api/applications/:id/status` | Creating recruiter. One stage forward, or rejected. Skip is 400 |

## Out of scope

Admin screens, the AMC Monitoring Portal, and extra security middleware beyond JWT expiry and hiding the password hash.
