// ./src/app/dashboard/create/page.js
import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import CreateRouteForm from "../../../components/route/CreateRouteForm.js";
import { Link } from "lucide-react";

export default async function CreateRoute() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container-mobile py-6">
      <header className="mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-md">
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
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Buat Rute Baru</h1>
            <p className="text-gray-600">Planning rute kunjungan toko</p>
          </div>
        </div>
      </header>

      <CreateRouteForm />
    </div>
  );
}
