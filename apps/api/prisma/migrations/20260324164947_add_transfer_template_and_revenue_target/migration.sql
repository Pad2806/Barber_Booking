-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "transferContent" TEXT;

-- AlterTable
ALTER TABLE "salons" ADD COLUMN     "revenueTarget" DECIMAL(12,0),
ADD COLUMN     "transferTemplate" TEXT;
