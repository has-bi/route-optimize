import { NextResponse } from "next/server";
import { auth } from "../../../../auth.js";
import { debugUserDatabase } from "../../../../auth.js";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Debug API called by:", session.user.email);

    const debugData = await debugUserDatabase();

    return NextResponse.json({
      success: true,
      currentSession: {
        email: session.user.email,
        userType: session.user.userType,
        id: session.user.id,
      },
      databaseState: debugData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error.message },
      { status: 500 }
    );
  }
}
