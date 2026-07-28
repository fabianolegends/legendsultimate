# Legends Ultimate Gravel Race

Site oficial da Legends Ultimate Gravel Race, desenvolvido em Next.js e preparado para publicação na Vercel.

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha as credenciais do Supabase e do Ride with GPS.

## Segurança operacional

Após executar `019_access_audit_backups.sql`, entre com a senha administrativa de contingência e abra **Segurança** para criar o primeiro proprietário individual. Papéis: proprietário, diretor, comissário e consulta. A mesma tela permite bloquear acessos, consultar a auditoria imutável e baixar um backup JSON com checksum SHA-256.

O backup baixado deve ser armazenado fora da Vercel e do Supabase. Ele complementa, mas não substitui, o backup nativo/PITR do banco contratado.

Simulação isolada, sem gravar no banco:

```bash
npm run test:load
npm run test:race-day
```

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

## Inscrições e pagamentos pelo Asaas

O Legends Engine cria a inscrição como pendente e redireciona o atleta para o
checkout hospedado pelo Asaas. Pix e cartão ficam fora do site; o Legends não recebe
nem armazena dados do cartão. A vaga só se torna confirmada quando o webhook do Asaas
informa o pagamento.

1. Execute `supabase/migrations/022_asaas_checkout.sql`.
2. Configure `ASAAS_ENVIRONMENT=sandbox`, `ASAAS_API_KEY` e
   `ASAAS_WEBHOOK_TOKEN` na Vercel.
3. No Asaas Sandbox, crie um webhook apontando para:
   `https://www.legendsbikerace.com.br/api/webhooks/asaas`
4. Use o mesmo valor de `ASAAS_WEBHOOK_TOKEN` no campo de token de autenticação do
   webhook e habilite, no mínimo, os eventos de checkout criado, pago, cancelado e
   expirado. Os eventos financeiros de confirmação, estorno, análise de risco e
   chargeback também são aceitos.
5. No painel da organização, abra **Eventos**, selecione **Asaas** como origem,
   defina os preços, o tempo de reserva e o número máximo de parcelas.
6. Rode `npm run test:payments` e faça uma inscrição completa no Sandbox antes de
   trocar `ASAAS_ENVIRONMENT` para `production` e usar a chave de produção.

As URLs de retorno servem apenas para orientar o atleta. A confirmação financeira é
sempre processada pelo webhook, de forma idempotente.

## Publicação

Importe este repositório na Vercel e configure o domínio `www.legendsbikerace.com.br`.
