CREATE TABLE "members" (
	"slot" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slot_range" CHECK ("members"."slot" BETWEEN 1 AND 20)
);
--> statement-breakpoint
CREATE TABLE "send_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"slot" integer NOT NULL,
	"member_name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"message_body" text NOT NULL,
	"twilio_sid" text,
	"status" text NOT NULL,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "send_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"fired_at" timestamp with time zone NOT NULL,
	"target_year" integer NOT NULL,
	"target_month" integer NOT NULL,
	"status" text NOT NULL,
	"total_intended" integer NOT NULL,
	"total_sent_ok" integer NOT NULL,
	"total_failed" integer NOT NULL,
	"notes" text,
	CONSTRAINT "month_range" CHECK ("send_runs"."target_month" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"password_hash" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "single_row" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "send_results" ADD CONSTRAINT "send_results_run_id_send_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."send_runs"("id") ON DELETE cascade ON UPDATE no action;