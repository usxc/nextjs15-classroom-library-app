import 'server-only';
import { headers } from "next/headers";

export async function isClassroomRequest(): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  const raw = process.env.CLASSROOM_ALLOWED_IPS || "";
  if (!raw) return true; // 未設定なら制限なし（開発用）
  const list = raw.split(",").map(s=>s.trim()).filter(Boolean);
  return list.some(allow => ip === allow || (allow.endsWith(".") && ip.startsWith(allow)));
}
