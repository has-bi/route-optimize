// ===== FILE 3: ./src/app/dashboard/routes/page.js (All routes page) =====
import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import RouteList from "../../../components/route/RouteList.js";

const prisma = new PrismaClient();

async function getAllRoutes(userId) {
  return await prisma.route.findMany({
    where: { userId },
    include: {
      stores: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AllRoutes() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const routes = await getAllRoutes(session.user.id);

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
            <h1 className="text-2xl font-bold">Semua Rute</h1>
            <p className="text-gray-600">{routes.length} rute tersimpan</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Riwayat Rute</h2>
          <a
            href="/dashboard/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Buat Rute Baru
          </a>
        </div>

        <RouteList routes={routes} showAll={true} />
      </div>
    </div>
  );
}
