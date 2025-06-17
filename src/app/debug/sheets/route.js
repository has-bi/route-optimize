import { NextResponse } from "next/server";
import { auth } from "../../../../auth.js";
import {
  getStoresFromSheet,
  getSheetStats,
} from "../../../lib/google-sheets.js";

// GET /api/debug/sheets - Debug YouVit sheet integration
export async function GET() {
  try {
    const session = await auth();

    // FIXED: Allow all authenticated users for debugging
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🔧 Debug: Testing Google Sheets connection for:",
      session.user.email
    );

    const stores = await getStoresFromSheet();
    const stats = await getSheetStats();

    return NextResponse.json({
      success: true,
      stats,
      distributorIds: stores.slice(0, 10).map((s) => s.distributorId), // Show distributor IDs for testing
      environment: {
        hasServiceEmail: !!process.env.GOOGLE_SERVICE_EMAIL,
        hasServiceKey: !!process.env.GOOGLE_SERVICE_KEY,
        hasSheetId: !!process.env.MASTER_DATA_SHEET_ID,
        sheetId: process.env.MASTER_DATA_SHEET_ID,
      },
      userInfo: {
        email: session.user.email,
        userType: session.user.userType,
        isCompanyUser: session.user.isCompanyUser,
      },
      message: "YouVit master data integration working correctly",
    });
  } catch (error) {
    console.error("💥 YouVit sheets debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        errorDetails: error.stack,
        environment: {
          hasServiceEmail: !!process.env.GOOGLE_SERVICE_EMAIL,
          hasServiceKey: !!process.env.GOOGLE_SERVICE_KEY,
          hasSheetId: !!process.env.MASTER_DATA_SHEET_ID,
          sheetId: process.env.MASTER_DATA_SHEET_ID,
        },
        userInfo: {
          email: session?.user?.email || "none",
        },
      },
      { status: 500 }
    );
  }
}
