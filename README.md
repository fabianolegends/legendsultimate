# Legends Ultimate Gravel Race

Site oficial da Legends Ultimate Gravel Race, desenvolvido em Next.js e preparado para publicação na Vercel.

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha as credenciais do Supabase e do Ride with GPS.

## Ride with GPS

Crie um cliente OAuth no Ride with GPS e cadastre o callback abaixo exatamente como está:

`https://www.legendsbikerace.com.br/api/ridewithgps/callback`

No ambiente de produção, configure `RIDE_WITH_GPS_CLIENT_ID` e
`RIDE_WITH_GPS_CLIENT_SECRET`, além das variáveis do Supabase. Antes de publicar a
troca, aplique `supabase/migrations/008_ride_with_gps.sql` no banco de produção.

## Publicação

Importe este repositório na Vercel e configure o domínio `www.legendsbikerace.com.br`.
