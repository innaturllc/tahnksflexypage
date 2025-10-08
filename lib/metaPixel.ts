// lib/metaPixel.ts

type FbqFn = ((...args: any[]) => void) & {
  callMethod?: (...args: any[]) => void;
  queue?: any[][];
  loaded?: boolean;
  version?: string;
  push?: any;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

/** Load fbq bootstrap once (client-only) */
function ensureFbqBootstrapped() {
  if (typeof window === "undefined") return;
  if (window.fbq) return;

  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;

    const n: FbqFn = ((...args: any[]) => {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue!.push(args);
      }
    }) as any;

    f.fbq = n;
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );
}

/**
 * Initialize Meta Pixel (no-op on SSR or missing ID).
 * Optionally pass advanced matching (e.g. { em: hashedEmail } – Meta auto-hashes).
 */
export function initMetaPixel(
  pixelId?: string,
  advancedMatching: Record<string, any> = {}
) {
  if (typeof window === "undefined" || !pixelId) return;
  ensureFbqBootstrapped();
  window.fbq?.("init", pixelId, advancedMatching);
}

/** Track any pixel event (e.g., 'PageView', 'CompleteRegistration') */
export function trackMeta(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params || {});
}

/** Convenience for PageView */
export function trackPageView() {
  trackMeta("PageView");
}
