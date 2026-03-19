import type { Metadata } from "next";
import { Noto_Sans_KR, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-noto-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OAuth Simulator",
  description: "OAuth 2.0 플로우 교육용 시뮬레이터 — Authorization Code, PKCE, Implicit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${roboto.variable} ${notoSansKr.variable}`}>
      <body className="ui-scrollbar antialiased">{children}</body>
    </html>
  );
}
