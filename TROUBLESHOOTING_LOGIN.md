# 🔧 Troubleshooting: Erro "Invalid API key"

## ✅ Checklist Rápido

Siga estes passos na ordem:

### 1. Verificar o arquivo `.env.local`

O arquivo deve estar na **raiz do projeto** (mesmo nível que `package.json`).

Conteúdo esperado:
```env
NEXT_PUBLIC_SUPABASE_URL=https://irombysdylzmovsthekn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RsFYZd3-0Thohl7cLt4LcQ_PhmJ5Awp
```

**⚠️ IMPORTANTE:**
- ❌ **NÃO** coloque espaços antes ou depois do `=`
- ❌ **NÃO** coloque aspas ao redor dos valores
- ❌ **NÃO** deixe linhas vazias no meio
- ✅ Use a chave **COMPLETA** (começa com `sb_publishable_` e termina com `Awp`)

### 2. Reiniciar o Servidor

**CRÍTICO:** O Next.js só carrega variáveis de ambiente quando o servidor é iniciado.

1. **Pare o servidor completamente:**
   - No terminal, pressione `Ctrl + C`
   - Aguarde até ver a mensagem de que o servidor parou

2. **Inicie novamente:**
   ```bash
   npm run dev
   ```

3. **Aguarde o servidor iniciar completamente** (você verá "Ready" no terminal)

### 3. Limpar Cache do Navegador

Às vezes o navegador pode estar usando uma versão em cache:

1. Pressione `Ctrl + Shift + R` (ou `Cmd + Shift + R` no Mac) para fazer hard refresh
2. Ou abra uma janela anônima/privada e teste lá

### 4. Verificar se as Variáveis Estão Sendo Carregadas

Adicione temporariamente este código no início do arquivo `src/app/login/page.tsx` para debugar:

```typescript
useEffect(() => {
  console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SUPABASE_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...");
}, []);
```

Se aparecer `undefined`, as variáveis não estão sendo carregadas.

### 5. Verificar o Formato da Chave

A chave deve:
- Começar com `sb_publishable_`
- Ter aproximadamente 50-60 caracteres
- **NÃO** ter espaços ou quebras de linha

### 6. Verificar se Está Usando a Chave Correta

No Supabase Dashboard:
1. Vá em **Settings** > **API Keys**
2. Na aba **"Publishable and secret API keys"**
3. Copie a chave da seção **"Publishable key"** (NÃO a Secret key)
4. A chave deve começar com `sb_publishable_`

## 🚨 Soluções Comuns

### Problema: "Invalid API key" mesmo com variáveis configuradas

**Solução:**
1. Pare o servidor (`Ctrl + C`)
2. Delete a pasta `.next` (cache do Next.js):
   ```bash
   rm -rf .next
   # ou no Windows PowerShell:
   Remove-Item -Recurse -Force .next
   ```
3. Reinicie o servidor:
   ```bash
   npm run dev
   ```

### Problema: Variáveis aparecem como `undefined` no console

**Solução:**
1. Verifique se o arquivo está na raiz do projeto
2. Verifique se não há espaços extras no `.env.local`
3. Reinicie o servidor completamente

### Problema: Funciona localmente mas não na Vercel

**Solução:**
1. Verifique se as variáveis estão configuradas na Vercel:
   - Dashboard Vercel > Settings > Environment Variables
2. Certifique-se de que selecionou **todos os ambientes** (Production, Preview, Development)
3. Faça um **novo deploy** após adicionar as variáveis

## 📝 Exemplo Correto do `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://irombysdylzmovsthekn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RsFYZd3-0Thohl7cLt4LcQ_PhmJ5Awp
```

**Sem espaços, sem aspas, sem linhas extras!**

## 🔍 Verificação Final

Após seguir todos os passos:

1. ✅ Servidor reiniciado?
2. ✅ `.env.local` na raiz do projeto?
3. ✅ Variáveis sem espaços extras?
4. ✅ Chave completa copiada?
5. ✅ Cache do navegador limpo?

Se ainda não funcionar, verifique o console do navegador (F12) para ver se há outros erros.

---

**Dica:** Se você estiver usando VS Code, pode instalar a extensão "DotENV" para destacar erros de sintaxe no arquivo `.env.local`.

