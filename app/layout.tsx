import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { GameSentProvider } from "@/components/providers/GameSentProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameSent — Gaming Sentiment Research & Analytics Command Center",
  description:
    "Platform analitik riset sentimen Mobile Legends & Dota 2 menggunakan TF-IDF, Multinomial Naive Bayes, dan K-Nearest Neighbors berbasis browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="antialiased selection:bg-[#8B5CF6]/35 selection:text-[#F1F5F9]">
        <GameSentProvider>
          <AppShell>{children}</AppShell>
        </GameSentProvider>
      </body>
    </html>
  );
}
