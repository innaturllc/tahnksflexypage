/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/onboarding/:path*",
        destination: "/api/proxy-onboarding/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/onboarding/:path*",
        headers: [
          // Allow this route to be embedded (X-Frame-Options is omitted entirely)
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
