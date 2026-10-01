import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import { MAX_LIMIT, parseLimit } from "../services/pagination.js";

process.env.JWT_SECRET = "hirehub-test-secret";

const { default: app } = await import("../app.js");

function assertStatus(res, code) {
  assert.equal(
    res.status,
    code,
    `expected ${code}, got ${res.status}: ${JSON.stringify(res.body)}`,
  );
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function registerAndLogin(user) {
  const registered = await request(app).post("/api/auth/register").send(user);
  assertStatus(registered, 201);
  const loggedIn = await request(app).post("/api/auth/login").send({
    email: user.email,
    password: user.password,
    role: user.role,
  });
  assertStatus(loggedIn, 200);
  return loggedIn.body.token;
}

describe("pagination", () => {
  let mongo;
  let recruiterToken;
  let candidateToken;
  let companyId;
  let jobId;

  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    recruiterToken = await registerAndLogin({
      name: "Page Recruiter",
      email: "page-recruiter@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    candidateToken = await registerAndLogin({
      name: "Page Candidate",
      email: "page-candidate@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const profile = await request(app)
      .patch("/api/auth/me")
      .set(auth(candidateToken))
      .send({
        skills: ["React"],
        yearsOfExperience: 2,
        preferredRole: "Engineer",
        location: "Bengaluru",
        workMode: "hybrid",
        salaryMin: 80000,
        salaryMax: 120000,
      });
    assertStatus(profile, 200);

    const company = await request(app)
      .post("/api/companies")
      .set(auth(recruiterToken))
      .send({
        name: "Page Studio",
        description: "Pages of jobs.",
        website: "https://example.com",
        logo: "https://example.com/logo.png",
        location: "Bengaluru",
        industry: "Software",
        companySize: 10,
      });
    assertStatus(company, 201);
    companyId = company.body.company._id;

    for (let index = 1; index <= 12; index += 1) {
      const title = `Role ${String(index).padStart(2, "0")}`;
      const created = await request(app)
        .post("/api/jobs")
        .set(auth(recruiterToken))
        .send({
          title,
          description: "An open role for pagination.",
          company: companyId,
          location: "Bengaluru",
          employmentType: "full-time",
          workMode: "hybrid",
          salaryMin: 80000,
          salaryMax: 120000,
          skills: ["React"],
          experience: "2+ years",
          experienceMin: 2,
        });
      assertStatus(created, 201);
      jobId = created.body.job._id;
    }
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  it("keeps the default limit at 10 and the maximum at 50", () => {
    assert.equal(parseLimit(undefined), 10);
    assert.equal(parseLimit("10"), 10);
    assert.equal(parseLimit("1000"), MAX_LIMIT);
    assert.equal(parseLimit("0"), null);
    assert.equal(parseLimit("-3"), null);
    assert.equal(parseLimit("1.5"), null);
  });

  it("returns the next cursor for open jobs and a non-overlapping second page", async () => {
    const first = await request(app).get("/api/jobs");
    assertStatus(first, 200);
    assert.equal(first.body.allJobs.length, 10);
    assert.equal(typeof first.body.nextCursor, "string");

    const second = await request(app).get("/api/jobs").query({
      cursor: first.body.nextCursor,
    });
    assertStatus(second, 200);
    assert.equal(second.body.allJobs.length, 2);
    assert.equal(second.body.nextCursor, null);

    const seen = new Set(first.body.allJobs.map((job) => job._id));
    for (const job of second.body.allJobs) {
      assert.equal(seen.has(job._id), false);
      seen.add(job._id);
    }
    assert.equal(seen.size, 12);

    const oversized = await request(app).get("/api/jobs").query({ limit: 1000 });
    assertStatus(oversized, 200);
    assert.equal(oversized.body.allJobs.length, 12);
    assert.equal(oversized.body.nextCursor, null);

    const badLimit = await request(app).get("/api/jobs").query({ limit: 0 });
    assertStatus(badLimit, 400);

    const badCursor = await request(app).get("/api/jobs").query({ cursor: "nope" });
    assertStatus(badCursor, 400);
  });

  it("pages recommended jobs after scoring", async () => {
    const first = await request(app)
      .get("/api/jobs/recommended")
      .set(auth(candidateToken))
      .query({ limit: 10 });
    assertStatus(first, 200);
    assert.equal(first.body.jobs.length, 10);
    assert.equal(first.body.jobs[0].job.title, "Role 01");
    assert.equal(typeof first.body.nextCursor, "string");

    const second = await request(app)
      .get("/api/jobs/recommended")
      .set(auth(candidateToken))
      .query({ cursor: first.body.nextCursor });
    assertStatus(second, 200);
    assert.deepEqual(
      second.body.jobs.map((item) => item.job.title),
      ["Role 11", "Role 12"],
    );
    assert.equal(second.body.nextCursor, null);
  });

  it("pages a recruiter's applicants without dropping a row", async () => {
    const names = [];
    for (let index = 1; index <= 12; index += 1) {
      const name = `Applicant ${String(index).padStart(2, "0")}`;
      names.push(name);
      const token = await registerAndLogin({
        name,
        email: `applicant-${index}@hirehub.test`,
        password: "password123",
        role: "candidate",
      });
      const applied = await request(app)
        .post(`/api/jobs/${jobId}/apply`)
        .set(auth(token));
      assertStatus(applied, 201);
    }

    const first = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set(auth(recruiterToken));
    assertStatus(first, 200);
    assert.equal(first.body.applications.length, 10);
    assert.equal(typeof first.body.nextCursor, "string");

    const second = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set(auth(recruiterToken))
      .query({ cursor: first.body.nextCursor });
    assertStatus(second, 200);
    assert.equal(second.body.applications.length, 2);
    assert.equal(second.body.nextCursor, null);

    const listed = [...first.body.applications, ...second.body.applications].map(
      (application) => application.candidate.name,
    );
    assert.deepEqual(listed, names);
  });

  it("indexes the queries the list and lookup paths actually run", () => {
    const jobIndexes = Job.schema.indexes().map(([fields]) => fields);
    assert.ok(
      jobIndexes.some(
        (fields) =>
          fields.status === 1 &&
          fields.createdAt === -1 &&
          fields._id === -1 &&
          fields.employmentType === undefined &&
          fields.workMode === undefined,
      ),
    );
    assert.ok(
      jobIndexes.some(
        (fields) =>
          fields.status === 1 &&
          fields.employmentType === 1 &&
          fields.createdAt === -1 &&
          fields.workMode === undefined,
      ),
    );
    assert.ok(
      jobIndexes.some(
        (fields) =>
          fields.status === 1 &&
          fields.workMode === 1 &&
          fields.createdAt === -1 &&
          fields.employmentType === undefined,
      ),
    );
    assert.ok(
      jobIndexes.some(
        (fields) =>
          fields.status === 1 &&
          fields.employmentType === 1 &&
          fields.workMode === 1 &&
          fields.createdAt === -1,
      ),
    );

    const applicationIndexes = Application.schema.indexes().map(([fields]) => fields);
    assert.ok(
      applicationIndexes.some(
        (fields) => fields.candidate === 1 && fields.createdAt === -1,
      ),
    );
    assert.ok(applicationIndexes.some((fields) => fields.job === 1 && fields.candidate === undefined));
    assert.ok(
      applicationIndexes.some(
        (fields) => fields.candidate === 1 && fields.job === 1,
      ),
    );
  });
});
