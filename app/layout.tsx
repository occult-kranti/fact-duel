import type { Metadata, Viewport } from 'next';
import './theme/tokens.css';
import './globals.css';
import './rivalry.css';
import './expeditions.css';

/* Open Graph images must be absolute URLs. SITE_BASE is the same knob scripts/seo-pages.mjs reads;
   the GitHub Pages address is the fallback, as in lib/seo/intents.mjs DEFAULT_BASE. */
const SITE_BASE = process.env.SITE_BASE || 'https://occult-kranti.github.io/fact-duel';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_BASE),
  title: 'Jaanta Hai Kya — Do you know? Prove it.',
  description:
    'Jaanta Hai Kya (JHK): competitive sports quizzing. Football, cricket, baseball, Formula 1 and basketball. Duel a friend or a bot under the clock, run an expedition, collect stamps. Free coins, no purchases.',
  applicationName: 'Jaanta Hai Kya',
  openGraph: {
    title: 'Jaanta Hai Kya — Do you know? Prove it.',
    description:
      'Competitive sports quizzing: football, cricket, baseball, Formula 1 and basketball. Duel a friend or a bot under the clock. Free coins, no purchases.',
    siteName: 'Jaanta Hai Kya',
    type: 'website',
    images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: 'Jaanta Hai Kya — Do you know? Prove it.' }],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/brand/apple-touch-icon.png',
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
