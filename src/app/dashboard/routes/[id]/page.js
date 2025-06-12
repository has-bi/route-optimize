// ===== FILE 1: ./src/app/dashboard/routes/[id]/page.js =====
import { auth } from "../../../../../auth.js";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import RouteDetail from "../../../../components/route/RouteDetail.js";

const prisma = new PrismaClient();

async function getRoute(id, userId) {
  return await prisma.route.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      stores: {
        orderBy: { visitOrder: "asc" },
      },
    },
  });
}

export default async function RouteDetailPage({ params }) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const route = await getRoute(params.id, session.user.id);

  if (!route) {
    redirect("/dashboard");
  }

  return (
    <div className="container-mobile py-6">
      <header className="mb-6">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="p-2 hover:bg-gray-100 rounded-md">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold">Detail Rute</h1>
            <p className="text-gray-600">
              {new Date(route.routeDate).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>

      <RouteDetail route={route} />
    </div>
  );
}
