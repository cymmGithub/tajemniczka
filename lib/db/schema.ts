import {
  pgTable, integer, text, timestamp, boolean, serial, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const members = pgTable("members", {
  slot: integer("slot").primaryKey(),
  name: text("name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("slot_range", sql`${t.slot} BETWEEN 1 AND 20`),
]);

export const sendRuns = pgTable("send_runs", {
  id: serial("id").primaryKey(),
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
]);

export const sendResults = pgTable("send_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => sendRuns.id, { onDelete: "cascade" }),
  slot: integer("slot").notNull(),
  memberName: text("member_name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  messageBody: text("message_body").notNull(),
  twilioSid: text("twilio_sid"),
  status: text("status").notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  paused: boolean("paused").notNull().default(false),
  passwordHash: text("password_hash"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("single_row", sql`${t.id} = 1`),
]);
