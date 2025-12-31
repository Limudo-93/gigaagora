# Como Verificar e Configurar VAPID Keys

## Verificar se as chaves estão configuradas

### 1. Variáveis de Ambiente Necessárias

Você precisa ter as seguintes variáveis configuradas:

**No `.env.local` (desenvolvimento):**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica_vapid_aqui
VAPID_PRIVATE_KEY=sua_chave_privada_vapid_aqui
VAPID_SUBJECT=mailto:seu@email.com
```

**No Vercel (produção):**
- Vá em Settings > Environment Variables
- Adicione as três variáveis acima

### 2. Gerar Chaves VAPID (se não tiver)

Execute o script para gerar as chaves:

```bash
node scripts/generate-vapid-keys.js
```

Isso irá gerar:
- `VAPID_PUBLIC_KEY` - use no `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY` - use no `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` - pode ser qualquer email (ex: `mailto:admin@chamaomusico.com`)

### 3. Verificar se está funcionando

1. Abra o console do navegador (F12)
2. Vá para a página de forçar registro: `/dashboard/force-push-register`
3. Clique em "Forçar Registro Agora"
4. Verifique se aparece algum erro relacionado a VAPID no console

### 4. Troubleshooting

**Erro: "NEXT_PUBLIC_VAPID_PUBLIC_KEY não está configurado"**
- Verifique se a variável está no `.env.local` (desenvolvimento)
- Verifique se a variável está configurada no Vercel (produção)
- Reinicie o servidor de desenvolvimento após adicionar a variável
- Certifique-se de que o nome está correto: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (não `VAPID_PUBLIC_KEY`)

**A variável começa com `NEXT_PUBLIC_`?**
- Sim! `NEXT_PUBLIC_` é necessário para que a variável seja acessível no código cliente (browser)
- Sem `NEXT_PUBLIC_`, a variável só estará disponível no servidor

**Como verificar no código?**
No console do navegador, você pode executar:
```javascript
console.log('VAPID Key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
```

Se retornar `undefined`, a variável não está configurada corretamente.

