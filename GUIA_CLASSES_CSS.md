# Guia de Classes CSS Padronizadas

Este documento define as classes CSS que devem ser usadas em todo o projeto para garantir consistência e suporte completo aos temas.

## 🎨 Cores Principais

### Backgrounds
- ✅ `bg-background` - Fundo principal da página
- ✅ `bg-card` - Fundo de cards
- ✅ `bg-popover` - Fundo de popovers/dropdowns
- ✅ `bg-muted` - Fundo para elementos secundários
- ❌ ~~`bg-white`~~ - NÃO USAR (não funciona com tema escuro)
- ❌ ~~`bg-gray-50`~~ - NÃO USAR

### Textos
- ✅ `text-foreground` - Texto principal
- ✅ `text-card-foreground` - Texto em cards
- ✅ `text-muted-foreground` - Texto secundário/desabilitado
- ✅ `text-primary` - Texto com cor primária
- ✅ `text-destructive` - Texto de erro/destrutivo
- ❌ ~~`text-gray-900`~~ - NÃO USAR
- ❌ ~~`text-gray-600`~~ - NÃO USAR
- ❌ ~~`text-white`~~ - NÃO USAR (use `text-primary-foreground`)

### Bordas
- ✅ `border-border` - Borda padrão
- ✅ `border-input` - Borda de inputs
- ❌ ~~`border-gray-200`~~ - NÃO USAR
- ❌ ~~`border-gray-300`~~ - NÃO USAR

## 🔘 Botões

### Variantes Padrão (shadcn/ui)
```tsx
<Button variant="default">Padrão</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destrutivo</Button>
```

### ❌ NÃO USAR
- `bg-orange-500` - Use `bg-primary`
- `bg-blue-500` - Use `bg-accent` ou `bg-secondary`
- `text-white` em botões - Use `text-primary-foreground`

## 📦 Cards

```tsx
<Card className="border-border bg-card">
  <CardHeader>
    <CardTitle className="text-card-foreground">Título</CardTitle>
  </CardHeader>
  <CardContent className="text-card-foreground">
    Conteúdo
  </CardContent>
</Card>
```

### Classes Úteis
- `card-glass` - Card com backdrop blur (já definido em globals.css)
- `bg-card/80` - Card com transparência

## 📝 Inputs

```tsx
<input className="input-base" />
```

Ou manualmente:
```tsx
<input className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary" />
```

## 🎯 Badges

```tsx
<span className="badge-primary">Badge</span>
<span className="badge-secondary">Badge</span>
<span className="badge-muted">Badge</span>
```

## 🔄 Migração

### Antes (❌)
```tsx
<div className="bg-white text-gray-900 border-gray-200">
  <button className="bg-orange-500 text-white">Clique</button>
</div>
```

### Depois (✅)
```tsx
<div className="bg-card text-card-foreground border-border">
  <Button>Clique</Button>
</div>
```

## 📋 Checklist de Migração

Ao corrigir um componente, verifique:

- [ ] Substituir `bg-white` por `bg-card` ou `bg-background`
- [ ] Substituir `text-gray-*` por `text-foreground` ou `text-muted-foreground`
- [ ] Substituir `border-gray-*` por `border-border`
- [ ] Substituir `bg-orange-500` por `bg-primary`
- [ ] Substituir `text-white` por `text-primary-foreground` ou `text-card-foreground`
- [ ] Testar com tema escuro
- [ ] Verificar contraste de texto

## 🎨 Tema Escuro

O tema escuro é aplicado automaticamente quando o usuário seleciona o tema "dark". Todas as classes padronizadas funcionam automaticamente.

Para testar:
1. Selecione o tema "Escuro" no dashboard
2. Verifique se todos os textos são legíveis
3. Verifique se os botões têm contraste adequado
4. Verifique se os cards têm bordas visíveis

