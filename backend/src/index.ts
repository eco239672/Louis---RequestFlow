import { timingSafeEqual } from "node:crypto";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function authorized(request: Request): boolean {
  const received = request.headers.get("x-loius-sync-key");
  if (!syncKey || !received) return false;

  const expectedBuffer = Buffer.from(syncKey);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function validText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function validStatus(value: unknown): value is string {
  return ["new", "approved", "rejected", "in_progress", "waiting", "resolved", "completed", "cancelled"].includes(String(value));
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
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    if (request.method === "GET" && url.pathname === "/requests") {
      const department = url.searchParams.get("department");
      if (!validText(department, 100)) return json({ error: "Department is required." }, 400);

      const { rows } = await pool.query(
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

      const { rows } = await pool.query(
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
      const existing = await pool.query(
        `SELECT id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id
           FROM work_requests WHERE id = $1::uuid`,
        [payload.id],
      );
      return json(toResponse(existing.rows[0] as Record<string, unknown>));
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

      const { rows } = await pool.query(
        `UPDATE work_requests
            SET status = $2, updated_at_utc = now()
          WHERE id = $1::uuid AND status = 'new'
          RETURNING id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id`,
        [statusMatch[1], status],
      );

      if (rows.length > 0) return json(toResponse(rows[0]));
      const existing = await pool.query(
        `SELECT id, local_reference, title, description, department, priority, status, created_at_utc, origin_device_id
           FROM work_requests WHERE id = $1::uuid`,
        [statusMatch[1]],
      );
      if (existing.rows.length === 0) return json({ error: "Request not found." }, 404);
      return json({ error: "Request was already decided." }, 409);
    }

    return json({ error: "Not found." }, 404);
  },
};
