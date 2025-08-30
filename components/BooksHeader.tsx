"use client";
import { UserButton } from "@clerk/nextjs";

export function BooksHeader({
  q,
  onSearchChange,
  classroom,
}:{
  q: string;
  onSearchChange: (value: string) => void;
  classroom: boolean;
}) {
  return (
    <header className="h-16 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
      <div className="h-full mx-auto max-w-6xl px-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">教室用書籍貸出Webアプリ</h1>
        <div className="flex-1" />
        <div className="relative">
          <input
            placeholder="検索（タイトル・著者）"
            value={q}
            onChange={(e)=>onSearchChange(e.target.value)}
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
  );
}

