/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // يتجاهل أخطاء TypeScript أثناء رفع المشروع
    ignoreBuildErrors: true,
  },
  eslint: {
    // يتجاهل تحذيرات ESLint أثناء رفع المشروع
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
