// src/app/admin/users/page.js - Final Complete Admin Dashboard

import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma.js";
import { getUserAccessInfo } from "../../../../auth.js";
import Link from "next/link";
import Image from "next/image";

// Check if current user is admin
async function checkAdminAccess(session) {
  if (!session?.user?.email) {
    return false;
  }

  const adminEmails = [
    "admin@youvit.co.id",
    "cto@youvit.co.id",
    // Add more admin emails here
  ];
  return adminEmails.includes(session.user.email.toLowerCase());
}

// Get all users with their access info and activity
async function getAllUsersWithAccess() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        _count: {
          select: {
            routes: true,
            sessions: true,
          },
        },
        routes: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1, // Get latest route for activity check
        },
        sessions: {
          select: {
            expires: true,
          },
          orderBy: { expires: "desc" },
          take: 1, // Get latest session
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enhance with access info and activity status
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        const accessInfo = await getUserAccessInfo(user.email);

        // Determine activity status
        let activityStatus = "Never Active";
        let lastSeen = null;

        if (user.sessions.length > 0) {
          const latestSession = user.sessions[0];
          const sessionExpiry = new Date(latestSession.expires);
          const now = new Date();

          if (sessionExpiry > now) {
            activityStatus = "Online";
            lastSeen = "Currently active";
          } else {
            activityStatus = "Offline";
            lastSeen = `Last seen: ${formatRelativeTime(sessionExpiry)}`;
          }
        } else if (user.routes.length > 0) {
          const latestRoute = user.routes[0];
          activityStatus = "Inactive";
          lastSeen = `Last route: ${formatRelativeTime(
            new Date(latestRoute.createdAt)
          )}`;
        }

        return {
          ...user,
          accessInfo,
          activityStatus,
          lastSeen,
          routeStats: {
            total: user._count.routes,
            draft: 0,
            optimized: 0,
            completed: 0,
          },
        };
      })
    );

    return usersWithAccess;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Get route statistics for all users
async function getRouteStatistics() {
  try {
    const routeStats = await prisma.route.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const stats = {
      DRAFT: 0,
      OPTIMIZED: 0,
      COMPLETED: 0,
    };

    routeStats.forEach((stat) => {
      stats[stat.status] = stat._count.status;
    });

    return stats;
  } catch (error) {
    console.error("Error fetching route statistics:", error);
    return { DRAFT: 0, OPTIMIZED: 0, COMPLETED: 0 };
  }
}

// Get current whitelist from environment
function getCurrentWhitelist() {
  const whitelist = process.env.EXTERNAL_EMAIL_WHITELIST || "";
  return whitelist
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("id-ID");
}

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const isAdmin = await checkAdminAccess(session);
  if (!isAdmin) {
    redirect("/dashboard?error=admin_required");
  }

  const users = await getAllUsersWithAccess();
  const routeStats = await getRouteStatistics();
  const currentWhitelist = getCurrentWhitelist();

  // Calculate comprehensive statistics
  const stats = {
    totalUsers: users.length,
    companyUsers: users.filter((u) => u.accessInfo.userType === "COMPANY")
      .length,
    externalUsers: users.filter((u) => u.accessInfo.userType === "EXTERNAL")
      .length,
    blockedUsers: users.filter((u) => !u.accessInfo.allowed).length,
    activeUsers: users.filter((u) => u.activityStatus === "Online").length,
    totalRoutes: users.reduce((sum, u) => sum + u._count.routes, 0),
    whitelistCount: currentWhitelist.length,
    recentSignups: users.filter((u) => {
      const signupDate = new Date(u.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return signupDate > weekAgo;
    }).length,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage user access and monitor system activity
            </p>
            <p className="text-sm text-gray-500">
              Logged in as: {session.user.email}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/api/health"
              target="_blank"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium transition-colors"
            >
              🩺 Health Check
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">👥</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            +{stats.recentSignups} this week
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Company</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.companyUsers}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">🏢</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">@youvit.co.id</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">External</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.externalUsers}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">🌐</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Whitelisted</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.activeUsers}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">⚡</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Online users</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.totalRoutes}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 text-lg">🗺️</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.blockedUsers}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-lg">🚫</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">No access</p>
        </div>
      </div>

      {/* Route Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
        <h2 className="text-lg font-semibold mb-4">Route Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-4 mb-2">
              <p className="text-2xl font-bold text-gray-700">
                {routeStats.DRAFT}
              </p>
            </div>
            <p className="text-sm text-gray-600">Draft Routes</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-lg p-4 mb-2">
              <p className="text-2xl font-bold text-blue-700">
                {routeStats.OPTIMIZED}
              </p>
            </div>
            <p className="text-sm text-gray-600">Optimized Routes</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-lg p-4 mb-2">
              <p className="text-2xl font-bold text-green-700">
                {routeStats.COMPLETED}
              </p>
            </div>
            <p className="text-sm text-gray-600">Completed Routes</p>
          </div>
        </div>
      </div>

      {/* External Email Whitelist Management */}
      <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">External Email Whitelist</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {currentWhitelist.length} emails
          </span>
        </div>

        {currentWhitelist.length > 0 ? (
          <div className="space-y-2 mb-4">
            {currentWhitelist.map((email, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-900">
                    {email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Active</span>
                  {users.find((u) => u.email.toLowerCase() === email) && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Registered
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">📋</span>
            </div>
            <p className="font-medium">No external emails in whitelist</p>
            <p className="text-sm">
              Add emails to EXTERNAL_EMAIL_WHITELIST in .env
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <span>💡</span>
            How to Update Whitelist
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">1.</span>
              <span>
                Update{" "}
                <code className="bg-blue-100 px-1 rounded">
                  EXTERNAL_EMAIL_WHITELIST
                </code>{" "}
                in your .env file
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">2.</span>
              <span>
                Use comma-separated format:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  user1@gmail.com,user2@company.com
                </code>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">3.</span>
              <span>Restart the application for changes to take effect</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">4.</span>
              <span>
                Company emails (@youvit.co.id) don't need to be whitelisted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">User Management</h2>
              <p className="text-sm text-gray-600">
                Monitor user access and activity
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors">
                📊 Export Data
              </button>
              <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm transition-colors">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Routes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.image ? (
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.image}
                            alt={user.name || user.email}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium text-sm">
                              {(user.name || user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.emailVerified && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-green-600">✓</span>
                            <span className="text-xs text-green-600">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {user.accessInfo.userType === "COMPANY" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🏢 Company
                        </span>
                      ) : user.accessInfo.userType === "EXTERNAL" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🌐 External
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ No Access
                        </span>
                      )}

                      {user.accessInfo.isAdmin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          👑 Admin
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      {user.accessInfo.reason}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.activityStatus === "Online"
                            ? "bg-green-500"
                            : user.activityStatus === "Offline"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">
                        {user.activityStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {user.lastSeen}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{user._count.routes}</span>
                      <span className="text-gray-500 ml-1">total</span>
                    </div>
                    {user._count.routes > 0 && (
                      <div className="text-xs text-gray-500">
                        Latest:{" "}
                        {user.routes.length > 0
                          ? formatRelativeTime(
                              new Date(user.routes[0].createdAt)
                            )
                          : "No routes"}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatRelativeTime(new Date(user.createdAt))}</div>
                    <div className="text-xs">
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.accessInfo.allowed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🚫 Blocked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              Users will appear here after they sign up
            </p>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔧</span>
          System Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              Authentication Settings
            </h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>
                  Company Domain:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    @youvit.co.id
                  </code>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>External Whitelist: {stats.whitelistCount} emails</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">•</span>
                <span>Session Duration: 30 days</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">•</span>
                <span>Auto-registration: Enabled</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Access Control</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">•</span>
                <span>Company users: Auto-approved</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                <span>External users: Whitelist required</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">•</span>
                <span>Admin users: 2 configured</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500">•</span>
                <span>OAuth Provider: Google only</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Development Mode Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600">⚠️</span>
            <h3 className="font-medium text-yellow-800">Development Mode</h3>
          </div>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• This admin dashboard is running in development mode</p>
            <p>• All API endpoints and database queries are logged</p>
            <p>• Consider implementing role-based permissions for production</p>
            <p>• Current admin: {session.user.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
