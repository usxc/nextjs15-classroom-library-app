import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const CreateBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishedAt: z.string().optional(), // YYYY-MM-DD
});

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
  const parsed = CreateBookSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "INVALID", issues: parsed.error.issues }, { status: 400 });

  const { title, author, isbn, publisher, publishedAt } = parsed.data;
  const created = await prisma.book.create({
    data: {
      title,
      author: author ?? null,
      isbn: isbn ?? null,
      publisher: publisher ?? null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      isWithdrawn: false,
      copies: {
        create: [
          {
            code: `CP-${randomUUID().slice(0, 8).toUpperCase()}`,
          },
        ],
      },
    },
    include: { copies: { select: { id: true, code: true, status: true } } },
  });

  return Response.json({
    book: {
      id: created.id,
      title: created.title,
      author: created.author,
      copies: created.copies.map((c: typeof created.copies[number]) => ({ id: c.id, code: c.code, status: c.status })),
    },
  });
}
