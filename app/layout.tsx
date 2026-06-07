import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "品質工学 先人の知を現場の力に",
  description: "先人にアクセスし，先人の力・知恵を現場につなぎます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
