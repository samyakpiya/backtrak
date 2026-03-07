-- CreateEnum
CREATE TYPE "SiteAccessStatus" AS ENUM ('PENDING', 'ALLOWED', 'REVOKED');

-- AlterTable
ALTER TABLE
    "user"
ADD
    COLUMN "site_access_granted_at" TIMESTAMP(3),
ADD
    COLUMN "site_access_revoked_at" TIMESTAMP(3),
ADD
    COLUMN "site_access_status" "SiteAccessStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "site_access_grant" (
    "normalized_email" TEXT NOT NULL,
    "user_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_access_grant_pkey" PRIMARY KEY ("normalized_email")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_access_grant_user_id_key" ON "site_access_grant"("user_id");

-- AddForeignKey
ALTER TABLE
    "site_access_grant"
ADD
    CONSTRAINT "site_access_grant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;
