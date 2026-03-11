-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "staff_leaves" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_staffId_idx" ON "reviews"("staffId");

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
