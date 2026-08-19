import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinScope Strategy Lab™ | آزمایشگاه استراتژی فین‌اسکوپ",
  description: "AI-Powered Quantitative Strategy Research Platform - پلتفرم تحقیق استراتژی کمی با هوش مصنوعی",
  keywords: [
    "Strategy Backtesting", "Trading Strategy Backtester", "Algorithmic Trading",
    "Quantitative Trading", "Strategy Optimization", "Portfolio Strategy Analysis",
    "Walk Forward Analysis", "Monte Carlo Backtesting", "Trading Strategy Research",
    "بک تست استراتژی", "بک تست فارکس", "بک تست بورس", "آزمایشگاه استراتژی",
    "استراتژی معاملاتی", "تحلیل استراتژی", "بهینه سازی استراتژی", "مدیریت ریسک",
    "تحلیل کمی", "معاملات الگوریتمی",
  ],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#071A2B' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
