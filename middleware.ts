// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/api/(.*)", // APIは各routeで保護
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect(); // 未ログイン→/sign-in
  }

  return NextResponse.next();
});

export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
