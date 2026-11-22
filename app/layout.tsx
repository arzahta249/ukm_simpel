import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "SIMPEL — Portal Publikasi Karya Tulis Ilmiah UKM SIMPEL",
    template: "%s · SIMPEL",
  },
  description:
    "Portal pengumpulan, telaah sejawat, dan publikasi karya tulis ilmiah serta essay mahasiswa UKM Studi Ilmiah Mahasiswa (SIMPEL) Universitas Pancasakti Tegal.",
  icons: { icon: "/logo-simpel.jpg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
