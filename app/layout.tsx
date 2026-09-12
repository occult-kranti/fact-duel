import type { Metadata } from "next";
import "./globals.css";
import "./rivalry.css";
import "./expeditions.css";

export const metadata: Metadata = {
  title: "FACT//DUEL — Know it. Prove it.",
  description: "Explore nine sports and science expeditions, choose your confidence, collect stamps, or challenge a friend or a random bot. Sports and science trivia with free simulated coins.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
