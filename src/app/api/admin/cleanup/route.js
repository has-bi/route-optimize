// ===== FILE 5: ./src/app/api/admin/cleanup/route.js (Optional cleanup endpoint) =====
import { cleanupOldRoutes } from "../../../../lib/cleanup.js";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cleanedCount = await cleanupOldRoutes();
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old routes`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
