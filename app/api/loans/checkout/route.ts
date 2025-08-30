// app/api/loans/checkout/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { publishLoanEvent } from "@/lib/realtime";
import { assertClassroomOrThrow } from "@/lib/ip-guard";

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
  return Response.json({ ok: true });
}
