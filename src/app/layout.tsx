import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IftarCode — Break Your Fast Together. Anywhere.",
  description:
    "Create a private Ramadan room and share the code with friends. Countdown to Maghrib together, chat in real-time, and celebrate Iftar as one.",
  keywords: ["iftar", "ramadan", "countdown", "maghrib", "prayer", "community"],
  openGraph: {
    title: "IftarCode — Break Your Fast Together. Anywhere.",
    description:
      "Create or join a private Iftar room with a unique code. Real-time countdown to Maghrib and live chat.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
