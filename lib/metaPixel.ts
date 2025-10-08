// lib/metaPixel.ts
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Initialize Meta Pixel (no-op if already done).
 * Optionally pass advancedMatching (e.g. { external_id: '...' } — auto-hashed).
 */
export function initMetaPixel(
  pixelId?: string,
  advancedMatching: Record<string, any> = {}
) {
  if (typeof window === "undefined") return; // SSR guard
  if (!pixelId) return;

  if (!window.fbq) {
    // Meta bootstrap
    !(function (f: any, b, e, v, n?, t?, s?) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
  }

  // Initialize with optional advanced matching
  window.fbq?.("init", pixelId, advancedMatching);
}

/** Track an event (e.g. 'PageView', 'CompleteRegistration') */
export function trackMeta(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params || {});
}

/** Convenience for PageView */
export function trackPageView() {
  trackMeta("PageView");
}
