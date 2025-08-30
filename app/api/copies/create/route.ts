import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const CreateCopiesSchema = z.object({
  bookId: z.string().min(1),
  count: z.number().int().min(1).max(20).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }
  const parsed = CreateCopiesSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "INVALID", issues: parsed.error.issues }, { status: 400 });
  const { bookId } = parsed.data;
  const count = parsed.data.count ?? 1;

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.isWithdrawn) return Response.json({ error: "BOOK_NOT_AVAILABLE" }, { status: 400 });

  const created = [] as { id: string; code: string; status: "AVAILABLE"|"LOANED"|"LOST"|"REPAIR" }[];
  for (let i = 0; i < count; i++) {
    const code = `CP-${randomUUID().slice(0, 8).toUpperCase()}`;
    const c = await prisma.copy.create({ data: { bookId, code } });
    created.push({ id: c.id, code: c.code, status: c.status });
  }

  return Response.json({ copies: created });
}

