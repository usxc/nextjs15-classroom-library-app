// app/books/page.tsx

import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/appUser";
import BooksClient from "./BooksClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BooksPage() {
  // ログイン中のユーザー(App内User)を取得
  const me = await getOrCreateAppUser(); // Webhook失敗時の保険

  if (!me) {
    throw new Error("ログインしてください");
  }

  // Withdrawされていない本一覧 + 在庫情報を取得
  const books = await prisma.book.findMany({
    where: { isWithdrawn: false },
    include: {
      copies: {
        select: { id: true, code: true, status: true },
      },
    },
    orderBy: { title: "asc" },
  });

  // 自分が今借りている本の貸出レコードを取得
  const myLoans = await prisma.loan.findMany({
    where: { userId: me.id, returnedAt: null },
    include: {
      copy: {
        include: {
          book: {
            select: { id: true, title: true, author: true },
          },
        },
      },
    },
    orderBy: { checkoutAt: "desc" },
  });

  // Next.js/React に渡しやすい「プレーンなオブジェクト」に変換（DTO化）
  const booksDTO = books.map((b) => ({
    id: b.id,
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
    isWithdrawn: b.isWithdrawn,
    copies: b.copies.map((c) => ({
      id: c.id,
      code: c.code,
      status: c.status as "AVAILABLE" | "LOANED" | "LOST" | "REPAIR",
    })),
  }));
  
  // 同じくDTO化
  const myLoansDTO = myLoans.map((l) => ({
    id: l.id,
    checkoutAt: l.checkoutAt.toISOString(),
    returnedAt: l.returnedAt ? l.returnedAt.toISOString() : null,
    copy: {
      id: l.copy.id,
      book: {
        id: l.copy.book.id,
        title: l.copy.book.title,
        author: l.copy.book.author,
      },
    },
  }));

  // 管理者かどうかのフラグ
  const isAdmin = me.role === "ADMIN";

  // 実際のUIは全部 BooksClient に任せる
  return (
    <BooksClient
      initialBooks={booksDTO}
      initialMyLoans={myLoansDTO}
      isAdmin={isAdmin}
    />
  );
}