/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  transpilePackages: [
    'react-markdown',
    'remark-gfm',
    'remark-parse',
    'remark-rehype',
    'unified',
    'unist-util-visit',
    'micromark',
    'micromark-util-combine-extensions',
    'micromark-util-chunked',
    'micromark-extension-gfm',
  ],
}

module.exports = nextConfig
