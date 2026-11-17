import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Santosh Yadav Fitness — Simple Hinglish Indian Diet Plan',
  description: 'Santosh Yadav ka simple Hinglish diet plan — Fat Loss ya Weight Gain ke liye. Ghar ka khaana, practical meal schedule aur instant PDF download.',
  openGraph: {
    title: 'Santosh Yadav Fitness — Simple Hinglish Diet Plan',
    description: 'Apne fitness goal ke according practical diet plan choose karein.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/src/assets/images/santosh_brand_emblem_1794856625180.jpg' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0D0E',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="hi" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700;1,800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0B0D0E] text-[#211A15] antialiased selection:bg-[#F47716]/25 selection:text-[#F47716]">
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
