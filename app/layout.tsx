import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kr"
});

export const metadata: Metadata = {
  title: "CoSync",
  description: "창업자를 위한 계약서 생성 도움 SaaS"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={noto.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
