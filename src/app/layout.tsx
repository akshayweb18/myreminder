import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RemindMe — Remember Everything. Forget Nothing.',
    template: '%s | RemindMe',
  },
  description:
    'RemindMe is a world-class reminder application with premium UX, smart scheduling, and beautiful design. Never miss what matters.',
  keywords: [
    'reminder',
    'reminder app',
    'smart reminders',
    'task manager',
    'productivity',
    'PWA',
    'AI reminders',
  ],
  authors: [{ name: 'RemindMe' }],
  creator: 'RemindMe',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RemindMe',
  },
  openGraph: {
    type: 'website',
    title: 'RemindMe — Remember Everything. Forget Nothing.',
    description: 'A world-class reminder PWA with premium UX and smart scheduling.',
    siteName: 'RemindMe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemindMe',
    description: 'Remember Everything. Forget Nothing.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a14' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
