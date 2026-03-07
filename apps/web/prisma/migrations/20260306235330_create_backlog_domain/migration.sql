-- CreateEnum
CREATE TYPE "IssueState" AS ENUM ('OPENED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IssueInternalStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED');

-- CreateEnum
CREATE TYPE "IssueStatusEventSource" AS ENUM ('WEBHOOK', 'POLL', 'MANUAL');

-- CreateEnum
CREATE TYPE "SyncRunMode" AS ENUM ('BOOTSTRAP', 'POLL', 'RECONCILE', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "gitlab_project_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "path_with_namespace" TEXT NOT NULL,
    "web_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gitlab_users" (
    "id" UUID NOT NULL,
    "gitlab_user_id" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gitlab_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "gitlab_issue_id" BIGINT NOT NULL,
    "iid" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "state" "IssueState" NOT NULL,
    "created_at_gitlab" TIMESTAMP(3) NOT NULL,
    "updated_at_gitlab" TIMESTAMP(3) NOT NULL,
    "closed_at_gitlab" TIMESTAMP(3),
    "due_date" DATE,
    "author_id" UUID,
    "web_url" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_assignees" (
    "issue_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    CONSTRAINT "issue_assignees_pkey" PRIMARY KEY ("issue_id", "user_id")
);

-- CreateTable
CREATE TABLE "issue_labels" (
    "issue_id" UUID NOT NULL,
    "label_id" UUID NOT NULL,
    CONSTRAINT "issue_labels_pkey" PRIMARY KEY ("issue_id", "label_id")
);

-- CreateTable
CREATE TABLE "issue_overrides" (
    "issue_id" UUID NOT NULL,
    "internal_status" "IssueInternalStatus",
    "internal_notes" TEXT,
    "target_date" DATE,
    "priority" INTEGER,
    "updated_by_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "issue_overrides_pkey" PRIMARY KEY ("issue_id")
);

-- CreateTable
CREATE TABLE "issue_status_events" (
    "id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "IssueStatusEventSource" NOT NULL,
    CONSTRAINT "issue_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_cursors" (
    "project_id" UUID NOT NULL,
    "last_seen_updated_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "last_error" TEXT,
    CONSTRAINT "sync_cursors_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" UUID NOT NULL,
    "mode" "SyncRunMode" NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "project_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "records_upserted" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_gitlab_project_id_key" ON "projects" ("gitlab_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "gitlab_users_gitlab_user_id_key" ON "gitlab_users" ("gitlab_user_id");

-- CreateIndex
CREATE INDEX "issues_state_updated_at_gitlab_idx" ON "issues" ("state", "updated_at_gitlab" DESC);

-- CreateIndex
CREATE INDEX "issues_project_id_state_idx" ON "issues" ("project_id", "state");

-- CreateIndex
CREATE INDEX "issues_closed_at_gitlab_idx" ON "issues" ("closed_at_gitlab");

-- CreateIndex
CREATE INDEX "issues_due_date_idx" ON "issues" ("due_date");

-- CreateIndex
CREATE INDEX "issues_project_id_updated_at_gitlab_idx" ON "issues" ("project_id", "updated_at_gitlab" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "issues_project_id_gitlab_issue_id_key" ON "issues" ("project_id", "gitlab_issue_id");

-- CreateIndex
CREATE INDEX "labels_title_idx" ON "labels" ("title");

-- CreateIndex
CREATE UNIQUE INDEX "labels_project_id_title_key" ON "labels" ("project_id", "title");

-- CreateIndex
CREATE INDEX "issue_assignees_user_id_issue_id_idx" ON "issue_assignees" ("user_id", "issue_id");

-- CreateIndex
CREATE INDEX "issue_labels_label_id_issue_id_idx" ON "issue_labels" ("label_id", "issue_id");

-- CreateIndex
CREATE INDEX "issue_overrides_updated_by_id_idx" ON "issue_overrides" ("updated_by_id");

-- CreateIndex
CREATE INDEX "issue_status_events_issue_id_changed_at_idx" ON "issue_status_events" ("issue_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "sync_runs_project_id_started_at_idx" ON "sync_runs" ("project_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "sync_runs_status_started_at_idx" ON "sync_runs" ("status", "started_at" DESC);

-- AddForeignKey
ALTER TABLE
    "issues"
ADD
    CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issues"
ADD
    CONSTRAINT "issues_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "gitlab_users" ("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "labels"
ADD
    CONSTRAINT "labels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_assignees"
ADD
    CONSTRAINT "issue_assignees_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_assignees"
ADD
    CONSTRAINT "issue_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "gitlab_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_labels"
ADD
    CONSTRAINT "issue_labels_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_labels"
ADD
    CONSTRAINT "issue_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_overrides"
ADD
    CONSTRAINT "issue_overrides_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_overrides"
ADD
    CONSTRAINT "issue_overrides_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "issue_status_events"
ADD
    CONSTRAINT "issue_status_events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "sync_cursors"
ADD
    CONSTRAINT "sync_cursors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
    "sync_runs"
ADD
    CONSTRAINT "sync_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE
SET
    NULL ON UPDATE CASCADE;