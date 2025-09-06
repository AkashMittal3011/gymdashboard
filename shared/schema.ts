import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const membershipPlanEnum = pgEnum("membership_plan", ["monthly", "quarterly", "yearly"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "overdue"]);
export const memberStatusEnum = pgEnum("member_status", ["active", "inactive", "expired"]);

// Users table (gym owners)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gyms table
export const gyms = pgTable("gyms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Branches table
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  gymId: varchar("gym_id").notNull().references(() => gyms.id),
  address: text("address"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Members table
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  age: integer("age"),
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  membershipPlan: membershipPlanEnum("membership_plan").notNull(),
  membershipStart: timestamp("membership_start").notNull(),
  membershipEnd: timestamp("membership_end").notNull(),
  status: memberStatusEnum("status").default("active"),
  qrCodeId: text("qr_code_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("pending"),
  paymentMethod: text("payment_method"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  receiptUrl: text("receipt_url"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  checkInTime: timestamp("check_in_time").defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communications table
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").notNull().references(() => branches.id),
  memberId: varchar("member_id").references(() => members.id),
  type: text("type").notNull(), // whatsapp, email, announcement
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").default("sent"), // sent, failed, pending
  sentAt: timestamp("sent_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  gyms: many(gyms),
}));

export const gymsRelations = relations(gyms, ({ one, many }) => ({
  owner: one(users, {
    fields: [gyms.ownerId],
    references: [users.id],
  }),
  branches: many(branches),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  gym: one(gyms, {
    fields: [branches.gymId],
    references: [gyms.id],
  }),
  members: many(members),
  attendance: many(attendance),
  communications: many(communications),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  branch: one(branches, {
    fields: [members.branchId],
    references: [branches.id],
  }),
  payments: many(payments),
  attendance: many(attendance),
  communications: many(communications),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  member: one(members, {
    fields: [attendance.memberId],
    references: [members.id],
  }),
  branch: one(branches, {
    fields: [attendance.branchId],
    references: [branches.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  branch: one(branches, {
    fields: [communications.branchId],
    references: [branches.id],
  }),
  member: one(members, {
    fields: [communications.memberId],
    references: [members.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGymSchema = createInsertSchema(gyms).omit({
  id: true,
  createdAt: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  qrCodeId: true,
}).extend({
  membershipStart: z.string().or(z.date()).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  membershipEnd: z.string().or(z.date()).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  sentAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGym = z.infer<typeof insertGymSchema>;
export type Gym = typeof gyms.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;
