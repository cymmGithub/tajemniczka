import {
  pgTable, integer, text, timestamp, boolean, serial, check, index,
  primaryKey, unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortLabel: text("short_label").notNull(),
  imagePath: text("image_path").notNull(),
  anchorYear: integer("anchor_year").notNull(),
  anchorMonth: integer("anchor_month").notNull(),
  paused: boolean("paused").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("anchor_month_range", sql`${t.anchorMonth} BETWEEN 1 AND 12`),
]);

export const members = pgTable("members", {
  groupId: integer("group_id").notNull().references(() => groups.id),
  slot: integer("slot").notNull(),
  name: text("name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.groupId, t.slot] }),
  check("slot_range", sql`${t.slot} BETWEEN 1 AND 20`),
]);

export const sendRuns = pgTable("send_runs", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull(),
  targetYear: integer("target_year").notNull(),
  targetMonth: integer("target_month").notNull(),
  status: text("status").notNull(),
  totalIntended: integer("total_intended").notNull(),
  totalSentOk: integer("total_sent_ok").notNull(),
  totalFailed: integer("total_failed").notNull(),
  notes: text("notes"),
}, (t) => [
  check("month_range", sql`${t.targetMonth} BETWEEN 1 AND 12`),
  unique("send_runs_unique_month").on(t.groupId, t.targetYear, t.targetMonth),
]);

export const sendResults = pgTable("send_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => sendRuns.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => groups.id),
  slot: integer("slot").notNull(),
  memberName: text("member_name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  messageBody: text("message_body").notNull(),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("send_results_provider_message_id_idx").on(t.providerMessageId),
  index("send_results_group_id_created_at_idx").on(t.groupId, t.createdAt.desc()),
]);

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("single_row", sql`${t.id} = 1`),
]);
