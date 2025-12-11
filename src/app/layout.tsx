import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knowledge History - 지식 계보 게임",
  description:
    "가상의 지식을 AI에게 설명하고, 새롭게 탄생하는 지식의 계보를 확인하세요!",
  openGraph: {
    title: "Knowledge History",
    description:
      "가상의 지식을 AI에게 설명하고, 새롭게 탄생하는 지식의 계보를 확인하세요!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge History",
    description:
      "가상의 지식을 AI에게 설명하고, 새롭게 탄생하는 지식의 계보를 확인하세요!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
