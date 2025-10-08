import type { NextApiRequest, NextApiResponse } from "next";

const UPSTREAM_ORIGIN = "https://flexy-pilates.superwall.app";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pathSegments = (req.query.path as string[] | undefined) || [];
  const upstreamPath = "/" + pathSegments.map(encodeURIComponent).join("/");

  const upstreamUrl = new URL(upstreamPath || "/", UPSTREAM_ORIGIN);
  // Forward query params
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path") return;
    if (Array.isArray(value)) {
      value.forEach((v) => upstreamUrl.searchParams.append(key, v));
    } else if (value != null) {
      upstreamUrl.searchParams.set(key, String(value));
    }
  });

  const requestInit: RequestInit = {
    method: req.method,
    headers: {
      // Pass through most headers but avoid hop-by-hop
      "user-agent": req.headers["user-agent"] || "",
      accept: req.headers["accept"] || "*/*",
      "accept-language": req.headers["accept-language"] || "",
      referer: req.headers["referer"] || "",
    },
    // Only pass a body for relevant methods
    body: ["POST", "PUT", "PATCH", "DELETE"].includes(req.method || "") ? (req as any).body : undefined,
    redirect: "manual",
  };

  try {
    const upstreamResp = await fetch(upstreamUrl.toString(), requestInit as any);

    // Copy status
    res.status(upstreamResp.status);

    // Gather response body (we may need to transform HTML)
    const contentType = upstreamResp.headers.get("content-type") || "";

    // Clone headers but strip frame-blockers and set caching conservatively
    const headerEntries: Array<[string, string]> = [];
    upstreamResp.headers.forEach((v, k) => {
      const key = k.toLowerCase();
      if (key === "x-frame-options") return; // strip
      if (key === "content-security-policy") return; // strip, we will allow embedding on our route scope
      // Avoid setting forbidden headers by Next
      if (key === "transfer-encoding") return;
      if (key === "content-length") return;
      headerEntries.push([k, v]);
    });

    // Force same content-type downstream
    res.setHeader("Content-Type", contentType || "text/html; charset=utf-8");
    // Allow framing on our domain only via route-level headers configured in next.config.js
    res.setHeader("Cache-Control", "public, max-age=60");

    if (contentType.includes("text/html")) {
      const html = await upstreamResp.text();

      // Inject a <base> for relative URLs to resolve to /onboarding/
      const baseHref = "/onboarding/";
      const injected = html.replace(
        /<head(\s[^>]*)?>/i,
        (m) => `${m}\n<base href="${baseHref}">`
      );

      res.send(injected);
      return;
    }

    // For non-HTML (assets, JSON, etc.) stream as-is
    headerEntries.forEach(([k, v]) => res.setHeader(k, v));
    const arrayBuffer = await upstreamResp.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(502).json({ error: "Bad gateway", message: err?.message || "Upstream fetch failed" });
  }
}

export const config = {
  api: {
    bodyParser: false, // pass raw body for non-GET methods
    responseLimit: false,
  },
};


