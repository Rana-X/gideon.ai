import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Dashboard | Maus Style",
  description: "A hand-drawn morning dashboard inspired by Art Spiegelman's Maus aesthetic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
