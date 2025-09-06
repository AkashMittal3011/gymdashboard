import { 
  users, gyms, branches, members, payments, attendance, communications,
  type User, type InsertUser, type Gym, type InsertGym, 
  type Branch, type InsertBranch, type Member, type InsertMember,
  type Payment, type InsertPayment, type Attendance, type InsertAttendance,
  type Communication, type InsertCommunication
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Gym methods
  createGym(gym: InsertGym): Promise<Gym>;
  getGymsByOwner(ownerId: string): Promise<Gym[]>;
  getGym(id: string): Promise<Gym | undefined>;

  // Branch methods
  createBranch(branch: InsertBranch): Promise<Branch>;
  getBranchesByGym(gymId: string): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  updateBranchQRCode(id: string, qrCodeUrl: string): Promise<void>;

  // Member methods
  createMember(member: InsertMember): Promise<Member>;
  getMembersByBranch(branchId: string): Promise<Member[]>;
  getMembersByUser(userId: string): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByQRCode(qrCodeId: string): Promise<Member | undefined>;
  updateMemberStatus(id: string, status: "active" | "inactive" | "expired"): Promise<void>;
  getExpiringMembers(branchId: string, days: number): Promise<Member[]>;
  getExpiringMembersByUser(userId: string, days: number): Promise<Member[]>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByMember(memberId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: "pending" | "paid" | "failed" | "overdue"): Promise<void>;
  getPendingPayments(branchId: string): Promise<Payment[]>;
  getPendingPaymentsByUser(userId: string): Promise<Payment[]>;

  // Attendance methods
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByMember(memberId: string): Promise<Attendance[]>;
  getTodayAttendance(branchId: string): Promise<Attendance[]>;
  getTodayAttendanceByUser(userId: string): Promise<Attendance[]>;

  // Communication methods
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  getCommunicationsByBranch(branchId: string): Promise<Communication[]>;
  getCommunicationsByUser(userId: string): Promise<Communication[]>;

  // Analytics methods
  getBranchMetrics(branchId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    pendingFees: number;
  }>;
  getMetricsByUser(userId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    pendingFees: number;
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createGym(gym: InsertGym): Promise<Gym> {
    const [newGym] = await db.insert(gyms).values(gym).returning();
    return newGym;
  }

  async getGymsByOwner(ownerId: string): Promise<Gym[]> {
    return await db.select().from(gyms).where(eq(gyms.ownerId, ownerId));
  }

  async getGym(id: string): Promise<Gym | undefined> {
    const [gym] = await db.select().from(gyms).where(eq(gyms.id, id));
    return gym || undefined;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [newBranch] = await db.insert(branches).values(branch).returning();
    return newBranch;
  }

  async getBranchesByGym(gymId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.gymId, gymId));
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch || undefined;
  }

  async updateBranchQRCode(id: string, qrCodeUrl: string): Promise<void> {
    await db.update(branches).set({ qrCodeUrl }).where(eq(branches.id, id));
  }

  async createMember(member: InsertMember): Promise<Member> {
    const qrCodeId = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [newMember] = await db.insert(members).values({ ...member, qrCodeId }).returning();
    return newMember;
  }

  async getMembersByBranch(branchId: string): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.branchId, branchId)).orderBy(desc(members.createdAt));
  }

  async getMembersByUser(userId: string): Promise<Member[]> {
    const result = await db.select({
      id: members.id,
      name: members.name,
      email: members.email,
      phone: members.phone,
      createdAt: members.createdAt,
      status: members.status,
      age: members.age,
      branchId: members.branchId,
      membershipPlan: members.membershipPlan,
      membershipStart: members.membershipStart,
      membershipEnd: members.membershipEnd,
      qrCodeId: members.qrCodeId,
      stripeCustomerId: members.stripeCustomerId,
      stripeSubscriptionId: members.stripeSubscriptionId
    })
      .from(members)
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(eq(gyms.ownerId, userId))
      .orderBy(desc(members.createdAt));
    return result;
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByQRCode(qrCodeId: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.qrCodeId, qrCodeId));
    return member || undefined;
  }

  async updateMemberStatus(id: string, status: "active" | "inactive" | "expired"): Promise<void> {
    await db.update(members).set({ status }).where(eq(members.id, id));
  }

  async getExpiringMembers(branchId: string, days: number): Promise<Member[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    return await db.select().from(members)
      .where(and(
        eq(members.branchId, branchId),
        lte(members.membershipEnd, expiryDate),
        gte(members.membershipEnd, new Date())
      ))
      .orderBy(members.membershipEnd);
  }

  async getExpiringMembersByUser(userId: string, days: number): Promise<Member[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const result = await db.select({
      id: members.id,
      name: members.name,
      email: members.email,
      phone: members.phone,
      createdAt: members.createdAt,
      status: members.status,
      age: members.age,
      branchId: members.branchId,
      membershipPlan: members.membershipPlan,
      membershipStart: members.membershipStart,
      membershipEnd: members.membershipEnd,
      qrCodeId: members.qrCodeId,
      stripeCustomerId: members.stripeCustomerId,
      stripeSubscriptionId: members.stripeSubscriptionId
    })
      .from(members)
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(and(
        eq(gyms.ownerId, userId),
        lte(members.membershipEnd, expiryDate),
        gte(members.membershipEnd, new Date())
      ))
      .orderBy(members.membershipEnd);
    return result;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsByMember(memberId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.memberId, memberId)).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: string, status: "pending" | "paid" | "failed" | "overdue"): Promise<void> {
    const updateData: any = { status };
    if (status === "paid") {
      updateData.paidAt = new Date();
    }
    await db.update(payments).set(updateData).where(eq(payments.id, id));
  }

  async getPendingPayments(branchId: string): Promise<Payment[]> {
    return await db
      .select({
        id: payments.id,
        memberId: payments.memberId,
        amount: payments.amount,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        receiptUrl: payments.receiptUrl,
        dueDate: payments.dueDate,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(and(
        eq(members.branchId, branchId),
        eq(payments.status, "pending")
      ));
  }

  async getPendingPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db
      .select({
        id: payments.id,
        memberId: payments.memberId,
        amount: payments.amount,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        receiptUrl: payments.receiptUrl,
        dueDate: payments.dueDate,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(and(
        eq(gyms.ownerId, userId),
        eq(payments.status, "pending")
      ));
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async getAttendanceByMember(memberId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.memberId, memberId)).orderBy(desc(attendance.checkInTime));
  }

  async getTodayAttendance(branchId: string): Promise<Attendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db.select().from(attendance)
      .where(and(
        eq(attendance.branchId, branchId),
        gte(attendance.checkInTime, today),
        lte(attendance.checkInTime, tomorrow)
      ));
  }

  async getTodayAttendanceByUser(userId: string): Promise<Attendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db.select({
      id: attendance.id,
      createdAt: attendance.createdAt,
      branchId: attendance.branchId,
      memberId: attendance.memberId,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime
    })
      .from(attendance)
      .innerJoin(branches, eq(attendance.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(and(
        eq(gyms.ownerId, userId),
        gte(attendance.checkInTime, today),
        lte(attendance.checkInTime, tomorrow)
      ));
    return result;
  }

  async createCommunication(communication: InsertCommunication): Promise<Communication> {
    const [newCommunication] = await db.insert(communications).values(communication).returning();
    return newCommunication;
  }

  async getCommunicationsByBranch(branchId: string): Promise<Communication[]> {
    return await db.select().from(communications).where(eq(communications.branchId, branchId)).orderBy(desc(communications.sentAt));
  }

  async getCommunicationsByUser(userId: string): Promise<Communication[]> {
    const result = await db.select({
      id: communications.id,
      message: communications.message,
      type: communications.type,
      status: communications.status,
      branchId: communications.branchId,
      memberId: communications.memberId,
      subject: communications.subject,
      sentAt: communications.sentAt
    })
      .from(communications)
      .innerJoin(branches, eq(communications.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(eq(gyms.ownerId, userId))
      .orderBy(desc(communications.sentAt));
    return result;
  }

  async getBranchMetrics(branchId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    pendingFees: number;
  }> {
    // Get total members
    const [totalMembersResult] = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.branchId, branchId));

    // Get active members
    const [activeMembersResult] = await db
      .select({ count: count() })
      .from(members)
      .where(and(eq(members.branchId, branchId), eq(members.status, "active")));

    // Get monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [monthlyRevenueResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(and(
        eq(members.branchId, branchId),
        eq(payments.status, "paid"),
        gte(payments.paidAt, thirtyDaysAgo)
      ));

    // Get pending fees
    const [pendingFeesResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(and(
        eq(members.branchId, branchId),
        eq(payments.status, "pending")
      ));

    return {
      totalMembers: totalMembersResult.count,
      activeMembers: activeMembersResult.count,
      monthlyRevenue: Number(monthlyRevenueResult.total) || 0,
      pendingFees: Number(pendingFeesResult.total) || 0,
    };
  }

  async getMetricsByUser(userId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    pendingFees: number;
  }> {
    // Get total members for user's gyms
    const [totalMembersResult] = await db
      .select({ count: count() })
      .from(members)
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(eq(gyms.ownerId, userId));

    // Get active members for user's gyms
    const [activeMembersResult] = await db
      .select({ count: count() })
      .from(members)
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(and(eq(gyms.ownerId, userId), eq(members.status, "active")));

    // Get monthly revenue (last 30 days) for user's gyms
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [monthlyRevenueResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(and(
        eq(gyms.ownerId, userId),
        eq(payments.status, "paid"),
        gte(payments.paidAt, thirtyDaysAgo)
      ));

    // Get pending fees for user's gyms
    const [pendingFeesResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .innerJoin(branches, eq(members.branchId, branches.id))
      .innerJoin(gyms, eq(branches.gymId, gyms.id))
      .where(and(
        eq(gyms.ownerId, userId),
        eq(payments.status, "pending")
      ));

    return {
      totalMembers: totalMembersResult.count,
      activeMembers: activeMembersResult.count,
      monthlyRevenue: Number(monthlyRevenueResult.total) || 0,
      pendingFees: Number(pendingFeesResult.total) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
