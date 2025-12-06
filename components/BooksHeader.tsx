"use client";
import { UserButton } from "@clerk/nextjs";

export function BooksHeader({
  q,
  onSearchChange,
}:{
  q: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="h-16 sticky top-0 z-10 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="h-full px-4 grid grid-cols-[auto_1fr_auto_auto] items-center gap-4">
        {/* Leftmost: App title */}
        <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
          教室用書籍貸出Webアプリ
        </div>

        {/* Middle: Search input */}
        <div className="relative max-w-xl w-full">
          <svg aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.9 14.32a8 8 0 1 1 1.414-1.414l3.387 3.387a1 1 0 0 1-1.414 1.414l-3.387-3.387ZM14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" clipRule="evenodd" />
          </svg>
          <input
            placeholder="検索（タイトル・著者）"
            value={q}
            onChange={(e)=>onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>

        {/* Actions: Borrow/Return */}
        <div className="flex items-center gap-2">
          <a href="/borrow" className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-sm hover:bg-black transition-colors">本を借りる</a>
          <a href="/return" className="px-3 py-2 rounded-lg border text-sm shadow-sm hover:bg-gray-50 transition-colors">本を返却する</a>
        </div>

        {/* Rightmost: User icon */}
        <div className="justify-self-end flex items-center">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  );
}
