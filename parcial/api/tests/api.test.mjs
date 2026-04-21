import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import request from "supertest";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "parcial-api-"));
process.env.PARCIAL_DB_PATH = path.join(tempDir, "test.db");
process.env.SESSION_SECRET = "test-secret";
process.env.ADMIN_EMAIL = "admin@test.local";
process.env.ADMIN_PASSWORD = "TestAdmin123!";

const { bootstrapDatabase } = await import("../src/bootstrap.mjs");
const { createApp } = await import("../src/app.mjs");

await bootstrapDatabase();
const app = createApp();

test("rechaza acceso a reservas sin sesion", async () => {
  const res = await request(app).get("/api/bookings");
  assert.equal(res.status, 401);
});

test("auth usa solo email y bloquea duplicados", async () => {
  const signupAgent = request.agent(app);
  let res = await signupAgent.post("/api/auth/signup").send({
    email: "alice@test.local",
    password: "Password123!"
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, "alice@test.local");

  const loginByEmail = request.agent(app);
  res = await loginByEmail.post("/api/auth/login").send({
    email: "alice@test.local",
    password: "Password123!"
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, "alice@test.local");

  res = await request(app).post("/api/auth/signup").send({
    email: "alice@test.local",
    password: "Password123!"
  });
  assert.equal(res.status, 409);

  res = await request(app).get("/api/auth/login");
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, "POST");
});

test("reservas con comentarios y autorizacion por propietario/admin", async () => {
  const user1 = request.agent(app);
  const user2 = request.agent(app);
  const admin = request.agent(app);

  let res = await user1
    .post("/api/auth/signup")
    .send({ email: "user1@test.local", password: "Password123!" });
  assert.equal(res.status, 201);

  res = await user1.post("/api/bookings").send({
    nombre_cliente: "Cliente Uno",
    fecha: "2026-12-24",
    hora: "19:30",
    numero_personas: 4,
    comentarios: "Cumpleanos, mesa cerca a ventana"
  });
  assert.equal(res.status, 201);
  const bookingId = res.body.booking.id;
  assert.equal(res.body.booking.comentarios, "Cumpleanos, mesa cerca a ventana");

  res = await user1.put(`/api/bookings/${bookingId}`).send({
    nombre_cliente: "Cliente Uno",
    fecha: "2026-12-24",
    hora: "20:00",
    numero_personas: 5,
    comentarios: "Actualizar: celebracion de aniversario"
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.booking.comentarios, "Actualizar: celebracion de aniversario");

  res = await user2
    .post("/api/auth/signup")
    .send({ email: "user2@test.local", password: "Password123!" });
  assert.equal(res.status, 201);

  res = await user2.get(`/api/bookings/${bookingId}`);
  assert.equal(res.status, 403);

  res = await admin
    .post("/api/auth/login")
    .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  assert.equal(res.status, 200);

  res = await admin.patch(`/api/bookings/${bookingId}/status`).send({ status: "confirmed" });
  assert.equal(res.status, 200);
  assert.equal(res.body.booking.status_name, "confirmed");
});

test("solicitudes de rol: usuario edita solo activas y admin cambia estado", async () => {
  const user = request.agent(app);
  const admin = request.agent(app);

  let res = await user
    .post("/api/auth/signup")
    .send({ email: "requester@test.local", password: "Password123!" });
  assert.equal(res.status, 201);

  res = await user.post("/api/role-requests").send({
    requested_role: "admin",
    justification: "Necesito gestionar agenda, estados de reserva y soporte operativo diario"
  });
  assert.equal(res.status, 201);
  const requestId = res.body.roleRequest.id;
  assert.equal(res.body.roleRequest.status, "active");

  res = await user.put(`/api/role-requests/${requestId}`).send({
    requested_role: "admin",
    justification: "Actualizo: tambien cubrire turnos nocturnos del equipo"
  });
  assert.equal(res.status, 200);

  res = await admin
    .post("/api/auth/login")
    .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  assert.equal(res.status, 200);

  res = await admin.patch(`/api/role-requests/${requestId}/status`).send({ status: "approved" });
  assert.equal(res.status, 200);
  assert.equal(res.body.roleRequest.status, "approved");
  assert.equal(res.body.roleRequest.is_active, 0);

  res = await user.put(`/api/role-requests/${requestId}`).send({
    requested_role: "admin",
    justification: "Intento editar no activa"
  });
  assert.equal(res.status, 409);

  res = await user.delete(`/api/role-requests/${requestId}`);
  assert.equal(res.status, 409);
});

test("logout invalida sesion activa", async () => {
  const user = request.agent(app);

  let res = await user.post("/api/auth/signup").send({
    email: "logout@test.local",
    password: "Password123!"
  });
  assert.equal(res.status, 201);

  res = await user.get("/api/auth/session");
  assert.equal(res.status, 200);

  res = await user.post("/api/auth/logout");
  assert.equal(res.status, 204);

  res = await user.get("/api/auth/session");
  assert.equal(res.status, 401);
});

test("bookings y role-requests rechazan metodos no permitidos", async () => {
  const user = request.agent(app);

  let res = await user.post("/api/auth/signup").send({
    email: "methods@test.local",
    password: "Password123!"
  });
  assert.equal(res.status, 201);

  res = await user.patch("/api/bookings").send({});
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, "GET, POST");

  res = await user.post("/api/role-requests/1/status").send({ status: "approved" });
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, "PATCH");
});
