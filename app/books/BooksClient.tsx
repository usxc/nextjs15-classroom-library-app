"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

type CopyDTO = { id: string; code: string; status: "AVAILABLE"|"LOANED"|"LOST"|"REPAIR" };
type BookWithCopiesDTO = {
  id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  publishedAt: string | null;
  isWithdrawn: boolean;
  copies: CopyDTO[];
};
type LoanWithCopyAndBookDTO = {
  id: string;
  checkoutAt: string;
  returnedAt: string | null;
  copy: { id: string; book: { id: string; title: string; author: string | null } };
};

export default function BooksClient({
  initialBooks,
  initialMyLoans,
  classroom,
}: {
  initialBooks: BookWithCopiesDTO[];
  initialMyLoans: LoanWithCopyAndBookDTO[];
  classroom: boolean;
}) {
  const [tab, setTab] = useState<"list"|"mine">("list");
  const [q, setQ] = useState("");

  return (
    <div className="h-dvh flex">
      <Sidebar tab={tab} setTab={setTab} />
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center gap-3 px-4">
          <h1 className="text-lg font-semibold">書籍</h1>
          <div className="flex-1" />
          <input
            placeholder="検索（タイトル・著者）"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            className="px-3 py-1.5 border rounded w-72"
          />
          <div className="ml-3 flex items-center gap-2">
            {/* 認証後に UserButton / Borrow / Return を差し込む */}
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            {classroom && (
              <>
                <a href="/borrow" className="px-3 py-1.5 rounded bg-black text-white">本を借りる</a>
                <a href="/return" className="px-3 py-1.5 rounded border">返却する</a>
              </>
            )}
          </div>
        </header>
        <section className="flex-1 overflow-auto p-4">
          {tab==="list" ? <p>（ここに本のリスト） {initialBooks.length} 冊</p> : <p>（ここに自分の貸出） {initialMyLoans.length} 件</p>}
        </section>
      </main>
    </div>
  );
}
