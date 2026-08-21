import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QC Evaluator",
  description: "Coaching call QC evaluator — score a transcript against the rubric.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
