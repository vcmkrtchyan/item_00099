import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LibraryProvider } from "@/context/library-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Library Management",
  description: "Manage your personal book collection",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LibraryProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 max-w-7xl mx-auto w-full py-4 md:py-6">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </LibraryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'