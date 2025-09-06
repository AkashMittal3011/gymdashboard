# Replit.md - Gym Management System

## Overview

This is a comprehensive gym management system built with a modern full-stack architecture. The application provides gym owners with a complete dashboard to manage members, track attendance, handle payments, generate QR codes for member registration, communicate with members, and generate detailed reports. The system supports multi-branch operations and includes features like member self-registration via QR codes, payment processing with Stripe, and real-time analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **Routing**: Wouter for client-side routing with protected routes
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL sessions with connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt hashing

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL
- **Schema Structure**: 
  - Users (gym owners)
  - Gyms (can have multiple branches)
  - Branches (individual gym locations)
  - Members (linked to specific branches)
  - Payments (member subscription payments)
  - Attendance (member check-ins)
  - Communications (message history)
- **Migrations**: Drizzle Kit for schema management

### Key Features Implementation
- **QR Code Generation**: Server-side QR code creation for member registration
- **Member Registration**: Public registration forms accessible via QR codes
- **Payment Processing**: Stripe integration for subscription payments
- **Analytics Dashboard**: Real-time metrics and reporting
- **Communication System**: WhatsApp and email integration for member outreach
- **Attendance Tracking**: QR code scanning for member check-ins
- **Multi-tenant Support**: Branch-based data isolation

## External Dependencies

### Payment Processing
- **Stripe**: Payment gateway for handling member subscriptions and fees
- **Integration**: Both server-side and client-side Stripe SDKs for secure payment processing

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time database connections via WebSocket constructor

### Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **Session Management**: Secure session handling with PostgreSQL store
- **Password Hashing**: Cryptographically secure password storage

### Development Tools
- **Vite**: Fast development server and build tool
- **Replit Integration**: Development environment plugins and runtime error handling
- **TypeScript**: Static type checking across the entire codebase

### Communication Services
- **QR Code Libraries**: Server-side QR code generation for member registration
- **Chart Libraries**: Recharts for dashboard analytics and reporting

The system follows a monorepo structure with shared TypeScript schemas between client and server, ensuring type safety across the entire application. The architecture supports horizontal scaling through the serverless database and stateless server design.