import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { locales, isLocale, dir, BASE } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AppProvider } from '@/components/AppProvider';
import '../globals.css';

export const dynamicParams = false;
export function generateStaticParams() { return locales.map((lang) => ({ lang })); }
export const metadata: Metadata = { metadataBase: new URL(BASE), robots: { index: true, follow: true } };

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  return (
    <html lang={lang} dir={dir(lang)} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('sw.theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){}" }} />
      </head>
      <body>
        {gtm && <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}</Script>}
        <AppProvider lang={lang}>
          <div className="wrap">
            <Header />
            <main>{children}</main>
            <Footer lang={lang} />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
