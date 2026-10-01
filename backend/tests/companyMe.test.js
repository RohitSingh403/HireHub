import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

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

describe("GET /api/companies/me", () => {
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

  it("returns 200 and a null company when the recruiter owns none", async () => {
    const token = await registerAndLogin({
      name: "No Company Recruiter",
      email: "no-company@hirehub.test",
      password: "password123",
      role: "recruiter",
    });

    const response = await request(app)
      .get("/api/companies/me")
      .set(auth(token));

    assertStatus(response, 200);
    assert.equal(response.body.company, null);
  });

  it("returns the company the recruiter owns", async () => {
    const token = await registerAndLogin({
      name: "Owner Recruiter",
      email: "owns-company@hirehub.test",
      password: "password123",
      role: "recruiter",
    });

    const created = await request(app)
      .post("/api/companies")
      .set(auth(token))
      .send({
        name: "Owned Studio",
        description: "A product studio that ships hiring tools.",
        website: "https://example.com",
        logo: "https://example.com/logo.png",
        location: "Bengaluru",
        industry: "Software",
        companySize: 12,
      });
    assertStatus(created, 201);

    const response = await request(app)
      .get("/api/companies/me")
      .set(auth(token));

    assertStatus(response, 200);
    assert.equal(response.body.company.name, "Owned Studio");
    assert.equal(response.body.company._id, created.body.company._id);
  });

  it("returns 401 when no token is sent", async () => {
    const response = await request(app).get("/api/companies/me");
    assertStatus(response, 401);
  });

  it("returns 403 for a non-recruiter", async () => {
    const token = await registerAndLogin({
      name: "Candidate Reader",
      email: "candidate-company@hirehub.test",
      password: "password123",
      role: "candidate",
    });

    const response = await request(app)
      .get("/api/companies/me")
      .set(auth(token));

    assertStatus(response, 403);
  });
});
