# Time de IA da Legends — piloto

Cinco agentes personalizados, no formato de projeto do Codex em `.codex/agents/`. Contexto comum em `CONTEXT.md`, entrada automática de orientação em `AGENTS.md` e primeira tarefa em `FIRST-TASK.md`.

| Agente | Responsabilidade | Entrega |
|---|---|---|
| `legends_brand_director` | Marca, fatos e linguagem internacional | Revisão de coerência e divergências |
| `legends_ux_ui_designer` | Jornada, mobile e interface | Problemas e especificações |
| `legends_growth_conversion` | Oferta, objeções e funil | Hipóteses e plano de medição |
| `legends_frontend_developer` | Viabilidade e implementação solicitada | Mapa de mudanças e validação |
| `legends_qa_reality_checker` | Revisão baseada em evidência | Erros, cobertura e limites |

## Como usar

Abrir este repositório e a branch que contém os arquivos em um Codex com suporte a agentes personalizados. Pedir:

> Execute a auditoria de docs/ai-team/FIRST-TASK.md usando os agentes da Legends. Entregue as propostas para minha avaliação, sem alterar a aplicação.

O coordenador fornece a cada especialista tarefa e evidências disponíveis, consolida resultados e elimina repetições. Brand/UX/Growth podem analisar independentemente; Frontend examina viabilidade depois da consolidação e QA confere as evidências finais. Não acionar todos para ajustes simples. O perfil não garante acesso a navegador, analytics, GitHub, Vercel ou Windfit: usar apenas capacidades disponíveis e autorizadas.

Se o ambiente não carregar os TOMLs, ler os perfis e aplicar o fluxo sequencialmente. Isso permite usar as instruções, mas não equivale a executar cinco agentes independentes. Os arquivos não instalam aplicativo desktop, não contratam serviço e não disparam automações.

## Fluxo após o diagnóstico

Apresentar uma lista curta de melhorias com evidência, prioridade e critério de aceite. Fabiano seleciona o escopo; implementar em branch separada; revisar o diff e validar; apresentar o resultado antes de publicação quando ela não estiver autorizada. A seleção não é uma confirmação extra se o pedido já especificou implementação.

Para comparar com o fluxo anterior, registrar tempo de trabalho, recomendações úteis, contradições descobertas e retrabalho. Medir conversão somente quando existir fonte de dados real; melhoria de texto não comprova aumento de vendas.

## Origem

Perfis adaptados ao projeto a partir do método e especialistas do Agency Agents. Referências, commit de origem e licença em `PROVENANCE.md` e `AGENCY-AGENTS-LICENSE.txt`. Configuração alinhada à documentação oficial de agentes personalizados do Codex; sem fixar modelo ou alterar configurações pessoais.
