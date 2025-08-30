import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

export const runtime = "nodejs";

const WithdrawSchema = z.object({ bookId: z.string().min(1) });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  const parsed = WithdrawSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "INVALID", issues: parsed.error.issues }, { status: 400 });

  const { bookId } = parsed.data;
  const exists = await prisma.book.findUnique({ where: { id: bookId } });
  if (!exists) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.book.update({ where: { id: bookId }, data: { isWithdrawn: true } });
  return Response.json({ ok: true });
}

