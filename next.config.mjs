/** @type {import('next').NextConfig} */
// Configuração corrigida: typedRoutes movido de experimental para raiz
const nextConfig = {
  typedRoutes: true,
  // PWA Configuration
  // O service worker será servido de /public/sw.js
};

export default nextConfig;
