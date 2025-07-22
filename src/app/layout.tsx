import { SessionProvider } from "next-auth/react"
import { Inter } from "next/font/google"
import type React from "react"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "white",
                border: "1px solid #dbdade",
                color: "#4b465c",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
