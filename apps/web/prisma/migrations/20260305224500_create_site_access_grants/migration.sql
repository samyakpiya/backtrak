-- CreateEnum
CREATE TYPE "SiteAccessStatus" AS ENUM ('PENDING', 'ALLOWED', 'REVOKED');

-- AlterTable
ALTER TABLE "user"
    ADD COLUMN "siteAccessGrantedAt" TIMESTAMP(3),
    ADD COLUMN "siteAccessRevokedAt" TIMESTAMP(3),
    ADD COLUMN "siteAccessStatus" "SiteAccessStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "site_access_grant" (
    "normalizedEmail" TEXT NOT NULL,
    "userId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_access_grant_pkey" PRIMARY KEY ("normalizedEmail")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_access_grant_userId_key" ON "site_access_grant"("userId");

UPDATE "site_access_grant" AS "grant"
SET "userId" = "user"."id"
FROM "user"
WHERE lower(trim("user"."email")) = "grant"."normalizedEmail";

UPDATE "user"
SET
    "siteAccessStatus" = 'ALLOWED',
    "siteAccessGrantedAt" = "grant"."grantedAt",
    "siteAccessRevokedAt" = NULL
FROM "site_access_grant" AS "grant"
WHERE "grant"."userId" = "user"."id"
  AND "grant"."revokedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "site_access_grant"
ADD CONSTRAINT "site_access_grant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
