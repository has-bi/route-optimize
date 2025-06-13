// src/app/api/health/route.js - Health Check Endpoint

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.js";

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
      database: "connected",
      authentication: "configured",
      missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
    };

    // Check whitelist configuration
    const whitelist = process.env.EXTERNAL_EMAIL_WHITELIST || "";
    health.whitelist = {
      configured: whitelist.length > 0,
      count: whitelist
        ? whitelist.split(",").filter((e) => e.trim()).length
        : 0,
    };

    const status = missingEnvVars.length > 0 ? 500 : 200;

    return NextResponse.json(health, { status });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}
