import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Netflix Clone — Watch TV Shows Online, Watch Movies Online",
    template: "%s | Netflix Clone",
  },
  description:
    "A fully working Netflix clone built with Next.js and MongoDB. Stream movies and series, create profiles, and build your list.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
