import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alceix Panel",
  description: "Firebase tabanli satis ve uretim yonetim paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
