/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 
  // Strict security headers block Firebase Auth Redirects/Popups.
  // Commenting these out to restore login functionality.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
  */
};

export default nextConfig;
