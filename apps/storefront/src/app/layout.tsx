import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

import localFont from "next/font/local"

const supreme = localFont({
  src: [
    { path: "../../public/fonts/Supreme-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/Supreme-Medium.woff2",  weight: "500" },
    { path: "../../public/fonts/Supreme-Bold.woff2",    weight: "700" },
  ],
  variable: "--font-supreme",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={supreme.variable}>
    <body>
    <main className="relative">{props.children}</main>
    </body>
    </html>
  )
}