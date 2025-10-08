/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "https://flexy-pilates.superwall.app/:path*", // external URL
      },
    ];
  },
  // (optional) if Superwall sets CSP or needs forwarded headers:
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Forwarded-Host", value: "flexy-pilates.com" },
          { key: "X-Forwarded-Proto", value: "https" },
        ],
      },
    ];
  },
};
