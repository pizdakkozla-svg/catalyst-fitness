import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = { title: 'Catalyst Fitness | Transform 90', description: 'A 12-week coaching system for people ready to build a body and routine they can trust.', applicationName: 'Catalyst Fitness', openGraph: { title: 'Catalyst Fitness | Transform 90', description: 'Build the body that backs you.', type: 'website' } }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#1b1a18', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-background"><body className={`${geist.variable} ${geistMono.variable} antialiased`}>{children}{process.env.NODE_ENV === 'production' && <><Analytics /><SpeedInsights /></>}</body></html> }
