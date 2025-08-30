import 'server-only';
import { headers } from "next/headers";

export async function assertClassroomOrThrow(): Promise<void> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  const raw = process.env.CLASSROOM_ALLOWED_IPS || "";
  if (!raw) return; // 未設定なら制限なし
  const ok = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((allow) => ip === allow || (allow.endsWith(".") && ip.startsWith(allow)));
  if (!ok) throw new Response("Forbidden (Classroom IP only)", { status: 403 });
}
