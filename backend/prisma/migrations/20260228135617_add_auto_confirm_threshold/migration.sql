-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "auto_confirm_threshold" VARCHAR(20) NOT NULL DEFAULT 'HIGH_ONLY';
