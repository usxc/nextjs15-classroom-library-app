"use client";
import { useCallback, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { StatusBadge } from "@/components/StatusBadge";

type Book = { id:string; title:string; author?:string|null; copies:{id:string; code:string; status:"AVAILABLE"|"LOANED"|"LOST"|"REPAIR"}[] };
type Loan = { id:string; copy:{ id:string; book:{ id:string; title:string; author?:string|null } } };

export default function BooksClient({
  initialBooks, initialMyLoans, classroom, isAdmin
}:{ initialBooks:Book[]; initialMyLoans:Loan[]; classroom:boolean; isAdmin:boolean }) {

  const [tab, setTab] = useState<"list"|"mine"|"add"|"delete">("list");
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
    <div className="h-dvh flex bg-gray-50">
      <RealtimeBridge onUpdate={onUpdate} />
      <Sidebar tab={tab} setTab={setTab} isAdmin={isAdmin} />

      <main className="flex-1 flex flex-col">
        <header className="h-16 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
          <div className="h-full mx-auto max-w-6xl px-4 flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">書籍</h1>
            <div className="flex-1" />
            <div className="relative">
              <input
                placeholder="検索（タイトル・著者）"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                className="w-72 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="ml-3 flex items-center gap-2">
              {classroom && (
                <>
                  <a href="/borrow" className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-sm hover:bg-black transition-colors">本を借りる</a>
                  <a href="/return" className="px-3 py-2 rounded-lg border text-sm shadow-sm hover:bg-gray-50 transition-colors">返却する</a>
                </>
              )}
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-4">
            {tab==="list" ? (
              filtered.length === 0 ? (
                <div className="py-20 text-center text-sm text-gray-500">一致する本が見つかりませんでした。</div>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(b => {
                    const available = b.copies.filter(c=>c.status==="AVAILABLE").length;
                    return (
                      <li key={b.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="min-h-16">
                          <div className="font-semibold leading-snug line-clamp-2">{b.title}</div>
                          <div className="mt-0.5 text-sm text-gray-600">{b.author}</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {b.copies.slice(0,3).map(c=> (
                              <span key={c.id} className="inline-flex items-center gap-1.5">
                                <code className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200">{c.code}</code>
                                <StatusBadge status={c.status} />
                              </span>
                            ))}
                            {b.copies.length>3 && (
                              <span className="text-xs text-gray-500">+{b.copies.length-3}</span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${available>0?"text-green-700":"text-gray-500"}`}>
                            {available>0?`在庫あり ${available}`:"在庫なし"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : tab==="mine" ? (
              <div>
                <h2 className="mb-3 text-sm font-medium text-gray-600">あなたが借りている本</h2>
                {myLoans.length===0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">現在、貸出中の本はありません。</div>
                ) : (
                  <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {myLoans.map(l => (
                      <li key={l.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="font-semibold leading-snug line-clamp-2">{l.copy.book.title}</div>
                        <div className="text-sm text-gray-600">{l.copy.book.author}</div>
                        <div className="mt-2 text-[11px] text-gray-500">CopyID: {l.copy.id}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : tab==="add" ? (
              <AdminAddBook onCreated={(b)=>setBooks(prev=>[b, ...prev])} />
            ) : (
              <AdminDeleteBook books={books} onDeleted={(id)=>setBooks(prev=>prev.filter(b=>b.id!==id))} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function AdminAddBook({ onCreated }:{ onCreated:(b:Book)=>void }){
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/books/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author: author||undefined, isbn: isbn||undefined, publisher: publisher||undefined, publishedAt: publishedAt||undefined })
      });
      if (!res.ok) throw new Error("作成に失敗しました");
      const data = await res.json();
      onCreated(data.book as Book);
      setTitle(""); setAuthor(""); setIsbn(""); setPublisher(""); setPublishedAt("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-gray-600">本を追加</h2>
      <form onSubmit={submit} className="grid gap-3 max-w-lg">
        <div>
          <label className="block text-xs text-gray-600 mb-1">タイトル</label>
          <input required value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">著者</label>
          <input value={author} onChange={e=>setAuthor(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">ISBN</label>
            <input value={isbn} onChange={e=>setIsbn(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">出版社</label>
            <input value={publisher} onChange={e=>setPublisher(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">出版日 (YYYY-MM-DD)</label>
          <input value={publishedAt} onChange={e=>setPublishedAt(e.target.value)} placeholder="2024-01-01" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <button disabled={submitting} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-sm hover:bg-black transition-colors disabled:opacity-60">{submitting?"追加中...":"追加する"}</button>
        </div>
      </form>
    </div>
  );
}

function AdminDeleteBook({ books, onDeleted }:{ books:Book[]; onDeleted:(id:string)=>void }){
  const [targetId, setTargetId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/books/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: targetId })
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      onDeleted(targetId);
      setTargetId("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-gray-600">本を削除</h2>
      <form onSubmit={submit} className="flex gap-3 items-end max-w-xl">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">対象の本</label>
          <select value={targetId} onChange={e=>setTargetId(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300">
            <option value="">選択してください</option>
            {books.map(b=> (<option key={b.id} value={b.id}>{b.title}{b.author?` / ${b.author}`:""}</option>))}
          </select>
        </div>
        <button disabled={!targetId||submitting} className="px-3 py-2 rounded-lg border text-sm shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60">{submitting?"処理中...":"削除する"}</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-gray-500">削除は一覧から非表示にする処理（Withdraw）です。関連する貸出履歴は保持されます。</p>
    </div>
  );
}
