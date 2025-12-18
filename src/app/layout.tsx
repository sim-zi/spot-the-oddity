import BGMPlayer from "@/components/BGMPlayer";
import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Knowledge History - 지식 계보 게임",
  description:
    "지식을 AI에게 설명하고, 새롭게 탄생하는 지식의 계보를 확인하세요!",
  openGraph: {
    title: "Knowledge History",
    description:
      "지식을 AI에게 설명하고, 새롭게 탄생하는 지식의 계보를 확인하세요!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge History",
    description:
      "지식을 AI에게 설명하고, 새롭게 탄생하는 지식의 계보를 확인하세요!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKR.variable} ${notoSerifKR.variable} antialiased`}
      >
        <BGMPlayer />
        {children}
      </body>
    </html>
  );
}
