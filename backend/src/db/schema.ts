import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull()
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull()
});

export const offerings = pgTable("offerings", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  description: text("description")
});

export const weeklyDues = pgTable("weekly_dues", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull().defaultNow()
});
