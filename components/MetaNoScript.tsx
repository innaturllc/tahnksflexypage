// components/MetaNoScript.tsx
import React from "react";

export default function MetaNoScript({ pixelId }: { pixelId: string }) {
  // This renders ONLY when JS is disabled. Safe to include on any page.
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${encodeURIComponent(
          pixelId
        )}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
