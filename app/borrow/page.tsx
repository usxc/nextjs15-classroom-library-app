// app/borrow/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { isClassroomRequest } from "@/lib/classroom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BorrowPage() {
  const { userId } = await auth();
  if (!userId) throw new Error("ログインしてください");
  if (!(await isClassroomRequest())) throw new Error("教室内からのみ利用できます");

  type CopyWithBook = {
    id: number | string;
    code: string;
    book: {
      title: string;
      author: string;
    };
  };

  const copies: CopyWithBook[] = await prisma.copy.findMany({
    where: { status: "AVAILABLE", book: { isWithdrawn: false } },
    include: { book: { select: { title:true, author:true } } },
    orderBy: { code: "asc" }
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">本を借りる</h1>
      <ul className="space-y-3">
        {copies.map((c: CopyWithBook) => (
          <li key={c.id} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{c.book.title}</div>
              <div className="text-sm text-gray-600">{c.book.author}</div>
              <div className="text-xs text-gray-500 mt-1">{c.code}</div>
            </div>
            <form action={`/api/loans/checkout`} method="post">
              <input type="hidden" name="copyId" value={c.id} />
              <button className="px-3 py-1.5 rounded bg-black text-white">借りる</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
