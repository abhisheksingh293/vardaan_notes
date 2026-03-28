import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SWRProvider } from "@/components/SWRProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vardaan Comet Platform",
  description: "Student learning platform by Vardaan Comet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
