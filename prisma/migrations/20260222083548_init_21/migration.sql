/*
  Warnings:

  - You are about to drop the column `coverImage` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `meta` on the `Blog` table. All the data in the column will be lost.
  - Changed the type of `content` on the `Blog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "coverImage",
DROP COLUMN "meta",
ADD COLUMN     "order" TEXT,
ADD COLUMN     "thumbnail" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL;
