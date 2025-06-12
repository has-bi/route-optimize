// src/app/page.js - Home page dengan redirect logic
import { auth } from "../../auth.js";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  redirect("/dashboard");
}
