-- Password reset codes (13.4) reuse EmailCode with a new purpose.
-- AlterEnum
ALTER TYPE "CodePurpose" ADD VALUE 'RESET_PASSWORD';
