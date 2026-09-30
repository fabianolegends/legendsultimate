# Origem dos perfis

Projeto de referência: https://github.com/msitarzewski/agency-agents

Commit consultado: `765be42358100bf89d2faa567668a94c602f9a26`, em 30/09/2026.

Fontes lidas e adaptadas:

- `design/design-ui-designer.md`
- `design/design-ux-architect.md`
- `marketing/marketing-growth-hacker.md`
- `engineering/engineering-frontend-developer.md`
- `testing/testing-reality-checker.md`
- `integrations/codex/README.md` e conversão Codex em `scripts/convert.sh`

Brand Director é personalizado para a Legends. Os outros quatro perfis usam os conceitos das fontes, com instruções reescritas para este projeto. Foram retiradas metas genéricas de crescimento, comandos de stacks diferentes, mudanças de tema não solicitadas e reprovação automática de primeira versão. O QA conclui segundo a evidência.

Licença MIT original preservada em `AGENCY-AGENTS-LICENSE.txt`. Não executar os instaladores upstream nem atualizar os perfis automaticamente: revisar qualquer nova versão antes de incorporar mudanças.

Formato de projeto conferido em https://developers.openai.com/codex/subagents (redireciona para https://learn.chatgpt.com/docs/agent-configuration/subagents): um arquivo TOML por agente em `.codex/agents/`, com `name`, `description` e `developer_instructions`. Configuração não testada como sessão independente nesta etapa; estrutura e sintaxe devem ser validadas antes do commit.
