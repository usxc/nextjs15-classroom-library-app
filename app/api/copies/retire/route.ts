import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

export const runtime = "nodejs";

const RetireSchema = z.object({ copyId: z.string().min(1) });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }
  const parsed = RetireSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "INVALID", issues: parsed.error.issues }, { status: 400 });
  const { copyId } = parsed.data;

  const copy = await prisma.copy.findUnique({ where: { id: copyId }, include: { loans: { where: { returnedAt: null }, take: 1 } } });
  if (!copy) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  if (copy.loans.length > 0) return Response.json({ error: "LOANED" }, { status: 409 });

  // Mark as LOST to remove from availability while keeping history intact.
  await prisma.copy.update({ where: { id: copyId }, data: { status: "LOST" } });
  return Response.json({ ok: true });
}

