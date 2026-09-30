# Legends — instruções do projeto

Leia `docs/ai-team/CONTEXT.md` antes de criar conteúdo, auditar conversão ou alterar a interface. Confirme os dados comerciais no código atual; instruções recentes de Fabiano prevalecem sobre snapshots e memórias.

## Time especializado

Os cinco perfis de projeto estão em `.codex/agents/*.toml`. Consulte `docs/ai-team/README.md` para responsabilidades e uso. São configurações de especialistas; não executam tarefas ou campanhas sozinhos.

Use apenas os especialistas necessários à tarefa. Delegue quando o pedido ou as instruções aplicáveis autorizarem. Em ambientes sem agentes personalizados, leia o perfil e aplique suas instruções sequencialmente, deixando claro que não houve execução independente.

## Escopo do piloto

A primeira tarefa está em `docs/ai-team/FIRST-TASK.md`: análise e propostas, sem editar a aplicação. Implementação de propostas de auditoria depende da seleção de Fabiano; um pedido explícito para implementar já autoriza o trabalho selecionado. Não mescle nem publique produção apenas por concluir uma revisão. Use branch separada e apresente mudanças e evidências.

## Regras comuns

- Preserve Ultimate/Short como formatos e Gravel Race/Experience como modalidades distintas.
- Confira `app/lib/launch.ts`, `app/i18n/home.ts`, regulamento e manual. Registre divergências em vez de escolher dados por palpite.
- Preserve a identidade visual existente e as versões PT/ES/EN onde disponíveis. Não prometa páginas traduzidas que ainda não existem.
- Nunca invente inscrições vendidas, escassez, depoimentos, descontos, parceiros, estrutura de segurança ou métricas.
- Diferencie evidência do código, observação do site publicado e hipótese. Não atribua ao site público o comportamento de uma branch não publicada.
- Não exponha segredos, dados de atletas ou informações de saúde em relatórios ou commits. Não envie mensagens nem execute inscrições reais durante testes sem autorização específica.
- Execute verificações proporcionais à alteração usando os scripts existentes. Registre comandos, resultado e limitações; nunca declare teste executado sem evidência.
