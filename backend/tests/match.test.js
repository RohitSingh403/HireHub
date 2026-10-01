import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { scoreMatch } from "../services/match.js";

process.env.JWT_SECRET = "hirehub-test-secret";

const { default: app } = await import("../app.js");

const profile = {
  skills: ["React", "CSS"],
  yearsOfExperience: 1,
  preferredRole: "Frontend Engineer",
  location: "Bengaluru",
  workMode: "hybrid",
  salaryMin: 70000,
  salaryMax: 110000,
};

const job = {
  skills: ["React", "Node.js"],
  experienceMin: 2,
  location: "Bengaluru",
  workMode: "hybrid",
  salaryMin: 80000,
  salaryMax: 120000,
};

function assertStatus(res, code) {
  assert.equal(
    res.status,
    code,
    `expected ${code}, got ${res.status}: ${JSON.stringify(res.body)}`,
  );
}

describe("explainable match", () => {
  it("computes a known weighted score", () => {
    const match = scoreMatch(profile, job);

    assert.equal(match.skills.score, 50);
    assert.deepEqual(match.skills.matched, ["React"]);
    assert.deepEqual(match.skills.missing, ["Node.js"]);
    assert.equal(match.experience.score, 50);
    assert.equal(match.location.score, 100);
    assert.equal(match.salary.score, 100);
    assert.equal(match.overall, 65);

    const remote = scoreMatch(profile, {
      ...job,
      workMode: "remote",
      location: "Austin",
    });
    assert.equal(remote.location.score, 100);

    const onsiteMiss = scoreMatch(
      { ...profile, workMode: "remote" },
      { ...job, workMode: "onsite" },
    );
    assert.equal(onsiteMiss.location.score, 0);
    assert.equal(scoreMatch(profile, { ...job, skills: [] }), null);
  });

  it("reports a skill gap and ignores extra skills", () => {
    const match = scoreMatch(
      { ...profile, skills: ["react", "Docker", "Figma", "SQL"] },
      { ...job, skills: ["React", "Node.js", "Go"] },
    );

    assert.deepEqual(match.skills.matched, ["React"]);
    assert.deepEqual(match.skills.missing, ["Node.js", "Go"]);
    assert.ok(Math.abs(match.skills.score - 100 / 3) < 1e-9);
    assert.equal(
      match.overall,
      Math.round((match.skills.score * 50 + 50 * 20 + 100 * 15 + 100 * 15) / 100),
    );
  });

  it("scores a salary miss as zero", () => {
    const match = scoreMatch(
      { ...profile, salaryMin: 130000, salaryMax: 150000 },
      job,
    );

    assert.equal(match.salary.score, 0);
    assert.equal(match.salary.reason, "The salary ranges do not overlap.");
    assert.equal(match.overall, 50);
  });
});

describe("applicant ranking access", () => {
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

  it("rejects a recruiter ranking another recruiter's applicants", async () => {
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

    const ownerToken = await registerAndLogin({
      name: "Match Owner",
      email: "match-owner@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const otherToken = await registerAndLogin({
      name: "Match Rival",
      email: "match-rival@hirehub.test",
      password: "password123",
      role: "recruiter",
    });
    const candidateToken = await registerAndLogin({
      name: "Match Candidate",
      email: "match-candidate@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const profileSaved = await request(app)
      .patch("/api/auth/me")
      .set({ Authorization: `Bearer ${candidateToken}` })
      .send(profile);
    assertStatus(profileSaved, 200);

    const company = await request(app)
      .post("/api/companies")
      .set({ Authorization: `Bearer ${ownerToken}` })
      .send({
        name: "Match Studio",
        description: "Scores candidates.",
        website: "https://example.com",
        logo: "https://example.com/logo.png",
        location: "Bengaluru",
        industry: "Software",
        companySize: 8,
      });
    assertStatus(company, 201);

    const created = await request(app)
      .post("/api/jobs")
      .set({ Authorization: `Bearer ${ownerToken}` })
      .send({
        title: "Known Score Role",
        description: "A role with a known match.",
        company: company.body.company._id,
        location: job.location,
        employmentType: "full-time",
        workMode: job.workMode,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        skills: job.skills,
        experience: "2+ years",
        experienceMin: job.experienceMin,
      });
    assertStatus(created, 201);
    const jobId = created.body.job._id;

    const applied = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set({ Authorization: `Bearer ${candidateToken}` });
    assertStatus(applied, 201);

    const forbidden = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set({ Authorization: `Bearer ${otherToken}` });
    assertStatus(forbidden, 403);

    const ranked = await request(app)
      .get(`/api/jobs/${jobId}/applications`)
      .set({ Authorization: `Bearer ${ownerToken}` });
    assertStatus(ranked, 200);
    assert.equal(ranked.body.applications.length, 1);
    assert.equal(ranked.body.applications[0].match.overall, 65);
    assert.deepEqual(ranked.body.applications[0].match.skills.missing, [
      "Node.js",
    ]);

    const recommended = await request(app)
      .get("/api/jobs/recommended")
      .set({ Authorization: `Bearer ${candidateToken}` });
    assertStatus(recommended, 200);
    assert.equal(recommended.body.jobs[0].match.overall, 65);
    assert.equal(recommended.body.jobs[0].job.title, "Known Score Role");
  });
});
