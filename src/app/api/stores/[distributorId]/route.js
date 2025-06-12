import { NextResponse } from "next/server";
import { auth } from "../../../../../auth.js";
import { getStoreByDistributorId } from "../../../../lib/google-sheets.js";

// GET /api/stores/[distributorId] - Get specific store by distributor ID
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isCompanyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIX: Await params in Next.js 15
    const { distributorId } = await params;
    console.log("Looking for distributor ID:", distributorId);

    const store = await getStoreByDistributorId(distributorId);

    if (!store) {
      console.log("Store not found for ID:", distributorId);
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    console.log("Found store data:", {
      distributorId: store.distributorId,
      storeName: store.storeName,
      coordinates: store.coordinates,
      storeAddress: store.storeAddress,
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error("Error getting store by distributor ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch store", details: error.message },
      { status: 500 }
    );
  }
}
