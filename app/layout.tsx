import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { publicEnv } from "@/lib/env";

const bodySans = Inter({
  variable: "--font-body-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Instant Garage Floor Estimate | GarageExperts of Portland",
  description:
    "Get an instant Silver, Gold, or Platinum Garage FX floor coating estimate for your Portland-area garage in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const metaPixelId = publicEnv.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={`${bodySans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">
        {metaPixelId ? (
          <>
            {/* Meta Pixel base code -- auto-tracks PageView on load; the
                "Lead" event fires separately from lib/analytics/adapter.ts
                right after contact info is submitted. */}
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element -- Meta's documented no-JS fallback pixel */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
