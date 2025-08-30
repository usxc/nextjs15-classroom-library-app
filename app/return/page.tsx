// app/return/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { isClassroomRequest } from "@/lib/classroom";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ReturnPage() {
  const { userId } = await auth();
  if (!userId) throw new Error("ログインしてください");
  if (!(await isClassroomRequest())) throw new Error("教室内からのみ利用できます");

  type Loan = {
    id: string;
    copy: {
      id: string;
      book: {
        title: string;
        author?: string | null;
      };
    };
  };

  const loans: Loan[] = await prisma.loan.findMany({
    where: { userId, returnedAt: null },
    include: { copy: { include: { book: { select: { title:true, author:true }}}}},
    orderBy: { checkoutAt: "desc" }
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">返却する</h1>
      {loans.length===0 ? <p>現在、返却できる本はありません。</p> : (
        <ul className="space-y-3">
          {loans.map((l: Loan) => (
            <li key={l.id} className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{l.copy.book.title}</div>
                <div className="text-sm text-gray-600">{l.copy.book.author}</div>
                <div className="text-xs text-gray-500 mt-1">{l.copy.id}</div>
              </div>
              <form action={`/api/loans/return`} method="post">
                <input type="hidden" name="loanId" value={l.id} />
                <button className="px-3 py-1.5 rounded border">返却する</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
