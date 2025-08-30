// app/api/loans/return/route.ts
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
  const loanId = String(form.get("loanId") || "");

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { copy: true }
  });
  if (!loan || loan.userId !== userId || loan.returnedAt) {
    return Response.json({ error: "INVALID_LOAN" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.loan.update({ where: { id: loan.id }, data: { returnedAt: new Date() } }),
    prisma.copy.update({ where: { id: loan.copyId }, data: { status: "AVAILABLE" } }),
  ]);

  await publishLoanEvent({ copyId: loan.copyId, status: "AVAILABLE" });
  return Response.json({ ok: true });
}
