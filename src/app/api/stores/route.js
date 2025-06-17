import { NextResponse } from "next/server";
import { auth } from "../../../../auth.js";
import {
  getStoresFromSheet,
  searchStores,
  getSheetStats,
} from "../../../lib/google-sheets.js";

// GET /api/stores - Get stores with improved permission check
export async function GET(request) {
  try {
    const session = await auth();

    // FIXED: Allow all authenticated users
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("👤 User accessing stores search:", session.user.email);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const region = searchParams.get("region");
    const storeType = searchParams.get("type");
    const stats = searchParams.get("stats") === "true";

    console.log("🔍 Stores API called with params:", {
      query,
      region,
      storeType,
      stats,
    });

    if (stats) {
      const statistics = await getSheetStats();
      return NextResponse.json({ stats: statistics });
    }

    const filters = {
      region: region || undefined,
      storeType: storeType || undefined,
    };

    const stores = await searchStores(query, filters);

    return NextResponse.json({
      stores,
      total: stores.length,
      filters: {
        query,
        region,
        storeType,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Error in stores API:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores", details: error.message },
      { status: 500 }
    );
  }
}
