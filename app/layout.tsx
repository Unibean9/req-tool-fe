import type { Metadata } from "next";

import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { fontInter, rootFontVariables } from "@/lib/fonts";
import { RootJsonLd } from "@/lib/seo/root-json-ld";
import { rootMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${rootFontVariables} dark h-full`}
    >
      <body
        className={`${fontInter.className} min-h-full flex flex-col font-sans antialiased`}
      >
        <RootJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
