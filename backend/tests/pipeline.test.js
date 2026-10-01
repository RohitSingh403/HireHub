import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import Application from "../models/Application.js";

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

describe("hiring pipeline", () => {
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

  it("rejects an illegal skip, records a rejection, and blocks the wrong people", async () => {
    async function registerAndLogin(user) {
      const registered = await request(app).post("/api/auth/register").send(user);
      assertStatus(registered, 201);
      const loggedIn = await request(app).post("/api/auth/login").send({
        email: user.email,
        password: user.password,
        role: user.role,
      });
      assertStatus(loggedIn, 200);
      return {
        token: loggedIn.body.token,
        id: loggedIn.body.user.id,
      };
    }

    const owner = await registerAndLogin({
      name: "Pipeline Owner",
      email: "pipeline-owner@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const rival = await registerAndLogin({
      name: "Pipeline Rival",
      email: "pipeline-rival@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const candidate = await registerAndLogin({
      name: "Pipeline Candidate",
      email: "pipeline-candidate@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const company = await request(app)
      .post("/api/companies")
      .set(auth(owner.token))
      .send({
        name: "Pipeline Studio",
        description: "Moves applications one stage at a time.",
        website: "https://example.com",
        logo: "https://example.com/logo.png",
        location: "Bengaluru",
        industry: "Software",
        companySize: 6,
      });
    assertStatus(company, 201);

    const created = await request(app)
      .post("/api/jobs")
      .set(auth(owner.token))
      .send({
        title: "Pipeline Role",
        description: "A role with a hiring pipeline.",
        company: company.body.company._id,
        location: "Bengaluru",
        employmentType: "full-time",
        workMode: "hybrid",
        salaryMin: 80000,
        salaryMax: 120000,
        skills: ["React"],
        experience: "1 year",
        experienceMin: 1,
      });
    assertStatus(created, 201);
    const jobId = created.body.job._id;

    const applied = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set(auth(candidate.token));
    assertStatus(applied, 201);
    const applicationId = applied.body.application._id;
    assert.equal(applied.body.application.status, "applied");
    assert.equal(applied.body.application.statusHistory.length, 1);
    assert.equal(applied.body.application.statusHistory[0].status, "applied");
    assert.equal(applied.body.application.statusHistory[0].actor, candidate.id);

    const skipped = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(auth(owner.token))
      .send({ status: "hired" });
    assertStatus(skipped, 400);

    const candidateMove = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(auth(candidate.token))
      .send({ status: "screening" });
    assertStatus(candidateMove, 403);

    const rivalMove = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(auth(rival.token))
      .send({ status: "screening" });
    assertStatus(rivalMove, 403);

    const screening = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(auth(owner.token))
      .send({ status: "screening" });
    assertStatus(screening, 200);
    assert.equal(screening.body.application.statusHistory.length, 2);

    const rejected = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(auth(owner.token))
      .send({ status: "rejected" });
    assertStatus(rejected, 200);
    assert.equal(rejected.body.application.status, "rejected");
    assert.equal(rejected.body.application.statusHistory.length, 3);
    assert.equal(
      rejected.body.application.statusHistory.at(-1).status,
      "rejected",
    );
    assert.equal(
      rejected.body.application.statusHistory.at(-1).actor,
      owner.id,
    );
    assert.ok(rejected.body.application.statusHistory.at(-1).timestamp);

    const afterTerminal = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set(auth(owner.token))
      .send({ status: "screening" });
    assertStatus(afterTerminal, 400);

    await Application.collection.insertOne({
      candidate: new mongoose.Types.ObjectId(),
      job: new mongoose.Types.ObjectId(jobId),
      status: "shortlisted",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const listed = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set(auth(owner.token));
    assertStatus(listed, 200);
    assert.ok(listed.body.applications.some((item) => item.status === "shortlisted"));
  });
});
