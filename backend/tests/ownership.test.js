import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import User from "../models/User.js";

process.env.JWT_SECRET = "hirehub-test-secret";

const { default: app } = await import("../app.js");

function assertStatus(res, code) {
  assert.equal(
    res.status,
    code,
    `expected ${code}, got ${res.status}: ${JSON.stringify(res.body)}`,
  );
}

async function registerAndLogin({ name, email, password, role }) {
  const registered = await request(app).post("/api/auth/register").send({
    name,
    email,
    password,
    role,
  });
  assertStatus(registered, 201);

  const loggedIn = await request(app).post("/api/auth/login").send({
    email,
    password,
    role,
  });
  assertStatus(loggedIn, 200);
  assert.equal(loggedIn.body.user.password, undefined);

  const payload = JSON.parse(
    Buffer.from(loggedIn.body.token.split(".")[1], "base64url").toString(),
  );
  assert.equal(typeof payload.exp, "number");
  assert.ok(payload.exp > payload.iat);

  return loggedIn.body.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function companyBody(name) {
  return {
    name,
    description: "A product studio that ships hiring tools.",
    website: "https://example.com",
    logo: "https://example.com/logo.png",
    location: "Bengaluru",
    industry: "Software",
    companySize: 12,
  };
}

function jobBody(companyId, overrides = {}) {
  return {
    title: "Frontend Engineer",
    description: "Build the candidate experience with React.",
    company: companyId,
    location: "Bengaluru",
    employmentType: "full-time",
    workMode: "hybrid",
    salaryMin: 60000,
    salaryMax: 90000,
    skills: ["React", "Node.js"],
    experience: "2+ years",
    ...overrides,
  };
}

describe("HireHub ownership", () => {
  let mongo;

  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  it("hides the password hash and expires JWTs", async () => {
    const token = await registerAndLogin({
      name: "Hash Check",
      email: "hash@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const stored = await User.findOne({ email: "hash@hirehub.test" });
    assert.equal(stored.password, undefined);

    const withHash = await User.findOne({ email: "hash@hirehub.test" }).select(
      "+password",
    );
    assert.match(withHash.password, /^\$2/);

    const me = await request(app).get("/api/auth/me").set(auth(token));
    assertStatus(me, 200);
    assert.equal(me.body.password, undefined);

    const expired = jwt.sign(
      {
        userId: stored._id.toString(),
        role: "candidate",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      process.env.JWT_SECRET,
    );
    const rejected = await request(app)
      .get("/api/jobs")
      .set(auth(expired));
    assertStatus(rejected, 401);
  });

  it("treats email case as the same account", async () => {
    const registered = await request(app).post("/api/auth/register").send({
      name: "Case User",
      email: "Case.User@HireHub.test",
      password: "password123",
      role: "candidate",
    });
    assertStatus(registered, 201);

    const loggedIn = await request(app).post("/api/auth/login").send({
      email: "case.user@hirehub.test",
      password: "password123",
      role: "candidate",
    });
    assertStatus(loggedIn, 200);
    assert.equal(loggedIn.body.user.email, "case.user@hirehub.test");

    const duplicate = await request(app).post("/api/auth/register").send({
      name: "Case User",
      email: "CASE.USER@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    assertStatus(duplicate, 409);

    const missingPassword = await request(app).post("/api/auth/login").send({
      email: "case.user@hirehub.test",
      role: "candidate",
    });
    assertStatus(missingPassword, 401);
  });

  it("returns only open jobs unless the creating recruiter asks by id", async () => {
    const ownerToken = await registerAndLogin({
      name: "Owner Recruiter",
      email: "owner-reads@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const otherToken = await registerAndLogin({
      name: "Other Recruiter",
      email: "other-reads@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const candidateToken = await registerAndLogin({
      name: "Read Candidate",
      email: "candidate-reads@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const company = await request(app)
      .post("/api/companies")
      .set(auth(ownerToken))
      .send(companyBody("Read Studio"));
    assertStatus(company, 201);

    const openJob = await request(app)
      .post("/api/jobs")
      .set(auth(ownerToken))
      .send(
        jobBody(company.body.company._id, {
          title: "Open Platform Engineer",
          location: "Austin",
          workMode: "remote",
          skills: ["Go"],
        }),
      );
    assertStatus(openJob, 201);

    const draftJob = await request(app)
      .post("/api/jobs")
      .set(auth(ownerToken))
      .send(
        jobBody(company.body.company._id, {
          title: "Secret Draft Role",
          status: "draft",
          location: "Pune",
          employmentType: "contract",
        }),
      );
    assertStatus(draftJob, 201);

    const publicList = await request(app).get("/api/jobs");
    assertStatus(publicList, 200);
    assert.ok(publicList.body.allJobs.every((job) => job.status === "open"));
    assert.ok(
      publicList.body.allJobs.some((job) => job.title === "Open Platform Engineer"),
    );
    assert.equal(
      publicList.body.allJobs.some((job) => job.title === "Secret Draft Role"),
      false,
    );

    const filtered = await request(app).get("/api/jobs").query({
      keyword: "Platform",
      location: "Austin",
      employmentType: "full-time",
      workMode: "remote",
    });
    assertStatus(filtered, 200);
    assert.equal(filtered.body.allJobs.length, 1);
    assert.equal(filtered.body.allJobs[0].title, "Open Platform Engineer");

    const draftId = draftJob.body.job._id;
    const hidden = await request(app).get(`/api/jobs/${draftId}`);
    assertStatus(hidden, 404);
    assert.equal(hidden.body.msg, "Job not found");

    const ownerView = await request(app)
      .get(`/api/jobs/${draftId}`)
      .set(auth(ownerToken));
    assertStatus(ownerView, 200);
    assert.equal(ownerView.body.job.status, "draft");

    const otherView = await request(app)
      .get(`/api/jobs/${draftId}`)
      .set(auth(otherToken));
    assertStatus(otherView, 404);

    const candidateView = await request(app)
      .get(`/api/jobs/${draftId}`)
      .set(auth(candidateToken));
    assertStatus(candidateView, 404);

    const missing = await request(app).get(
      `/api/jobs/${new mongoose.Types.ObjectId()}`,
    );
    assertStatus(missing, 404);

    const invalid = await request(app)
      .get("/api/jobs")
      .set({ Authorization: "Bearer not-a-token" });
    assertStatus(invalid, 401);

    const presentButEmpty = await request(app)
      .get(`/api/jobs/${openJob.body.job._id}`)
      .set({ Authorization: "Bearer " });
    assertStatus(presentButEmpty, 401);

    const mine = await request(app).get("/api/jobs/mine").set(auth(ownerToken));
    assertStatus(mine, 200);
    assert.equal(mine.body.jobs.length, 2);
  });

  it("enforces token, role, and ownership on create and apply", async () => {
    const ownerToken = await registerAndLogin({
      name: "Job Owner",
      email: "owner-jobs@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const otherToken = await registerAndLogin({
      name: "Rival Recruiter",
      email: "rival@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const candidateToken = await registerAndLogin({
      name: "Applicant",
      email: "applicant@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const noToken = await request(app)
      .post("/api/jobs")
      .send(jobBody(new mongoose.Types.ObjectId().toString()));
    assertStatus(noToken, 401);
    assert.equal(noToken.body.error, "Access denied. No token provided.");

    const wrongRole = await request(app)
      .post("/api/jobs")
      .set(auth(candidateToken))
      .send(jobBody(new mongoose.Types.ObjectId().toString()));
    assertStatus(wrongRole, 403);

    const missingCompany = await request(app)
      .post("/api/jobs")
      .set(auth(ownerToken))
      .send(jobBody(new mongoose.Types.ObjectId().toString()));
    assertStatus(missingCompany, 404);

    const company = await request(app)
      .post("/api/companies")
      .set(auth(ownerToken))
      .send(companyBody("Owner Co"));
    assertStatus(company, 201);
    const companyId = company.body.company._id;

    const rivalCreate = await request(app)
      .post("/api/jobs")
      .set(auth(otherToken))
      .send(jobBody(companyId, { title: "Stolen Role" }));
    assertStatus(rivalCreate, 403);

    const created = await request(app)
      .post("/api/jobs")
      .set(auth(ownerToken))
      .send(jobBody(companyId, { title: "Owned Role" }));
    assertStatus(created, 201);
    const jobId = created.body.job._id;
    assert.equal(created.body.job.createdBy, JSON.parse(
      Buffer.from(ownerToken.split(".")[1], "base64url").toString(),
    ).userId);

    const missingJob = await request(app)
      .patch(`/api/jobs/${new mongoose.Types.ObjectId()}`)
      .set(auth(ownerToken))
      .send({ title: "Does not exist" });
    assertStatus(missingJob, 404);

    const rivalUpdate = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set(auth(otherToken))
      .send({ title: "Hijacked" });
    assertStatus(rivalUpdate, 403);

    const ownerUpdate = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set(auth(ownerToken))
      .send({ title: "Owned Role Updated" });
    assertStatus(ownerUpdate, 200);
    assert.equal(ownerUpdate.body.job.title, "Owned Role Updated");

    const salaryUpdate = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set(auth(ownerToken))
      .send({ salaryMin: 70000, salaryMax: 95000 });
    assertStatus(salaryUpdate, 200);
    assert.equal(salaryUpdate.body.job.salaryMin, 70000);
    assert.equal(salaryUpdate.body.job.salaryMax, 95000);

    const salaryMaxOnly = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set(auth(ownerToken))
      .send({ salaryMax: 110000 });
    assertStatus(salaryMaxOnly, 200);
    assert.equal(salaryMaxOnly.body.job.salaryMax, 110000);

    const invertedSalary = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set(auth(ownerToken))
      .send({ salaryMax: 1000 });
    assertStatus(invertedSalary, 400);

    const applyWithoutToken = await request(app).post(`/api/jobs/${jobId}/apply`);
    assertStatus(applyWithoutToken, 401);

    const recruiterApply = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set(auth(ownerToken));
    assertStatus(recruiterApply, 403);

    const firstApply = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set(auth(candidateToken));
    assertStatus(firstApply, 201);

    const secondApply = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set(auth(candidateToken));
    assertStatus(secondApply, 409);
    assert.match(secondApply.body.msg, /already applied/i);
  });
});
