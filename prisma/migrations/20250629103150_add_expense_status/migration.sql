-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING';
