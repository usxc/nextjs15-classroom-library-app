import { prisma } from "@/lib/prisma";
import { isClassroomRequest } from "@/lib/classroom";
import { getOrCreateAppUser } from "@/lib/appUser";
import BooksClient from "./BooksClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BooksPage() {
  const me = await getOrCreateAppUser(); // ← Webhook失敗時の保険
  if (!me) throw new Error("ログインしてください");

  const books = await prisma.book.findMany({
    where: { isWithdrawn: false },
    include: { copies: { select: { id:true, code:true, status:true } } },
    orderBy: { title: "asc" }
  });

  const myLoans = await prisma.loan.findMany({
    where: { userId: me.id, returnedAt: null },
    include: { copy: { include: { book: { select: { id:true, title:true, author:true }}}}},
    orderBy: { checkoutAt: "desc" }
  });


  const booksDTO = books.map((b: typeof books[number]) => ({
    id: b.id,
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
    isWithdrawn: b.isWithdrawn,
    copies: b.copies.map((c: { id: string; code: string; status: string }) => ({
      id: c.id,
      code: c.code,
      status: c.status as "AVAILABLE"|"LOANED"|"LOST"|"REPAIR",
    })),
  }));

  const myLoansDTO = myLoans.map((l: typeof myLoans[number]) => ({
    id: l.id,
    checkoutAt: l.checkoutAt.toISOString(),
    returnedAt: l.returnedAt ? l.returnedAt.toISOString() : null,
    copy: { id: l.copy.id, book: { id: l.copy.book.id, title: l.copy.book.title, author: l.copy.book.author } },
  }));

  const classroom = await isClassroomRequest();
  return <BooksClient initialBooks={booksDTO} initialMyLoans={myLoansDTO} classroom={classroom} />;
}
