"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Sidebar from "@/components/Sidebar";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { StatusBadge } from "@/components/StatusBadge";
import { BooksHeader } from "@/components/BooksHeader";

/** 在庫ステータスの型（見通しのために別名を用意） */
type CopyStatus = "AVAILABLE" | "LOANED" | "LOST" | "REPAIR";

/** ドメイン型（命名を明確化） */
type Book = {
  id: string;
  title: string;
  author?: string | null;
  copies: { id: string; code: string; status: CopyStatus }[];
};

type Loan = {
  id: string;
  copy: { id: string; book: { id: string; title: string; author?: string | null } };
};

export default function BooksClient({
  initialBooks,
  initialMyLoans,
  classroom,
  isAdmin,
}: {
  initialBooks: Book[];
  initialMyLoans: Loan[];
  classroom: boolean;
  isAdmin: boolean;
}) {
  /** タブの選択状態 */
  const [activeTab, setActiveTab] = useState<"list" | "mine" | "add" | "delete" | "stock">("list");

  /** 書籍一覧の状態（サーバからの初期値をセット） */
  const [books, setBooks] = useState<Book[]>(initialBooks);

  /** 自分が借りているローン一覧（サーバからの初期値をセット） */
  const [myLoans, setMyLoans] = useState<Loan[]>(initialMyLoans);

  /** 検索クエリ */
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Realtime（Broadcast）で飛んでくる「冊子の状態更新」を受け取り、
   * 画面の状態（books / myLoans）を“不変更新”で書き換える。
   * - 不変更新: 既存配列/オブジェクトを直接書き換えず、新しいコピーを返す。
   * - useCallback([]): 関数参照を固定し、子コンポーネントの再購読を防ぐ。
   */
  const handleRealtimeUpdate = useCallback(
    (payload: { copyId: string; status: CopyStatus }) => {
      // 1) books の中から該当の冊子だけ status を差し替える
      setBooks((prevBooks) =>
        prevBooks.map((book) => ({
          ...book,
          copies: book.copies.map((copy) =>
            copy.id === payload.copyId ? { ...copy, status: payload.status } : copy
          ),
        }))
      );

      // 2) 返却（AVAILABLE）になったら、自分の貸出一覧からその冊子のローンを取り除く
      if (payload.status === "AVAILABLE") {
        setMyLoans((prevLoans) => prevLoans.filter((loan) => loan.copy.id !== payload.copyId));
      }
    },
    []
  );

  /**
   * 検索結果（タイトル or 著者の部分一致）
   * - useMemo: searchQuery or books が変わったときだけ再計算して無駄を減らす
   */
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;

    return books.filter((book) => {
      const title = book.title.toLowerCase();
      const author = (book.author ?? "").toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [searchQuery, books]);

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* Realtime購読ブリッジ（サーバからのBroadcastを受信し、handleRealtimeUpdateを呼ぶ） */}
      <RealtimeBridge onUpdate={handleRealtimeUpdate} />

      {/* ヘッダー（検索・IPバッジ等） */}
      <BooksHeader q={searchQuery} onSearchChange={setSearchQuery} classroom={classroom} />

      <div className="flex-1 min-h-0 flex">
        {/* 左サイドバー（タブ切り替え） */}
        <Sidebar tab={activeTab} setTab={setActiveTab} isAdmin={isAdmin} />

        {/* メイン領域 */}
        <main className="flex-1 flex flex-col">
          <section className="flex-1 overflow-auto">
            <div className="p-4">
              {activeTab === "list" ? (
                // ====== 一覧タブ ======
                filteredBooks.length === 0 ? (
                  <div className="py-20 text-center text-sm text-gray-500">
                    一致する本が見つかりませんでした。
                  </div>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBooks.map((book) => {
                      const availableCount = book.copies.filter((copy) => copy.status === "AVAILABLE").length;
                      return (
                        <li
                          key={book.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="min-h-16">
                            <div className="font-semibold leading-snug line-clamp-2">{book.title}</div>
                            <div className="mt-0.5 text-sm text-gray-600">{book.author}</div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {book.copies.slice(0, 3).map((copy) => (
                                <span key={copy.id} className="inline-flex items-center gap-1.5">
                                  <code className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                                    {copy.code}
                                  </code>
                                  <StatusBadge status={copy.status} />
                                </span>
                              ))}
                              {book.copies.length > 3 && (
                                <span className="text-xs text-gray-500">+{book.copies.length - 3}</span>
                              )}
                            </div>

                            <span
                              className={`text-xs font-medium ${
                                availableCount > 0 ? "text-green-700" : "text-gray-500"
                              }`}
                            >
                              {availableCount > 0 ? `在庫あり ${availableCount}` : "在庫なし"}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : activeTab === "mine" ? (
                // ====== 自分の貸出タブ ======
                <div>
                  <h2 className="mb-3 text-sm font-medium text-gray-600">あなたが借りている本</h2>
                  {myLoans.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                      現在、貸出中の本はありません。
                    </div>
                  ) : (
                    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {myLoans.map((loan) => (
                        <li key={loan.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="font-semibold leading-snug line-clamp-2">{loan.copy.book.title}</div>
                          <div className="text-sm text-gray-600">{loan.copy.book.author}</div>
                          <div className="mt-2 text-[11px] text-gray-500">CopyID: {loan.copy.id}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : activeTab === "add" ? (
                // ====== 本の追加（管理者） ======
                <AdminAddBook onCreated={(newBook) => setBooks((prev) => [newBook, ...prev])} />
              ) : activeTab === "delete" ? (
                // ====== 本の削除（Withdraw・管理者） ======
                <AdminDeleteBook
                  books={books}
                  onDeleted={(deletedBookId) => setBooks((prev) => prev.filter((book) => book.id !== deletedBookId))}
                />
              ) : (
                // ====== 在庫管理（管理者） ======
                <AdminStockManager
                  books={books}
                  onAdded={(bookId, newCopies) => {
                    setBooks((prev) =>
                      prev.map((book) => (book.id === bookId ? { ...book, copies: [...book.copies, ...newCopies] } : book))
                    );
                  }}
                  onRetired={(bookId, retiredCopyId) => {
                    setBooks((prev) =>
                      prev.map((book) =>
                        book.id === bookId
                          ? {
                              ...book,
                              copies: book.copies.map((copy) =>
                                copy.id === retiredCopyId ? { ...copy, status: "LOST" } : copy
                              ),
                            }
                          : book
                      )
                    );
                  }}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ========================= ここから管理画面コンポーネント ========================= */

/** 本の追加フォーム（管理者） */
function AdminAddBook({ onCreated }: { onCreated: (book: Book) => void }) {
  const [titleInput, setTitleInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [isbnInput, setIsbnInput] = useState("");
  const [publisherInput, setPublisherInput] = useState("");
  const [publishedAtInput, setPublishedAtInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  /** 送信：APIへPOST→成功したら親に新規本を渡してリスト先頭へ追加 */
  const submitNewBook = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const response = await fetch("/api/books/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleInput,
          author: authorInput || undefined,
          isbn: isbnInput || undefined,
          publisher: publisherInput || undefined,
          publishedAt: publishedAtInput || undefined,
        }),
      });
      if (!response.ok) throw new Error("作成に失敗しました");

      const responseData = await response.json();
      onCreated(responseData.book as Book);

      // 入力欄のリセット
      setTitleInput("");
      setAuthorInput("");
      setIsbnInput("");
      setPublisherInput("");
      setPublishedAtInput("");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-gray-600">本を追加</h2>
      <form onSubmit={submitNewBook} className="grid gap-3 max-w-lg">
        <div>
          <label className="block text-xs text-gray-600 mb-1">タイトル</label>
          <input
            required
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">著者</label>
          <input
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">ISBN</label>
            <input
              value={isbnInput}
              onChange={(e) => setIsbnInput(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">出版社</label>
            <input
              value={publisherInput}
              onChange={(e) => setPublisherInput(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">出版日 (YYYY-MM-DD)</label>
          <input
            value={publishedAtInput}
            onChange={(e) => setPublishedAtInput(e.target.value)}
            placeholder="2024-01-01"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <div>
          <button
            disabled={isSubmitting}
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-sm hover:bg-black transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "追加中..." : "追加する"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** 本の削除（Withdraw扱い：一覧非表示。履歴は保持） */
function AdminDeleteBook({
  books,
  onDeleted,
}: {
  books: Book[];
  onDeleted: (id: string) => void;
}) {
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  /** 削除の送信：成功したら親へID通知→booksから除外 */
  const submitDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return;

    setIsSubmitting(true);
    setErrorMessage(undefined);
    try {
      const response = await fetch("/api/books/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBookId }),
      });
      if (!response.ok) throw new Error("削除に失敗しました");

      onDeleted(selectedBookId);
      setSelectedBookId("");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-gray-600">本を削除</h2>
      <form onSubmit={submitDelete} className="flex gap-3 items-end max-w-xl">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">対象の本</label>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          >
            <option value="">選択してください</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
                {book.author ? ` / ${book.author}` : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={!selectedBookId || isSubmitting}
          className="px-3 py-2 rounded-lg border text-sm shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "処理中..." : "削除する"}
        </button>
      </form>
      {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      <p className="mt-2 text-xs text-gray-500">
        削除は一覧から非表示にする処理（Withdraw）です。関連する貸出履歴は保持されます。
      </p>
    </div>
  );
}

/** 在庫（冊子）の追加・無効化（管理者） */
function AdminStockManager({
  books,
  onAdded,
  onRetired,
}: {
  books: Book[];
  onAdded: (bookId: string, copies: Book["copies"]) => void;
  onRetired: (bookId: string, copyId: string) => void;
}) {
  /** 選択中の本のID */
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id ?? "");

  /** 追加する冊子数 */
  const [addCount, setAddCount] = useState<number>(1);

  /** 通信中フラグ／エラー表示用 */
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  /** 選択中の本の実体（UI表示に利用） */
  const selectedBook = books.find((book) => book.id === selectedBookId);

  /** 在庫（冊子）をまとめて追加 */
  const addCopies = async () => {
    if (!selectedBookId || addCount < 1) return;
    setIsBusy(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch("/api/copies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBookId, count: addCount }),
      });
      if (!response.ok) throw new Error("追加に失敗しました");

      const data: { copies: { id: string; code: string; status: CopyStatus }[] } = await response.json();

      // 親へ通知→ books の該当本に新しい copies を追加
      onAdded(selectedBookId, data.copies);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  };

  /** 指定の冊子を無効化（LOST） */
  const retireCopy = async (copyId: string) => {
    setIsBusy(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch("/api/copies/retire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyId }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({ error: "" }));
        throw new Error(json.error || "処理に失敗しました");
      }

      // 親へ通知→ books の該当冊子の status を LOST に変更
      onRetired(selectedBookId, copyId);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-gray-600">在庫管理</h2>

      {/* 操作フォーム */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">対象の本</label>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-72 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
                {book.author ? ` / ${book.author}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">追加数</label>
          <input
            type="number"
            min={1}
            max={20}
            value={addCount}
            onChange={(e) => setAddCount(Number(e.target.value))}
            className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>

        <button
          onClick={addCopies}
          disabled={isBusy || !selectedBookId || addCount < 1}
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm shadow-sm hover:bg-black transition-colors disabled:opacity-60"
        >
          在庫を追加
        </button>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {/* 現在の在庫一覧 */}
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-2">現在の在庫</div>

        {selectedBook ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedBook.copies.map((copy) => (
              <li key={copy.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <code className="rounded bg-gray-50 px-2 py-0.5 text-[11px] ring-1 ring-inset ring-gray-200">{copy.code}</code>
                  <StatusBadge status={copy.status} />
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => retireCopy(copy.id)}
                    disabled={isBusy || copy.status !== "AVAILABLE"}
                    className="px-2 py-1 rounded border text-xs hover:bg-gray-50 disabled:opacity-60"
                  >
                    無効化
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">本がありません。</p>
        )}
      </div>
    </div>
  );
}
