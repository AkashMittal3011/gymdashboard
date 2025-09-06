import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertGymSchema, insertBranchSchema, insertMemberSchema, 
  insertPaymentSchema, insertAttendanceSchema, insertCommunicationSchema 
} from "@shared/schema";
import Stripe from "stripe";
import QRCode from "qrcode";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found. Payment functionality will be limited.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Gym management routes
  app.post("/api/gyms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const gymData = insertGymSchema.parse({ ...req.body, ownerId: req.user.id });
      const gym = await storage.createGym(gymData);
      res.json(gym);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/gyms", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const gyms = await storage.getGymsByOwner(req.user.id);
      res.json(gyms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Branch management routes
  app.post("/api/branches", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const branchData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(branchData);
      
      // Generate QR code for branch registration
      const registrationUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/register?branchId=${branch.id}`;
      const qrCodeUrl = await QRCode.toDataURL(registrationUrl);
      await storage.updateBranchQRCode(branch.id, qrCodeUrl);
      
      res.json({ ...branch, qrCodeUrl });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/branches/:gymId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const branches = await storage.getBranchesByGym(req.params.gymId);
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/branch/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) return res.status(404).json({ message: "Branch not found" });
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Member management routes
  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const members = await storage.getMembersByUser(req.user.id);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/member/:id", async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) return res.status(404).json({ message: "Member not found" });
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/members/expiring/:days", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const days = parseInt(req.params.days);
      const members = await storage.getExpiringMembersByUser(req.user.id, days);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/payments/:memberId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByMember(req.params.memberId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const payments = await storage.getPendingPaymentsByUser(req.user.id);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment integration
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const { amount, memberId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "inr",
        metadata: { memberId }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Attendance routes
  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/attendance/checkin", async (req, res) => {
    try {
      const { qrCodeId } = req.body;
      const member = await storage.getMemberByQRCode(qrCodeId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const attendance = await storage.createAttendance({
        memberId: member.id,
        branchId: member.branchId
      });
      
      res.json({ message: "Check-in successful", attendance, member });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/attendance/:memberId", async (req, res) => {
    try {
      const attendance = await storage.getAttendanceByMember(req.params.memberId);
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/attendance/today", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const attendance = await storage.getTodayAttendanceByUser(req.user.id);
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Communication routes
  app.post("/api/communications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const communicationData = insertCommunicationSchema.parse(req.body);
      const communication = await storage.createCommunication(communicationData);
      res.json(communication);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/communications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const communications = await storage.getCommunicationsByUser(req.user.id);
      res.json(communications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const metrics = await storage.getMetricsByUser(req.user.id);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // QR Code generation
  app.post("/api/qr/generate/:branchId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { branchId } = req.params;
      
      // Get the proper domain for Replit or development
      let baseUrl;
      if (process.env.REPLIT_DOMAINS) {
        // Use the first Replit domain with https
        const domain = process.env.REPLIT_DOMAINS.split(',')[0];
        baseUrl = `https://${domain}`;
      } else {
        // For development, use the request headers
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost:5000';
        baseUrl = `${protocol}://${host}`;
      }
      
      const registrationUrl = `${baseUrl}/register?branchId=${branchId}`;
      const qrCodeUrl = await QRCode.toDataURL(registrationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      await storage.updateBranchQRCode(branchId, qrCodeUrl);
      res.json({ qrCodeUrl, registrationUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
