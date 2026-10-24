import type { Metadata } from "next";
import { Newsreader, Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { TopBar } from "@/components/TopBar";
import { StoreSync } from "@/components/StoreSync";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const ui = Instrument_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const time = Spline_Sans_Mono({
  variable: "--font-time",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Minutes — your meetings, verifiable",
    template: "%s · Minutes",
  },
  description:
    "Minutes records your calls, transcribes them, and turns everything into moments you can click, verify and share.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${ui.variable} ${time.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <StoreSync />
        <TopBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}