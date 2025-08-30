// app/api/loans/checkout/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { publishLoanEvent } from "@/lib/realtime";
import { assertClassroomOrThrow } from "@/lib/ip-guard";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await assertClassroomOrThrow();

  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const copyId = String(form.get("copyId") || "");

  const copy = await prisma.copy.findUnique({ where: { id: copyId }});
  if (!copy) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  if (copy.status !== "AVAILABLE") return Response.json({ error: "NOT_AVAILABLE" }, { status: 409 });

  await prisma.$transaction([
    prisma.loan.create({ data: { userId, copyId } }),
    prisma.copy.update({ where: { id: copy.id }, data: { status: "LOANED" } }),
  ]);

  await publishLoanEvent({ copyId, status: "LOANED" });
  // HTML form submit -> redirect back to /books
  return NextResponse.redirect(new URL("/books", req.url), 303);
}
