import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "test-anon-key";

const { createApp } = await import("../src/app.mjs");
const app = createApp();

test("health endpoint is available", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("protected routes require a Supabase bearer token", async () => {
  const res = await request(app).get("/api/bookings");
  assert.equal(res.status, 401);
});

test("role request routes require auth too", async () => {
  const res = await request(app).patch("/api/role-requests/123");
  assert.equal(res.status, 401);
});
