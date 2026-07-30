import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "生竞人生｜生物竞赛生模拟器",
  description:
    "从初三毕业后的暑假开始，在教材、关系、SAN与两次省赛机会之间，走完属于你的生物竞赛人生。",
  openGraph: {
    title: "生竞人生",
    description: "一次为期两年的选择实验。",
    type: "website",
    images: [
      {
        url: "https://shengjing-rensheng-0728.f45656193.chatgpt.site/og.png",
        width: 1536,
        height: 1024,
        alt: "雨夜竞赛教室中的生物竞赛生",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "生竞人生",
    description: "一次为期两年的选择实验。",
    images: [
      "https://shengjing-rensheng-0728.f45656193.chatgpt.site/og.png",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
