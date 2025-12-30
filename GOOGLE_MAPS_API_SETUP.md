# 🔧 Configurar Google Maps API para Geocoding

Para usar o sistema de reverse geocoding (obter região a partir de coordenadas), você precisa configurar a API Key do Google Maps.

## Passo 1: Obter API Key do Google Maps

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Library**
4. Procure por **"Geocoding API"** e ative
5. Vá em **APIs & Services** > **Credentials**
6. Clique em **Create Credentials** > **API Key**
7. Copie a API Key gerada

## Passo 2: Configurar no Ambiente

### Local (.env.local)

Adicione no arquivo `.env.local`:

```env
GOOGLE_MAPS_API_KEY=sua-api-key-aqui
```

### Produção (Vercel)

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** Sua API key do Google Maps
   - **Environment:** Production, Preview, Development
5. Faça um novo deploy

## Passo 3: Restringir a API Key (Recomendado)

Para segurança, restrinja a API Key:

1. No Google Cloud Console, edite a API Key
2. Em **API restrictions**, selecione "Restrict key"
3. Selecione apenas **Geocoding API**
4. Em **Application restrictions**, você pode restringir por:
   - HTTP referrers (para uso no frontend, se necessário)
   - IP addresses (para uso no backend)

## Como Funciona

O sistema usa a Google Maps Geocoding API para:

1. **Na criação/edição de gigs:** Quando o usuário usa "Usar Minha Localização" ou fornece coordenadas, fazemos reverse geocoding para obter:
   - Cidade
   - Estado (UF)
   - Região aproximada (ex: "São Paulo — Zona Sul")

2. **Cálculo de distância:** O sistema calcula a distância real entre músico e gig usando as coordenadas (fórmula de Haversine)

3. **Filtros de distância:** Os filtros de distância agora funcionam com coordenadas reais, não apenas aproximações

## Fallback

Se a API Key não estiver configurada, o sistema usa a lógica de cálculo de região existente (baseada em bounding boxes e mapeamentos estáticos), mas não terá a precisão do reverse geocoding.

