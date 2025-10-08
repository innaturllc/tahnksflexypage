/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;

// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/paywall/:path*",
        destination: "https://flexy-pilates.superwall.app/:path*", // external URL
      },
    ];
  },
  // (optional) if Superwall sets CSP or needs forwarded headers:
  async headers() {
    return [
      {
        source: "/paywall/:path*",
        headers: [
          { key: "X-Forwarded-Host", value: "thnksflexypage.vercel.app" },
          { key: "X-Forwarded-Proto", value: "https" },
        ],
      },
    ];
  },
};
