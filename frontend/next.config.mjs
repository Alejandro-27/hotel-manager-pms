/* global process */
/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
]

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  async headers() {
    const headers = [...securityHeaders]
    if (process.env.NODE_ENV === 'production') {
      headers.push({ key: 'Content-Security-Policy', value: contentSecurityPolicy })
    }
    return [
      {
        source: '/(.*)',
        headers,
      },
    ]
  },
}

export default nextConfig
