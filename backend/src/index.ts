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
  role: UserRole;
  department: string | null;
  phoneNumber: string;
  isActive: boolean;
  deviceLinked: boolean;
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

function validRole(value: unknown): value is UserRole {
  return value === "employee" || value === "manager" || value === "administrator";
}

function validDepartment(value: unknown): value is string | null {
  return value === null || value === undefined || (typeof value === "string" && value.trim().length <= 100);
}

function validDeviceId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,100}$/.test(value);
}

function normalizePhoneNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : trimmed.replace(/\D/g, "");
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? normalized : null;
}

function toAppUser(row: Record<string, unknown>): AppUser {
  return {
    id: String(row.id),
    name: String(row.full_name),
    role: String(row.role) as UserRole,
    department: row.department ? String(row.department) : null,
    phoneNumber: String(row.phone_number),
    isActive: Boolean(row.is_active),
    deviceLinked: Boolean(row.device_id),
  };
}

async function userForDevice(request: Request): Promise<AppUser | null> {
  const deviceId = request.headers.get("x-loius-device-id");
  if (!validDeviceId(deviceId)) return null;

  const rows = await sql.query(
    `SELECT id, full_name, role, department, phone_number, is_active, device_id
       FROM app_users
      WHERE device_id = $1 AND is_active = true`,
    [deviceId],
  );
  return rows.length === 1 ? toAppUser(rows[0] as Record<string, unknown>) : null;
}

function toCloudUserProfile(user: AppUser) {
  return {
    id: user.id,
    fullName: user.name,
    role: user.role,
    department: user.department,
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
          `SELECT id, full_name, role, department, phone_number, is_active, device_id
             FROM app_users
            ORDER BY created_at_utc ASC, phone_number ASC`,
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
        const phoneNumber = normalizePhoneNumber(payload.phoneNumber);
        if (!validText(payload.name, 200) || !validRole(payload.role) || !validDepartment(payload.department) || !phoneNumber) {
          return json({ error: "Skontrolujte meno, rolu, oddelenie a telefónne číslo." }, 400);
        }
        const rows = await sql.query(
          `INSERT INTO app_users (full_name, email, role, department, phone_number)
           VALUES ($1, NULL, $2, $3, $4)
           RETURNING id, full_name, role, department, phone_number, is_active, device_id`,
          [
            payload.name.trim(),
            payload.role,
            typeof payload.department === "string" && payload.department.trim() ? payload.department.trim() : null,
            phoneNumber,
          ],
        );
        return json(toAppUser(rows[0] as Record<string, unknown>), 201);
      }

      const userMatch = url.pathname.match(/^\/admin-api\/users\/([0-9a-f-]{36})$/i);
      if (request.method === "DELETE" && userMatch) {
        const rows = await sql.query(
          "DELETE FROM app_users WHERE id = $1::uuid RETURNING id",
          [userMatch[1]],
        );
        if (rows.length === 0) return json({ error: "Používateľ nebol nájdený." }, 404);
        return json({ id: rows[0].id });
      }

      if (request.method === "PATCH" && userMatch) {
        let payload: Record<string, unknown>;
        try {
          payload = await request.json() as Record<string, unknown>;
        } catch {
          return json({ error: "Neplatné údaje používateľa." }, 400);
        }
        const name = payload.name === undefined ? null : typeof payload.name === "string" ? payload.name.trim() : null;
        const phoneNumber = payload.phoneNumber === undefined ? null : normalizePhoneNumber(payload.phoneNumber);
        if ((payload.name !== undefined && !validText(name, 200)) ||
            (payload.role !== undefined && !validRole(payload.role)) ||
            (payload.department !== undefined && !validDepartment(payload.department)) ||
            (payload.isActive !== undefined && typeof payload.isActive !== "boolean") ||
            (payload.unpairDevice !== undefined && typeof payload.unpairDevice !== "boolean") ||
            (payload.phoneNumber !== undefined && !phoneNumber)) {
          return json({ error: "Skontrolujte meno, rolu, oddelenie, stav účtu a telefónne číslo." }, 400);
        }
        const rows = await sql.query(
          `UPDATE app_users
              SET full_name = COALESCE($2, full_name),
                  role = COALESCE($3, role),
                  department = CASE WHEN $4 THEN $5 ELSE department END,
                  is_active = COALESCE($6, is_active),
                  phone_number = CASE WHEN $7 THEN $8 ELSE phone_number END,
                  device_id = CASE WHEN ($7 AND phone_number IS DISTINCT FROM $8) OR $9 THEN NULL ELSE device_id END,
                  activated_at_utc = CASE WHEN ($7 AND phone_number IS DISTINCT FROM $8) OR $9 THEN NULL ELSE activated_at_utc END,
                  updated_at_utc = now()
            WHERE id = $1::uuid
            RETURNING id, full_name, role, department, phone_number, is_active, device_id`,
          [
            userMatch[1],
            name,
            payload.role ?? null,
            Object.prototype.hasOwnProperty.call(payload, "department"),
            typeof payload.department === "string" && payload.department.trim() ? payload.department.trim() : null,
            payload.isActive ?? null,
            Object.prototype.hasOwnProperty.call(payload, "phoneNumber"),
            phoneNumber,
            payload.unpairDevice ?? false,
          ],
        );
        if (rows.length === 0) return json({ error: "Používateľ nebol nájdený." }, 404);
        return json(toAppUser(rows[0] as Record<string, unknown>));
      }

      return json({ error: "Nenájdené." }, 404);
    }

    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    if (request.method === "POST" && url.pathname === "/device-enrollment") {
      let payload: Record<string, unknown>;
      try {
        payload = await request.json() as Record<string, unknown>;
      } catch {
        return json({ error: "Neplatné údaje pre priradenie telefónu." }, 400);
      }

      const phoneNumber = normalizePhoneNumber(payload.phoneNumber);
      if (!phoneNumber || !validDeviceId(payload.deviceId)) {
        return json({ error: "Skontrolujte telefónne číslo." }, 400);
      }

      const rows = await sql.query(
        `SELECT id, full_name, role, department, phone_number, is_active, device_id
           FROM app_users
          WHERE phone_number = $1 AND is_active = true`,
        [phoneNumber],
      );
      const user = rows[0] as Record<string, unknown> | undefined;
      if (!user) {
        return json({ error: "Toto telefónne číslo nie je priradené aktívnemu používateľovi." }, 401);
      }
      if (user.device_id && String(user.device_id) !== payload.deviceId) {
        return json({ error: "Používateľ je už priradený k inému telefónu. Administrátor musí najprv zmeniť alebo znova uložiť telefónne číslo." }, 409);
      }

      const enrolledRows = await sql.query(
        `UPDATE app_users
            SET device_id = $2,
                activated_at_utc = COALESCE(activated_at_utc, now()),
                updated_at_utc = now()
          WHERE id = $1::uuid
          RETURNING id, full_name, role, department, phone_number, is_active, device_id`,
        [user.id, payload.deviceId],
      );
      return json(toCloudUserProfile(toAppUser(enrolledRows[0] as Record<string, unknown>)));
    }

    const currentUser = await userForDevice(request);
    if (!currentUser) return json({ error: "Telefón nie je priradený aktívnemu používateľovi." }, 401);

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
          request.headers.get("x-loius-device-id"),
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
      if (currentUser.role !== "manager" || !currentUser.department) {
        return json({ error: "Schválenie môže vykonať iba vedúci priradeného oddelenia." }, 403);
      }
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
          WHERE id = $1::uuid AND status = 'new' AND department = $3
          RETURNING id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id`,
        [statusMatch[1], status, currentUser.department],
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
