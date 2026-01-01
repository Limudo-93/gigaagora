/**
 * Script para gerar chaves VAPID
 * Execute: npm install web-push --save-dev
 * Depois: node scripts/generate-vapid-keys.js
 *
 * NOTA: web-push precisa ser instalado primeiro como devDependency
 */

let webpush;
try {
  webpush = require("web-push");
} catch (e) {
  console.error("❌ Erro: web-push não está instalado.");
  console.error("Execute primeiro: npm install web-push --save-dev");
  process.exit(1);
}

console.log("🔑 Gerando chaves VAPID...\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("✅ Chaves geradas com sucesso!\n");
console.log("=".repeat(60));
console.log("Adicione estas variáveis ao seu .env.local e Vercel:\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
console.log("VAPID_SUBJECT=mailto:seu-email@exemplo.com");
console.log("=".repeat(60));
console.log("\n⚠️  IMPORTANTE:");
console.log("- A chave PRIVADA nunca deve ser exposta no código do cliente");
console.log(
  "- A chave PÚBLICA pode ser usada no código do cliente (NEXT_PUBLIC_)",
);
console.log(
  "- VAPID_SUBJECT deve ser um email válido (mailto:seu-email@exemplo.com)",
);
