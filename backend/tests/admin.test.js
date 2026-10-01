import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import ensureAdmin from "../services/ensureAdmin.js";

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
  return loggedIn.body;
}

async function createAdmin() {
  const password = "admin-password-1";
  await User.create({
    name: "HireHub Admin",
    email: "admin@hirehub.test",
    password: await bcrypt.hash(password, 10),
    role: "admin",
  });
  const loggedIn = await request(app).post("/api/auth/login").send({
    email: "admin@hirehub.test",
    password,
    role: "admin",
  });
  assertStatus(loggedIn, 200);
  assert.equal(loggedIn.body.user.role, "admin");
  assert.equal(loggedIn.body.user.password, undefined);
  return loggedIn.body;
}

function companyBody(ownerId) {
  return {
    name: "Northwind",
    description: "A product studio that ships hiring tools.",
    website: "https://example.com",
    logo: "https://example.com/logo.png",
    location: "Bengaluru",
    industry: "Software",
    companySize: 12,
    owner: ownerId,
  };
}

function jobBody(companyId, createdBy, overrides = {}) {
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
    createdBy,
    ...overrides,
  };
}

describe("Admin API", () => {
  let mongo;

  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  after(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  beforeEach(async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    await Promise.all([
      Application.deleteMany({}),
      Job.deleteMany({}),
      Company.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  it("returns 401 when no token is sent", async () => {
    const paths = [
      "/api/admin/stats",
      "/api/admin/users",
      "/api/admin/jobs",
      "/api/admin/companies",
    ];

    for (const path of paths) {
      const res = await request(app).get(path);
      assertStatus(res, 401);
    }

    const patched = await request(app)
      .patch("/api/admin/users/507f1f77bcf86cd799439011")
      .send({ role: "recruiter" });
    assertStatus(patched, 401);
  });

  it("returns 403 for a candidate", async () => {
    const candidate = await registerAndLogin({
      name: "Ava Candidate",
      email: "ava@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const paths = [
      "/api/admin/stats",
      "/api/admin/users",
      "/api/admin/jobs",
      "/api/admin/companies",
    ];
    for (const path of paths) {
      const res = await request(app).get(path).set(auth(candidate.token));
      assertStatus(res, 403);
    }
  });

  it("returns 403 for a recruiter", async () => {
    const recruiter = await registerAndLogin({
      name: "Rae Recruiter",
      email: "rae@hirehub.test",
      password: "password123",
      role: "recruiter",
    });

    const stats = await request(app)
      .get("/api/admin/stats")
      .set(auth(recruiter.token));
    assertStatus(stats, 403);
  });

  it("lets an admin read real counts", async () => {
    const admin = await createAdmin();
    const candidate = await registerAndLogin({
      name: "Ava Candidate",
      email: "ava@hirehub.test",
      password: "password123",
      role: "candidate",
    });
    const recruiter = await registerAndLogin({
      name: "Rae Recruiter",
      email: "rae@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const company = await Company.create(companyBody(recruiter.user.id));
    const openJob = await Job.create(
      jobBody(company._id, recruiter.user.id, { status: "open" }),
    );
    await Job.create(
      jobBody(company._id, recruiter.user.id, {
        title: "Closed role",
        status: "closed",
      }),
    );
    await Application.create({
      candidate: candidate.user.id,
      job: openJob._id,
      status: "applied",
      statusHistory: [
        {
          status: "applied",
          actor: candidate.user.id,
          timestamp: new Date(),
        },
      ],
    });

    const stats = await request(app)
      .get("/api/admin/stats")
      .set(auth(admin.token));
    assertStatus(stats, 200);
    assert.deepEqual(stats.body, {
      usersByRole: { candidate: 1, recruiter: 1, admin: 1 },
      companies: 1,
      jobsByStatus: { open: 1, closed: 1, draft: 0 },
      applicationsByStatus: {
        applied: 1,
        screening: 0,
        shortlisted: 0,
        interview: 0,
        offer: 0,
        hired: 0,
        rejected: 0,
      },
    });
  });

  it("returns 401 for an expired or bad token", async () => {
    const admin = await createAdmin();
    const expired = jwt.sign(
      {
        userId: admin.user.id,
        role: "admin",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      process.env.JWT_SECRET,
    );

    const expiredStats = await request(app)
      .get("/api/admin/stats")
      .set(auth(expired));
    assertStatus(expiredStats, 401);
    const expiredMe = await request(app).get("/api/auth/me").set(auth(expired));
    assertStatus(expiredMe, 401);

    const badStats = await request(app)
      .get("/api/admin/stats")
      .set(auth("not-a-real-token"));
    assertStatus(badStats, 401);
    const badMe = await request(app)
      .get("/api/auth/me")
      .set(auth("not-a-real-token"));
    assertStatus(badMe, 401);

    const stillAdmin = await User.findById(admin.user.id);
    assert.equal(stillAdmin.role, "admin");
  });

  it("lists users without a password hash and refuses a second admin", async () => {
    const admin = await createAdmin();
    const candidate = await registerAndLogin({
      name: "Ava Candidate",
      email: "ava@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const listed = await request(app)
      .get("/api/admin/users")
      .set(auth(admin.token));
    assertStatus(listed, 200);
    assert.equal(listed.body.users.length, 2);
    for (const user of listed.body.users) {
      assert.equal(user.password, undefined);
      assert.equal(JSON.stringify(user).includes("$2"), false);
    }

    const promoted = await request(app)
      .patch(`/api/admin/users/${candidate.user.id}`)
      .set(auth(admin.token))
      .send({ role: "admin" });
    assertStatus(promoted, 400);

    const stored = await User.findById(candidate.user.id);
    assert.equal(stored.role, "candidate");

    const changed = await request(app)
      .patch(`/api/admin/users/${candidate.user.id}`)
      .set(auth(admin.token))
      .send({ role: "recruiter" });
    assertStatus(changed, 200);
    assert.equal(changed.body.user.role, "recruiter");
    assert.equal(changed.body.user.password, undefined);
  });

  it("does not let an admin change their own role", async () => {
    const admin = await createAdmin();

    const patched = await request(app)
      .patch(`/api/admin/users/${admin.user.id}`)
      .set(auth(admin.token))
      .send({ role: "candidate" });
    assertStatus(patched, 403);

    const stored = await User.findById(admin.user.id);
    assert.equal(stored.role, "admin");
  });

  it("lets an admin open or close a job", async () => {
    const admin = await createAdmin();
    const recruiter = await registerAndLogin({
      name: "Rae Recruiter",
      email: "rae@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const company = await Company.create(companyBody(recruiter.user.id));
    const job = await Job.create(jobBody(company._id, recruiter.user.id));

    const listed = await request(app)
      .get("/api/admin/jobs")
      .set(auth(admin.token));
    assertStatus(listed, 200);
    assert.equal(listed.body.jobs.length, 1);
    assert.equal(listed.body.jobs[0].status, "open");

    const closed = await request(app)
      .patch(`/api/admin/jobs/${job._id}`)
      .set(auth(admin.token))
      .send({ status: "closed" });
    assertStatus(closed, 200);
    assert.equal(closed.body.job.status, "closed");

    const drafted = await request(app)
      .patch(`/api/admin/jobs/${job._id}`)
      .set(auth(admin.token))
      .send({ status: "draft" });
    assertStatus(drafted, 400);

    const reopened = await request(app)
      .patch(`/api/admin/jobs/${job._id}`)
      .set(auth(admin.token))
      .send({ status: "open" });
    assertStatus(reopened, 200);
    assert.equal(reopened.body.job.status, "open");
  });

  it("lists companies for an admin", async () => {
    const admin = await createAdmin();
    const recruiter = await registerAndLogin({
      name: "Rae Recruiter",
      email: "rae@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    await Company.create(companyBody(recruiter.user.id));

    const listed = await request(app)
      .get("/api/admin/companies")
      .set(auth(admin.token));
    assertStatus(listed, 200);
    assert.equal(listed.body.companies.length, 1);
    assert.equal(listed.body.companies[0].name, "Northwind");
    assert.equal(listed.body.nextCursor, null);
  });

  it("still rejects admin registration", async () => {
    const registered = await request(app).post("/api/auth/register").send({
      name: "Not Admin",
      email: "not-admin@hirehub.test",
      password: "password123",
      role: "admin",
    });
    assertStatus(registered, 400);
    assert.equal(
      await User.countDocuments({ email: "not-admin@hirehub.test" }),
      0,
    );
  });

  it("creates one hashed admin from env and leaves an existing email alone", async () => {
    const password = "correct-horse-admin";
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map((part) => String(part)).join(" "));
    };

    try {
      process.env.ADMIN_EMAIL = "root@hirehub.test";
      process.env.ADMIN_PASSWORD = password;
      const created = await ensureAdmin();
      assert.equal(created.created, true);

      const stored = await User.findOne({ email: "root@hirehub.test" }).select(
        "+password",
      );
      assert.equal(stored.role, "admin");
      assert.match(stored.password, /^\$2/);
      assert.notEqual(stored.password, password);
      assert.equal(await bcrypt.compare(password, stored.password), true);

      const again = await ensureAdmin();
      assert.equal(again.created, false);
      assert.equal(await User.countDocuments({ role: "admin" }), 1);

      const loggedIn = await request(app).post("/api/auth/login").send({
        email: "root@hirehub.test",
        password,
        role: "admin",
      });
      assertStatus(loggedIn, 200);
      assert.equal(loggedIn.body.user.role, "admin");
    } finally {
      console.log = originalLog;
    }

    assert.equal(
      logs.some((line) => line.includes(password)),
      false,
    );

    await User.deleteMany({});
    await User.create({
      name: "Existing Person",
      email: "person@hirehub.test",
      password: await bcrypt.hash("password123", 10),
      role: "candidate",
    });
    process.env.ADMIN_EMAIL = "Person@HireHub.test";
    process.env.ADMIN_PASSWORD = "different-admin-password";
    const skipped = await ensureAdmin();
    assert.equal(skipped.created, false);
    const existing = await User.findOne({ email: "person@hirehub.test" });
    assert.equal(existing.role, "candidate");
    assert.equal(await User.countDocuments(), 1);

    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    const untouched = await ensureAdmin();
    assert.equal(untouched.created, false);
    assert.equal(await User.countDocuments({ role: "admin" }), 0);
  });
});
