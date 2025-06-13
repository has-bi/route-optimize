// src/lib/auth-utils.js - Authentication Utility Functions

/**
 * Check if email belongs to company domain
 * @param {string} email - Email to check
 * @returns {boolean}
 */
export function isCompanyEmail(email) {
  if (!email) return false;
  const companyDomains = ["@youvit.co.id"];
  return companyDomains.some((domain) => email.toLowerCase().endsWith(domain));
}

/**
 * Check if user is admin
 * @param {string} email - Email to check
 * @returns {boolean}
 */
export function isAdminUser(email) {
  if (!email) return false;
  const adminEmails = ["admin@youvit.co.id", "cto@youvit.co.id"];
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Get user permissions based on email
 * @param {string} email - User email
 * @returns {Object} User permissions
 */
export function getUserPermissions(email) {
  if (!email) {
    return {
      canCreateRoutes: false,
      canViewAnalytics: false,
      canAccessMasterData: false,
      canManageUsers: false,
      isCompanyUser: false,
      isAdmin: false,
    };
  }

  const isCompany = isCompanyEmail(email);
  const isAdmin = isAdminUser(email);

  return {
    canCreateRoutes: true, // All authenticated users can create routes
    canViewAnalytics: isCompany, // Only company users can view analytics
    canAccessMasterData: isCompany, // Only company users can access master data
    canManageUsers: isAdmin, // Only admins can manage users
    isCompanyUser: isCompany,
    isAdmin: isAdmin,
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Get whitelist from environment
 * @returns {string[]} Array of whitelisted emails
 */
export function getWhitelistFromEnv() {
  const whitelist = process.env.EXTERNAL_EMAIL_WHITELIST || "";
  return whitelist
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0 && isValidEmail(email));
}

/**
 * Check if external user is whitelisted
 * @param {string} email - Email to check
 * @returns {boolean}
 */
export function isWhitelistedExternalUser(email) {
  if (!email || isCompanyEmail(email)) return false;
  const whitelist = getWhitelistFromEnv();
  return whitelist.includes(email.toLowerCase().trim());
}

/**
 * Determine user access level
 * @param {string} email - User email
 * @returns {Object} Access information
 */
export function determineUserAccess(email) {
  if (!email || !isValidEmail(email)) {
    return {
      allowed: false,
      userType: null,
      reason: "Invalid email",
    };
  }

  const cleanEmail = email.toLowerCase().trim();

  // Company email - automatic access
  if (isCompanyEmail(cleanEmail)) {
    return {
      allowed: true,
      userType: "COMPANY",
      reason: "Company domain access",
    };
  }

  // External email - check whitelist
  if (isWhitelistedExternalUser(cleanEmail)) {
    return {
      allowed: true,
      userType: "EXTERNAL",
      reason: "Whitelisted external user",
    };
  }

  // Not authorized
  return {
    allowed: false,
    userType: null,
    reason: "Not authorized - contact admin for access",
  };
}
