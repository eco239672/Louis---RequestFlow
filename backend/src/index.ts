import { createHash, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { adminPage } from "./admin-page.js";

const sql = neon(process.env.DATABASE_URL!);

const syncKey = process.env.LOIUS_SYNC_KEY;

type RequestPayload = {
  id: string;
  localReference: string;
  title: string;
  description?: string | null;
  department: string;
  priority: number;
  status: string;
  createdAtUtc: string;
  originDeviceId: string;
};

type UserRole = "employee" | "manager" | "administrator";

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  isActive: boolean;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function authorized(request: Request): boolean {
  return matchesKey(request.headers.get("x-loius-sync-key"), syncKey);
}

async function adminAuthorized(request: Request): Promise<boolean> {
  const received = request.headers.get("x-loius-admin-key");
  if (!received) return false;

  const rows = await sql.query("SELECT key_hash FROM admin_access WHERE id = true");
  const keyHash = rows[0]?.key_hash;
  if (typeof keyHash !== "string") return false;

  const receivedHash = createHash("sha256").update(received).digest("hex");
  return matchesKey(receivedHash, keyHash);
}

function matchesKey(received: string | null, expected: string | undefined): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function validText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function validStatus(value: unknown): value is string {
  return ["new", "approved", "rejected", "in_progress", "waiting", "resolved", "completed", "cancelled"].includes(String(value));
}

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validRole(value: unknown): value is UserRole {
  return value === "employee" || value === "manager" || value === "administrator";
}

function validDepartment(value: unknown): value is string | null {
  return value === null || value === undefined || (typeof value === "string" && value.trim().length <= 100);
}

function toAppUser(row: Record<string, unknown>): AppUser {
  return {
    id: String(row.id),
    name: String(row.full_name),
    email: String(row.email),
    role: String(row.role) as UserRole,
    department: row.department ? String(row.department) : null,
    isActive: Boolean(row.is_active),
  };
}

function validRequest(payload: unknown): payload is RequestPayload {
  if (!payload || typeof payload !== "object") return false;
  const request = payload as Record<string, unknown>;
  return (
    validText(request.id, 36) &&
    validText(request.localReference, 100) &&
    validText(request.title, 200) &&
    (request.description === null || request.description === undefined ||
      (typeof request.description === "string" && request.description.length <= 4000)) &&
    validText(request.department, 100) &&
    Number.isInteger(request.priority) &&
    Number(request.priority) >= 1 && Number(request.priority) <= 3 &&
    validStatus(request.status) &&
    validText(request.createdAtUtc, 40) && !Number.isNaN(Date.parse(String(request.createdAtUtc))) &&
    validText(request.originDeviceId, 100)
  );
}

function toResponse(row: Record<string, unknown>): RequestPayload {
  return {
    id: String(row.id),
    localReference: String(row.local_reference),
    title: String(row.title),
    description: row.description as string | null,
    department: String(row.department),
    priority: Number(row.priority),
    status: String(row.status),
    createdAtUtc: new Date(String(row.created_at_utc)).toISOString(),
    originDeviceId: String(row.origin_device_id),
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ status: "ok", version: "approval-workflow-v1" });
    }

    if (request.method === "GET" && url.pathname === "/admin") {
      return new Response(adminPage, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    if (url.pathname.startsWith("/admin-api/")) {
      if (!await adminAuthorized(request)) return json({ error: "Neplatný administrátorský kľúč." }, 401);

      if (request.method === "GET" && url.pathname === "/admin-api/users") {
        const rows = await sql.query(
          `SELECT id, full_name, email, role, department, is_active
             FROM app_users
            ORDER BY full_name ASC, email ASC`,
        );
        return json(rows.map((row) => toAppUser(row as Record<string, unknown>)));
      }

      if (request.method === "POST" && url.pathname === "/admin-api/users") {
        let payload: Record<string, unknown>;
        try {
          payload = await request.json() as Record<string, unknown>;
        } catch {
          return json({ error: "Neplatné údaje používateľa." }, 400);
        }
        if (!validText(payload.name, 200) || !validEmail(payload.email) || !validRole(payload.role) || !validDepartment(payload.department)) {
          return json({ error: "Skontrolujte meno, e-mail, rolu a oddelenie." }, 400);
        }
        const rows = await sql.query(
          `INSERT INTO app_users (full_name, email, role, department)
           VALUES ($1, lower($2), $3, $4)
           RETURNING id, full_name, email, role, department, is_active`,
          [payload.name.trim(), payload.email.trim(), payload.role, typeof payload.department === "string" && payload.department.trim() ? payload.department.trim() : null],
        );
        return json(toAppUser(rows[0] as Record<string, unknown>), 201);
      }

      const userMatch = url.pathname.match(/^\/admin-api\/users\/([0-9a-f-]{36})$/i);
      if (request.method === "PATCH" && userMatch) {
        let payload: Record<string, unknown>;
        try {
          payload = await request.json() as Record<string, unknown>;
        } catch {
          return json({ error: "Neplatné údaje používateľa." }, 400);
        }
        if ((payload.role !== undefined && !validRole(payload.role)) ||
            (payload.department !== undefined && !validDepartment(payload.department)) ||
            (payload.isActive !== undefined && typeof payload.isActive !== "boolean")) {
          return json({ error: "Skontrolujte rolu, oddelenie a stav účtu." }, 400);
        }
        const rows = await sql.query(
          `UPDATE app_users
              SET role = COALESCE($2, role),
                  department = CASE WHEN $3 THEN $4 ELSE department END,
                  is_active = COALESCE($5, is_active),
                  updated_at_utc = now()
            WHERE id = $1::uuid
            RETURNING id, full_name, email, role, department, is_active`,
          [
            userMatch[1],
            payload.role ?? null,
            Object.prototype.hasOwnProperty.call(payload, "department"),
            typeof payload.department === "string" && payload.department.trim() ? payload.department.trim() : null,
            payload.isActive ?? null,
          ],
        );
        if (rows.length === 0) return json({ error: "Používateľ nebol nájdený." }, 404);
        return json(toAppUser(rows[0] as Record<string, unknown>));
      }

      return json({ error: "Nenájdené." }, 404);
    }

    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    if (request.method === "GET" && url.pathname === "/requests") {
      const department = url.searchParams.get("department");
      if (!validText(department, 100)) return json({ error: "Department is required." }, 400);

      const rows = await sql.query(
        `SELECT id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id
           FROM work_requests
          WHERE department = $1
          ORDER BY priority DESC, created_at_utc ASC, id ASC`,
        [department],
      );
      return json(rows.map(toResponse));
    }

    if (request.method === "POST" && url.pathname === "/requests") {
      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "Invalid JSON." }, 400);
      }
      if (!validRequest(payload)) return json({ error: "Invalid request payload." }, 400);

      const rows = await sql.query(
        `INSERT INTO work_requests
          (id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id)
         VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9)
         ON CONFLICT (id) DO NOTHING
         RETURNING id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id`,
        [
          payload.id,
          payload.localReference,
          payload.title.trim(),
          payload.description?.trim() || null,
          payload.department,
          payload.priority,
          payload.status,
          payload.createdAtUtc,
          payload.originDeviceId,
        ],
      );

      if (rows.length > 0) return json(toResponse(rows[0]), 201);
      const existing = await sql.query(
        `SELECT id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id
           FROM work_requests WHERE id = $1::uuid`,
        [payload.id],
      );
      return json(toResponse(existing[0] as Record<string, unknown>));
    }

    const statusMatch = url.pathname.match(/^\/requests\/([0-9a-f-]{36})\/status$/i);
    if (request.method === "PATCH" && statusMatch) {
      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "Invalid JSON." }, 400);
      }

      const status = (payload as Record<string, unknown> | null)?.status;
      if (status !== "approved" && status !== "rejected") {
        return json({ error: "Only approval or rejection is allowed for a new request." }, 400);
      }

      const rows = await sql.query(
        `UPDATE work_requests
            SET status = $2, updated_at_utc = now()
          WHERE id = $1::uuid AND status = 'new'
          RETURNING id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id`,
        [statusMatch[1], status],
      );

      if (rows.length > 0) return json(toResponse(rows[0]));
      const existing = await sql.query(
        `SELECT id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id
           FROM work_requests WHERE id = $1::uuid`,
        [statusMatch[1]],
      );
      if (existing.length === 0) return json({ error: "Request not found." }, 404);
      return json({ error: "Request was already decided." }, 409);
    }

    return json({ error: "Not found." }, 404);
  },
};
