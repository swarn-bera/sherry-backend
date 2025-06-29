/*
  Warnings:

  - Made the column `category` on table `Expense` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "category" SET NOT NULL;
