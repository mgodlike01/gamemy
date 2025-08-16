/*
  Warnings:

  - Added the required column `updatedAt` to the `MineState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MineState" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
