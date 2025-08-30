// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/api/(.*)", // APIは各routeで保護
]);

function ipAllowed(path: string, ip: string) {
  const classroomPaths = ["/borrow", "/return", "/api/loans"];
  const target = classroomPaths.some(p => path === p || path.startsWith(p + "/"));
  if (!target) return true;

  const raw = process.env.CLASSROOM_ALLOWED_IPS || "";
  if (!raw) return true; // 空なら制限なし（開発用）
  const list = raw.split(",").map(s=>s.trim()).filter(Boolean);
  return list.some(allow => ip === allow || (allow.endsWith(".") && ip.startsWith(allow)));
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  // NextRequest には `ip` プロパティが無いため、ヘッダから取得
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  if (!ipAllowed(url.pathname, ip)) {
    return new NextResponse("Forbidden (Classroom IP only)", { status: 403 });
  }
  if (!isPublic(req)) {
    await auth.protect(); // 未ログイン→/sign-in
  }

  return NextResponse.next();
});

export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
