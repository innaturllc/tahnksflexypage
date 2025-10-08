import { useEffect } from "react";
import Head from "next/head";
import MetaNoScript from "../components/MetaNoScript";
import { initMetaPixel, trackPageView } from "../lib/metaPixel";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export default function Home() {
  useEffect(() => {
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
      trackPageView();
    }
  }, []);

  return (
    <>
      <Head>
        <title>Flexy Pilates — Onboarding</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {META_PIXEL_ID ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
            }}
          />
        ) : null}
      </Head>

      {META_PIXEL_ID ? <MetaNoScript pixelId={META_PIXEL_ID} /> : null}

      <iframe
        src="/onboarding/"
        title="Flexy Pilates Onboarding"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "0",
        }}
        allow="clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </>
  );
}


