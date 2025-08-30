-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."CopyStatus" AS ENUM ('AVAILABLE', 'LOANED', 'LOST', 'REPAIR');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Book" (
    "id" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isWithdrawn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Copy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "public"."CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "bookId" TEXT NOT NULL,

    CONSTRAINT "Copy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan" (
    "id" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkoutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Copy_code_key" ON "public"."Copy"("code");

-- AddForeignKey
ALTER TABLE "public"."Copy" ADD CONSTRAINT "Copy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "public"."Copy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 二重貸出防止のための部分インデックス
create unique index if not exists ux_open_loan_per_copy
on "Loan" ("copyId")
where "returnedAt" is null;