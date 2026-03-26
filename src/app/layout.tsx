import { SubscriptionDebugger } from '@/components/dev/SubscriptionDebugger'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/auth-provider'
import { QueryProvider } from '@/context/query-provider'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const _geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const _geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: '416Permits | Building Permit Leads for GTA Contractors',
    template: '%s | 416Permits',
  },
  description:
    'Daily building permit leads for specialty trade contractors in the GTA. Track new construction, renovations, and building permits in real-time.',
  keywords: [
    'building permits',
    'GTA contractors',
    'construction leads',
    'permit tracking',
    'Toronto permits',
    'contractor leads',
    'building permit database',
    'specialty trades',
  ],
  authors: [{ name: '416Permits' }],
  creator: '416Permits',
  publisher: '416Permits',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://416permits.com',
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: '/',
    title: '416Permits | Building Permit Leads for GTA Contractors',
    description:
      'Daily building permit leads for specialty trade contractors in the GTA. Track new construction, renovations, and building permits in real-time.',
    siteName: '416Permits',
  },
  twitter: {
    card: 'summary_large_image',
    title: '416Permits | Building Permit Leads for GTA Contractors',
    description:
      'Daily building permit leads for specialty trade contractors in the GTA. Track new construction, renovations, and building permits in real-time.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <SubscriptionDebugger />
          </AuthProvider>
        </QueryProvider>
        <Toaster />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BG8JLCZPNG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BG8JLCZPNG');
          `}
        </Script>
      </body>
    </html>
  )
}
