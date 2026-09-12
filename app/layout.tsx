import type { Metadata, Viewport } from 'next';
import './theme/tokens.css';
import './globals.css';
import './rivalry.css';
import './expeditions.css';

export const metadata: Metadata = {
  title: 'FACT//DUEL — Know it. Prove it.',
  description:
    'Explore nine sports and science expeditions, choose your confidence, collect stamps, or challenge a friend or a random bot. Sports and science trivia with free simulated coins.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0e14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="/fonts/bricolage-grotesque-latin-normal-500-800.woff2"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="/fonts/instrument-sans-latin-normal-400-700.woff2"
        />
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
