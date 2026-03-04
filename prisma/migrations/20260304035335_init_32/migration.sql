/*
  Warnings:

  - The values [STATUS_CHANGED,ASSIGNED_TO_EMPLOYEE,STEP_STATUS_CHANGED,PERIOD_LOCKED] on the enum `HistoryAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "HistoryAction_new" AS ENUM ('APPLICATION_CREATED', 'APPLICATION_STEPS_CREATED', 'PERIODS_GENERATED', 'SERVICE_STARTED', 'DOCUMENTS_AUTO_REQUESTED', 'APPLICATION_REASSIGNED', 'APPLICATION_ASSIGNED', 'STEP_UPDATED', 'PERIOD_STEP_UPDATED', 'DOCUMENT_UPLOADED', 'DOCUMENT_REQUESTED', 'DOCUMENT_ISSUED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED');
ALTER TABLE "ApplicationHistory" ALTER COLUMN "action" TYPE "HistoryAction_new" USING ("action"::text::"HistoryAction_new");
ALTER TYPE "HistoryAction" RENAME TO "HistoryAction_old";
ALTER TYPE "HistoryAction_new" RENAME TO "HistoryAction";
DROP TYPE "public"."HistoryAction_old";
COMMIT;
