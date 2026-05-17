-- Multi-group (kółko różańcowe) support.
-- See openspec/changes/add-second-kolko/design.md for the full plan.

CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_label" text NOT NULL,
	"image_path" text NOT NULL,
	"anchor_year" integer NOT NULL,
	"anchor_month" integer NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anchor_month_range" CHECK ("groups"."anchor_month" BETWEEN 1 AND 12)
);
--> statement-breakpoint

-- Seed: two existing kółka, both running in parallel from June 2026.
INSERT INTO "groups" ("id", "name", "short_label", "image_path", "anchor_year", "anchor_month") VALUES
	(1, 'Kółko Różańcowe bł. Jerzego Popiełuszki',   'Popiełuszko', '/popieluszko.jpg',   2026, 6),
	(2, 'Kółko Różańcowe pod wezwaniem św. Józefa',  'św. Józef',   '/swiety-jozef.webp', 2026, 6);
--> statement-breakpoint

SELECT setval(pg_get_serial_sequence('groups', 'id'), 2);
--> statement-breakpoint

-- members: add group_id (nullable), backfill, set NOT NULL, swap PK to composite (group_id, slot)
ALTER TABLE "members" ADD COLUMN "group_id" integer REFERENCES "groups"("id");
--> statement-breakpoint
UPDATE "members" SET "group_id" = 1 WHERE "group_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "group_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "members" DROP CONSTRAINT "members_pkey";
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_pkey" PRIMARY KEY ("group_id", "slot");
--> statement-breakpoint

-- send_runs: add group_id, backfill, set NOT NULL, add (group_id, year, month) unique
ALTER TABLE "send_runs" ADD COLUMN "group_id" integer REFERENCES "groups"("id");
--> statement-breakpoint
UPDATE "send_runs" SET "group_id" = 1 WHERE "group_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "send_runs" ALTER COLUMN "group_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "send_runs" ADD CONSTRAINT "send_runs_unique_month" UNIQUE ("group_id", "target_year", "target_month");
--> statement-breakpoint

-- send_results: add group_id, backfill from parent send_runs, set NOT NULL, index by (group_id, created_at desc)
ALTER TABLE "send_results" ADD COLUMN "group_id" integer REFERENCES "groups"("id");
--> statement-breakpoint
UPDATE "send_results" sr SET "group_id" = (
	SELECT "group_id" FROM "send_runs" WHERE "id" = sr."run_id"
) WHERE "group_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "send_results" ALTER COLUMN "group_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "send_results_group_id_created_at_idx" ON "send_results" ("group_id", "created_at" DESC);
--> statement-breakpoint

-- settings: pause moves to groups.paused per-group; drop the column
ALTER TABLE "settings" DROP COLUMN IF EXISTS "paused";
