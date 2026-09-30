# Contexto compartilhado — Legends

Snapshot consultado em 30/09/2026, branch padrão `legendsbikerace`, commit `af038ea`. Revalidar antes de cada tarefa. Informações recentes de Fabiano prevalecem; conflitos entre código, regulamento e site publicado devem ser explicitados.

## Marca e produto

Legends Bike Race, da Threerace Sports: stage race de gravel na Serra Gaúcha. Comunicação humana, objetiva, premium, centrada em desafio, autonomia, destinos e estrutura. Identidade terracota/creme/preto; preservar os tokens, fontes e arquivos oficiais existentes.

Autonavegação com GPX, preparo para dias consecutivos e gestão individual de esforço/equipamento são parte do produto. Experience oferece participação sem classificação; não prometer condução permanente por guia nem resposta imediata a emergências. Confirmar estrutura e inclusões no regulamento e nas páginas atuais.

## Configuração encontrada no código

Fonte: `app/lib/launch.ts`. Os valores abaixo são referência datada, não catálogo permanente.

| Campo | Ultimate | Short |
|---|---|---|
| Datas | 29/04–02/05/2027 | 01–02/05/2027 |
| Etapas | 1, 2, 3, 4 | 3, 4 |
| Distância | 370,3 km | 169,3 km |
| Ascensão | 6.302 m+ | 3.098 m+ |
| Limite configurado | 100 vagas | 50 vagas |
| Lote 02 configurado | R$ 1.199 | R$ 799 |
| Período configurado do lote | 21/09–10/12/2026 | 21/09–10/12/2026 |

Há 150 vagas configuradas no conjunto dos formatos. Não confundir isso com vagas disponíveis nem dizer que toda a Legends se limita a 100 atletas.

Ultimate/Short são formatos; Gravel Race/Legends Experience são modos de participação em cada formato. `app/i18n/home.ts` descreve Experience para Gravel, MTB e E-bike sem ranking. Conferir categorias e bicicletas permitidas nas regras vigentes.

Inscrições configuradas como abertas. Link comercial em `app/lib/launch.ts`: `https://event.windfit.app/legends-ultimate-stage-race`. `README.md` define a Windfit como fonte exclusiva de inscrições comerciais e pagamentos. Não tratar clique externo como venda confirmada.

Kit premium opcional configurado em R$ 399 (camisa, colete, dois pares de meias); camisa avulsa R$ 189. Conferir inclusões antes de escrever campanha. Não recuperar preços antigos da memória.

## Idiomas e fontes

- Home: português, espanhol e inglês em `app/i18n/home.ts`; configuração em `app/i18n/config.ts`.
- `localizedPublicPath` mantém páginas internas em português até existir rota traduzida. Não assumir tradução integral do site.
- Layout e tokens: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`.
- Logo: `public/legends-logo-official.png`. Não recriar ou substituir por marca aproximada.
- Regras e conteúdo operacional: `app/regulamento/`, `app/manual-do-atleta/`, `app/inscricoes/`, páginas de percursos; dados administrativos vigentes quando o acesso for autorizado e necessário.

## O que não sabemos neste piloto

Não foram consultados analytics, inscrições vendidas, ocupação, taxa de conversão nem checkout ao vivo. Nenhum dado comercial deste documento comprova disponibilidade atual. O primeiro passo configura o time; não constitui auditoria visual, teste do site ou melhoria de conversão já demonstrada.
