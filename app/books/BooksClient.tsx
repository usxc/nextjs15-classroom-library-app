"use client";
import { useCallback, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { StatusBadge } from "@/components/StatusBadge";

type Book = { id:string; title:string; author?:string|null; copies:{id:string; code:string; status:"AVAILABLE"|"LOANED"|"LOST"|"REPAIR"}[] };
type Loan = { id:string; copy:{ id:string; book:{ id:string; title:string; author?:string|null } } };

export default function BooksClient({
  initialBooks, initialMyLoans, classroom
}:{ initialBooks:Book[]; initialMyLoans:Loan[]; classroom:boolean }) {

  const [tab, setTab] = useState<"list"|"mine">("list");
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [myLoans, setMyLoans] = useState<Loan[]>(initialMyLoans);
  const [q, setQ] = useState("");

  const onUpdate = useCallback((p:{copyId:string; status:"AVAILABLE"|"LOANED"|"LOST"|"REPAIR"}) => {
    setBooks(prev => prev.map(b => ({...b, copies: b.copies.map(c => c.id===p.copyId ? {...c, status:p.status} : c)})));
    if (p.status==="AVAILABLE") setMyLoans(prev => prev.filter(l => l.copy.id !== p.copyId));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter(b => (b.title.toLowerCase().includes(s) || (b.author??"").toLowerCase().includes(s)));
  }, [q, books]);

  return (
    <div className="h-dvh flex">
      <RealtimeBridge onUpdate={onUpdate} />
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
            {classroom && (
              <>
                <a href="/borrow" className="px-3 py-1.5 rounded bg-black text-white">本を借りる</a>
                <a href="/return" className="px-3 py-1.5 rounded border">返却する</a>
              </>
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4">
          {tab==="list" ? (
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(b => (
                <li key={b.id} className="border rounded-xl p-4">
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-sm text-gray-600">{b.author}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {b.copies.map(c=>(
                      <span key={c.id} className="inline-flex items-center gap-2">
                        <code className="bg-gray-50 border rounded px-2">{c.code}</code>
                        <StatusBadge status={c.status} />
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <h2 className="font-semibold mb-3">あなたが借りている本</h2>
              {myLoans.length===0 ? <p className="text-sm text-gray-600">現在、貸出中の本はありません。</p> : (
                <ul className="space-y-3">
                  {myLoans.map(l => (
                    <li key={l.id} className="border rounded-xl p-4">
                      <div className="font-semibold">{l.copy.book.title}</div>
                      <div className="text-sm text-gray-600">{l.copy.book.author}</div>
                      <div className="text-xs text-gray-500 mt-1">CopyID: {l.copy.id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
