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

### Entrada automática de atividades

Execute também `supabase/migrations/018_automatic_activity_ingestion.sql`. A partir
da próxima autorização OAuth, o token do atleta será armazenado criptografado no
servidor e poderá ser usado pela Central de Apuração mesmo sem o navegador do atleta
aberto.

Configure `ACTIVITY_TOKEN_ENCRYPTION_KEY` com 32 bytes aleatórios em base64 e
`CRON_SECRET` com um segredo longo. O botão **Sincronizar Ride with GPS**, na Central
de Apuração, executa a busca imediatamente. Para automatizar, configure um agendador
HTTPS para chamar periodicamente:

```text
POST https://www.legendsbikerace.com.br/api/admin/activity-sync
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json

{"maxConnections":20}
```

O processo é idempotente: atividades já importadas são ignoradas. Apenas inscrições
confirmadas e pagas ou cortesias são consideradas. A atividade entra automaticamente
quando existe exatamente uma etapa elegível, com rota ativa, na mesma data local. Uma
coincidência ambígua é registrada para tratamento manual e nunca associada por palpite.

## Publicação

Importe este repositório na Vercel e configure o domínio `www.legendsbikerace.com.br`.
