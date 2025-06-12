import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";

// Initialize Google Auth with service account
function getGoogleAuth() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!serviceAccountKey || !process.env.GOOGLE_SERVICE_EMAIL) {
    throw new Error("Google Service Account credentials not configured");
  }

  const auth = new GoogleAuth({
    credentials: {
      type: "service_account",
      client_email: process.env.GOOGLE_SERVICE_EMAIL,
      private_key: serviceAccountKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return auth;
}

// Get Google Sheets client
async function getSheetsClient() {
  try {
    const auth = getGoogleAuth();
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    return sheets;
  } catch (error) {
    console.error("Error initializing Google Sheets client:", error);
    throw new Error("Failed to initialize Google Sheets client");
  }
}

// Transform YouVit raw data to our standardized format (Simplified)
function transformYouVitData(row) {
  // Your sheet columns:
  // A=rank, B=outlet_id, C=distributor_id, D=outlet_name, E=outlet_types,
  // F=sales_types, G=sales_value_l1m, H=sales_value_l3m, I=sales_value_l6m,
  // J=avg_minutes_per_visit, K=productivity, L=area, M=region, N=subzone,
  // O=latitude, P=longitude

  const distributorId = row[2] || "";
  const outletName = row[3] || "";
  const outletTypes = row[4] || "";
  const area = row[11] || "";
  const region = row[12] || "";
  const latitude = parseFloat(row[14]) || 0;
  const longitude = parseFloat(row[15]) || 0;

  // Build coordinates string
  const coordinates = latitude && longitude ? `${latitude},${longitude}` : "";

  // Determine status
  const status =
    outletName && coordinates && distributorId ? "active" : "inactive";

  return {
    distributorId: distributorId.toString(),
    storeName: outletName,
    storeAddress: `${area}, ${region}`.replace(/^,\s*|,\s*$/g, ""), // Clean up empty parts
    coordinates,
    priority: "B", // Default priority - user can change manually
    visitTime: 30, // Default 30 minutes - user can change manually
    status,
    storeType: outletTypes,
    region,
    area,
  };
}

// Remove complex calculation functions - keep it simple
// Calculate priority based on sales and productivity
// function calculatePriority(salesL3m, productivity) { ... } // REMOVED

// Calculate visit time based on actual data and outlet type
// function calculateVisitTime(avgMinutes, outletType) { ... } // REMOVED

// Validate coordinates (Indonesia bounds check)
function isValidIndonesianCoordinates(coordinates) {
  if (!coordinates) return false;

  const parts = coordinates.split(",");
  if (parts.length !== 2) return false;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  // Indonesia approximate bounds
  const INDONESIA_BOUNDS = {
    latMin: -11.0,
    latMax: 6.0, // South to North
    lngMin: 95.0,
    lngMax: 141.0, // West to East
  };

  return (
    lat >= INDONESIA_BOUNDS.latMin &&
    lat <= INDONESIA_BOUNDS.latMax &&
    lng >= INDONESIA_BOUNDS.lngMin &&
    lng <= INDONESIA_BOUNDS.lngMax
  );
}

// Fetch store data from YouVit master sheet
export async function getStoresFromSheet() {
  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.MASTER_DATA_SHEET_ID;

    if (!sheetId) {
      throw new Error("MASTER_DATA_SHEET_ID not configured");
    }

    console.log("Fetching data from sheet:", sheetId);

    // FIX: Use correct sheet name "Master Data"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Master Data!A:P", // FIXED: Use your actual sheet name
    });

    const rows = response.data.values || [];
    console.log("Raw rows fetched:", rows.length);

    if (rows.length === 0) {
      console.log("No data found in sheet");
      return [];
    }

    // Skip header row and transform data
    const dataRows = rows.slice(1);
    console.log("Data rows (excluding header):", dataRows.length);

    const stores = dataRows
      .map(transformYouVitData)
      .filter(
        (store) =>
          store.status === "active" &&
          store.storeName &&
          store.distributorId &&
          isValidIndonesianCoordinates(store.coordinates)
      );

    console.log(
      `Loaded ${stores.length} active stores from YouVit master data`
    );

    // Debug: Log first few distributor IDs
    if (stores.length > 0) {
      console.log(
        "Sample distributor IDs:",
        stores.slice(0, 5).map((s) => s.distributorId)
      );
    }

    return stores;
  } catch (error) {
    console.error("Error fetching YouVit stores from Google Sheets:", error);

    // More specific error messages
    if (error.code === 404) {
      throw new Error(
        "Google Sheet not found or not accessible. Check MASTER_DATA_SHEET_ID and permissions."
      );
    } else if (error.message.includes("Unable to parse range")) {
      throw new Error(
        'Invalid sheet range. Make sure sheet name is "Master Data".'
      );
    } else if (error.message.includes("PERMISSION_DENIED")) {
      throw new Error(
        "Permission denied. Make sure service account has access to the sheet."
      );
    }

    throw new Error("Failed to fetch store data from Google Sheets");
  }
}

// Search stores with simplified filters
export async function searchStores(query, filters = {}) {
  try {
    const allStores = await getStoresFromSheet();

    let filteredStores = allStores;

    // Apply text search
    if (query && query.trim() !== "") {
      const searchTerm = query.toLowerCase().trim();
      filteredStores = filteredStores.filter(
        (store) =>
          store.storeName.toLowerCase().includes(searchTerm) ||
          store.distributorId.toLowerCase().includes(searchTerm) ||
          store.storeAddress.toLowerCase().includes(searchTerm) ||
          store.storeType.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.region) {
      filteredStores = filteredStores.filter(
        (store) => store.region.toLowerCase() === filters.region.toLowerCase()
      );
    }

    if (filters.storeType) {
      filteredStores = filteredStores.filter((store) =>
        store.storeType.toLowerCase().includes(filters.storeType.toLowerCase())
      );
    }

    // Simple alphabetical sort
    filteredStores.sort((a, b) => a.storeName.localeCompare(b.storeName));

    return filteredStores;
  } catch (error) {
    console.error("Error searching YouVit stores:", error);
    throw new Error("Failed to search stores");
  }
}

// Get store by distributor ID
export async function getStoreByDistributorId(distributorId) {
  try {
    const allStores = await getStoresFromSheet();
    return (
      allStores.find((store) => store.distributorId === distributorId) || null
    );
  } catch (error) {
    console.error("Error getting store by distributor ID:", error);
    return null;
  }
}

// Get stores by region (for regional planning)
export async function getStoresByRegion(region) {
  try {
    const allStores = await getStoresFromSheet();
    return allStores.filter(
      (store) => store.region.toLowerCase() === region.toLowerCase()
    );
  } catch (error) {
    console.error("Error getting stores by region:", error);
    throw new Error("Failed to get stores by region");
  }
}

// Remove high-value stores function - not needed
// export async function getHighValueStores() { ... } // REMOVED

// Get simplified sheet statistics
export async function getSheetStats() {
  try {
    const allStores = await getStoresFromSheet();

    const stats = {
      totalStores: allStores.length,
      byRegion: {},
      byStoreType: {},
    };

    // Count by region
    allStores.forEach((store) => {
      stats.byRegion[store.region] = (stats.byRegion[store.region] || 0) + 1;
    });

    // Count by store type
    allStores.forEach((store) => {
      stats.byStoreType[store.storeType] =
        (stats.byStoreType[store.storeType] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error getting sheet statistics:", error);
    throw new Error("Failed to get sheet statistics");
  }
}
