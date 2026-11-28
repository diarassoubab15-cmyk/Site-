import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SupportButton } from "@/components/SupportButton";
import { JsonLd } from "@/components/JsonLd";
import { Toaster } from "@/components/Toaster";
import { Particles } from "@/components/Particles";
import { motionScript } from "@/lib/motion-script";
import { site, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Achetez et vendez au Mali, vendeurs vérifiés`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: site.locale, siteName: site.name, url: site.url, title: site.name, description: site.description },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#f2f4f5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body className="min-h-screen">
        <Particles />
        <Toaster />
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-black focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-[var(--shadow-float)]">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <SupportButton />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.name,
              url: site.url,
              logo: absoluteUrl("/icon.svg"),
              contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: site.support.email, telephone: site.support.whatsapp, availableLanguage: ["French"] }],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: site.name,
              url: site.url,
              potentialAction: { "@type": "SearchAction", target: `${site.url}/marketplace?q={search_term_string}`, "query-input": "required name=search_term_string" },
            },
          ]}
        />
      </body>
    </html>
  );
}
