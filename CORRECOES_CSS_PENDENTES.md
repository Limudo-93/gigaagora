# Correções CSS Pendentes - Checklist

## Componentes que precisam correção completa

### Prioridade Alta (Componentes mais usados)
- [ ] `GigCard.tsx` - ✅ CORRIGIDO
- [ ] `PendingInvites.tsx` - 🔄 EM PROGRESSO
- [ ] `UpcomingConfirmedGigs.tsx`
- [ ] `CompletedGigsToRate.tsx`
- [ ] `GigsTabs.tsx`
- [ ] `InviteCard.tsx`
- [ ] `GigDetailsDialog.tsx`

### Prioridade Média
- [ ] `RatingDialog.tsx`
- [ ] `ReferralSystem.tsx`
- [ ] `SearchRadiusSlider.tsx`
- [ ] `CancellationAlertCard.tsx`
- [ ] `ProfileCompletion.tsx`
- [ ] `ReportDialog.tsx`
- [ ] `LocationInfo.tsx`
- [ ] `MyGigs.tsx`
- [ ] `InviteDetailsDialog.tsx`

### Prioridade Baixa
- [ ] `DownloadICSButton.tsx`
- [ ] `Footer.tsx`
- [ ] `ShareGigButton.tsx`
- [ ] `Header.tsx`
- [ ] `ThemeSelector.tsx`
- [ ] `ThemedBackground.tsx`

## Padrão de Substituição

### Classes de Background
- `bg-white` → `bg-card`
- `bg-white/80` → `bg-card/80`
- `bg-white/90` → `bg-card/90`
- `bg-gray-50` → `bg-muted`
- `bg-gray-100` → `bg-muted`
- `bg-gray-200` → `bg-muted`
- `bg-orange-50` → `bg-muted/50`
- `bg-orange-100` → `bg-primary/10`
- `bg-orange-500` → `bg-primary`
- `bg-red-50` → `bg-destructive/10`
- `bg-blue-50` → `bg-accent/10`

### Classes de Texto
- `text-gray-900` → `text-foreground`
- `text-gray-800` → `text-foreground`
- `text-gray-700` → `text-muted-foreground`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`
- `text-white` → `text-primary-foreground` ou `text-card-foreground`
- `text-orange-600` → `text-primary`
- `text-red-600` → `text-destructive`
- `text-blue-600` → `text-accent`

### Classes de Borda
- `border-gray-200` → `border-border`
- `border-gray-300` → `border-border`
- `border-white/20` → `border-border`
- `border-orange-500` → `border-primary`
- `border-red-300` → `border-destructive`

### Botões - REMOVER TODAS AS CLASSES CUSTOMIZADAS
- Remover `className` com cores customizadas
- Usar apenas `variant` e `size`
- `variant="default"` para botões primários
- `variant="destructive"` para ações destrutivas
- `variant="outline"` para botões secundários
- `variant="ghost"` para ações terciárias

### Badges - REMOVER CLASSES CUSTOMIZADAS
- Usar apenas `variant`
- `variant="default"` para badges primários
- `variant="secondary"` para badges secundários
- `variant="destructive"` para badges de erro
- `variant="outline"` para badges outline

## Exemplo de Correção

### Antes ❌
```tsx
<div className="rounded-xl border bg-white p-4 border-gray-200">
  <h2 className="text-xl font-semibold text-gray-900">Título</h2>
  <p className="text-sm text-gray-600">Texto</p>
  <Button className="bg-orange-500 text-white hover:bg-orange-600">
    Clique
  </Button>
  <Badge className="bg-gray-200 text-gray-900 border border-gray-300">
    Badge
  </Badge>
</div>
```

### Depois ✅
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">Texto</p>
    <Button>Clique</Button>
    <Badge variant="secondary">Badge</Badge>
  </CardContent>
</Card>
```

