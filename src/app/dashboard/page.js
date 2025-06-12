import { auth, signOut } from "../../../auth.js";
import { redirect } from "next/navigation";

// Create user if doesn't exist
async function ensureUser(session) {
  try {
    await fetch(`${process.env.AUTH_URL}/api/auth/user`, {
      method: "POST",
      headers: {
        Cookie: `next-auth.session-token=${session.sessionToken}`,
      },
    });
  } catch (error) {
    console.error("Error ensuring user exists:", error);
  }
}

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Ensure user exists in database
  await ensureUser(session);

  return (
    <div className="container-mobile py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">
              Selamat datang, {session.user?.name}
            </p>
            <p className="text-xs text-gray-400">{session.user?.email}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="grid gap-4">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Buat Rute Baru</h2>
          <p className="text-gray-600 mb-4">
            Mulai planning rute kunjungan toko hari ini
          </p>
          <a
            href="/dashboard/create"
            className="block w-full touch-target bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center py-3"
          >
            + Buat Rute Baru
          </a>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Rute Tersimpan</h2>
          <p className="text-gray-600 mb-4">
            Lihat dan kelola rute yang sudah dibuat
          </p>
          <p className="text-sm text-gray-500 text-center py-4">
            Belum ada rute tersimpan
          </p>
        </div>
      </div>
    </div>
  );
}
