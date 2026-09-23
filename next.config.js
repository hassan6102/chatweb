/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Firebase Admin SDK must never be bundled into client code.
  // Server-only modules live under firebase/admin.ts and lib/**/*.server.ts
  // and are only imported from Route Handlers / Server Components.
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
};

module.exports = nextConfig;
