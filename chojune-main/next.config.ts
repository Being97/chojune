// next.config.mjs (또는 next.config.js)
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 언스플래시 이미지 링크 사용 시
      },
    ],
  },
};
export default nextConfig;