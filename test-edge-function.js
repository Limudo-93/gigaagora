/**
 * Script para testar a Edge Function diretamente
 * Execute: node test-edge-function.js
 *
 * Isso ajudará a ver o erro completo retornado pela Edge Function
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://irombysdylzmovsthekn.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_ANON_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado");
  process.exit(1);
}

async function testEdgeFunction() {
  // Substitua pelos dados reais de uma subscription
  const testSubscription = {
    endpoint: "https://fcm.googleapis.com/wp/djgq0Hr9mUI:APA91bHn...", // Substitua pelo endpoint real
    keys: {
      p256dh: "...", // Substitua pela chave real
      auth: "...", // Substitua pela chave real
    },
  };

  const testPayload = {
    title: "Teste de Notificação",
    body: "Esta é uma notificação de teste",
  };

  try {
    console.log("🔍 Testando Edge Function...\n");

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: testSubscription,
          payload: testPayload,
        }),
      },
    );

    console.log("📊 Status:", response.status, response.statusText);
    console.log("📋 Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("\n📄 Response Body:");
    console.log(responseText);

    if (!response.ok) {
      try {
        const errorJson = JSON.parse(responseText);
        console.log("\n❌ Erro detalhado:");
        console.log(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log("\n❌ Erro (não é JSON):", responseText);
      }
    } else {
      console.log("\n✅ Sucesso!");
    }
  } catch (error) {
    console.error("\n❌ Erro ao fazer requisição:", error);
    console.error("Stack:", error.stack);
  }
}

testEdgeFunction();
