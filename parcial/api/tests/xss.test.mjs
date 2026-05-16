import assert from "node:assert/strict";
import test from "node:test";
import { bookingService } from "../src/services/bookingService.mjs";
import { roleRequestService } from "../src/services/roleRequestService.mjs";
import { escapeHtml } from "../../../public/admin/common.js";

const auth = {
  user: { id: "user-1", role: "customer" },
  supabase: {}
};

test("booking input rejects HTML markup in free text fields", async () => {
  await assert.rejects(
    bookingService.createBooking(
      {
        nombre_cliente: "<img src=x onerror=alert(1)>",
        fecha: "2099-01-01",
        hora: "19:30",
        numero_personas: 2,
        comentarios: "Mesa tranquila"
      },
      auth
    ),
    /nombre_cliente no puede contener etiquetas HTML/
  );

  await assert.rejects(
    bookingService.createBooking(
      {
        nombre_cliente: "Ana Maria",
        fecha: "2099-01-01",
        hora: "19:30",
        numero_personas: 2,
        comentarios: "<script>alert(1)</script>"
      },
      auth
    ),
    /comentarios no puede contener etiquetas HTML/
  );
});

test("role request input rejects HTML markup in justification", async () => {
  await assert.rejects(
    roleRequestService.create(
      {
        requested_role: "staff",
        justification: "Necesito acceso <script>alert(1)</script>"
      },
      auth
    ),
    /justification no puede contener etiquetas HTML/
  );
});

test("admin HTML escaping encodes user-controlled text before rendering", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert(1)">`),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
  );
});
