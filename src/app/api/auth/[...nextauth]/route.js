import { handlers } from "../../../../../auth.js";

// Export the GET and POST handlers from NextAuth
export const { GET, POST } = handlers;

// Force Node.js runtime instead of Edge Runtime
export const runtime = "nodejs";
