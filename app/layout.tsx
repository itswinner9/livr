import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: {
    default: 'LivRank | Rate Apartments, Neighborhoods & Landlords in Vancouver & Canada',
    template: '%s | LivRank'
  },
  description: 'LivRank - Honest reviews for apartments, neighborhoods, and landlords in Vancouver, Toronto, and across Canada. See what real tenants say before you rent. Verified tenant reviews, building ratings, and neighborhood insights.',
  keywords: 'Vancouver apartments, Vancouver rentals, Vancouver neighborhoods, Vancouver landlords, Toronto apartments, Canada rental reviews, apartment reviews Vancouver, landlord reviews Vancouver, neighborhood reviews Vancouver, building ratings Vancouver, best neighborhoods Vancouver, rental reviews Canada, tenant reviews, verified tenant reviews, Vancouver housing, Vancouver real estate reviews, property management reviews Vancouver',
  authors: [{ name: 'LivRank' }],
  creator: 'LivRank',
  publisher: 'LivRank',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://livrank.ca'),
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://livrank.ca',
    siteName: 'LivRank',
    title: 'LivRank | Rate Apartments, Neighborhoods & Landlords in Vancouver & Canada',
    description: 'Rate and explore apartments, buildings, landlords, and neighborhoods in Vancouver, Toronto, and across Canada. Trusted by tenants. Verified reviews.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LivRank - Real Reviews from Real Tenants'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LivRank | Rate Apartments, Neighborhoods & Landlords in Vancouver',
    description: 'Rate and explore apartments, buildings, landlords, and neighborhoods in Vancouver and across Canada. Verified tenant reviews.',
    images: ['/og-image.png'],
    site: '@livrank',
    creator: '@livrank'
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
  verification: {
    // Add when you get these
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: 'https://livrank.ca',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-CA">
      <head>
        {/* Additional SEO tags */}
        <meta name="theme-color" content="#f97316" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LivRank" />
        {/* Preconnect to Supabase for faster loading */}
        <link rel="preconnect" href="https://eehtzdpzbjsuendgwnwy.supabase.co" />
        <link rel="dns-prefetch" href="https://eehtzdpzbjsuendgwnwy.supabase.co" />
      </head>
      <body className={`${poppins.className} ${poppins.variable} font-sans`}>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'LivRank',
            url: 'https://livrank.ca',
            description: 'Rate and review apartments, neighborhoods, and landlords in Vancouver and across Canada',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://livrank.ca/explore?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
            publisher: {
              '@type': 'Organization',
              name: 'LivRank',
              url: 'https://livrank.ca',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'LivRank',
            url: 'https://livrank.ca',
            logo: 'https://livrank.ca/logo.png',
            description: 'Real tenant reviews for apartments, neighborhoods, and landlords in Vancouver and across Canada',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Vancouver',
              addressRegion: 'BC',
              addressCountry: 'CA',
            },
            sameAs: [
              'https://twitter.com/livrank',
            ],
          }),
        }}
      />
      <Navigation />
      {children}
      <Footer />
      </body>
    </html>
  )
}
