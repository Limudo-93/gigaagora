// Script para verificar se as variáveis de ambiente estão carregadas
// Execute: node verificar-variaveis.js

require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Verificando variáveis de ambiente...\n');

if (!url) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrada!');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', url);
}

if (!key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada!');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', key.substring(0, 30) + '...');
  console.log('   Tamanho da chave:', key.length, 'caracteres');
  
  if (!key.startsWith('sb_publishable_')) {
    console.warn('⚠️  AVISO: A chave não começa com "sb_publishable_"');
    console.warn('   Certifique-se de que está usando a Publishable key, não a Secret key!');
  }
}

if (url && key) {
  console.log('\n✅ Todas as variáveis estão configuradas!');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Pare o servidor (Ctrl + C)');
  console.log('2. Delete a pasta .next: rm -rf .next (ou Remove-Item -Recurse -Force .next no PowerShell)');
  console.log('3. Reinicie: npm run dev');
} else {
  console.log('\n❌ Algumas variáveis estão faltando!');
  console.log('   Verifique o arquivo .env.local na raiz do projeto.');
}

