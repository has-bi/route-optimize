// src/app/layout.js - Root layout dengan Tailwind v4
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Route Optimizer",
  description: "Optimize your sales route efficiently",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">{children}</div>
      </body>
    </html>
  );
}
