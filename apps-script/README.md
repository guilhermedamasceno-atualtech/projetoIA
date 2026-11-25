# Apps Script do projeto

Dois projetos de Apps Script dão suporte ao trabalho em equipe:

| projeto | onde fica | o que faz |
|---|---|---|
| [`controle/`](controle/) | dentro da planilha **Controle - Triagem de e-mails** | Registra toda edição na aba `Log` e preenche `*_por` / `*_em` com o e-mail de quem aprovou. Bloqueia a aprovação de um lote por quem o executou e a aprovação de lote com revisões pendentes. |
| [`extrator/`](extrator/) | projeto avulso na pasta **IA Interna - Restrito** | Lê a caixa do setor e grava cada conversa em `01-entrada/<setor>/<lote>/<id>.json`, já limpa, com pseudônimos e com dados sensíveis mascarados. O segredo dos pseudônimos fica só aqui. |

## Por que assim

- **Mesmos IDs para todos:** o ID da conversa vem do cabeçalho `Message-ID`, que é igual em todas as caixas. Os pseudônimos vêm de um único segredo, guardado nas propriedades do extrator.
- **Ninguém precisa do segredo:** a skill do Claude e a equipe só veem os JSON já pseudonimizados. O mapa de quem é quem fica na planilha restrita.
- **Histórico:** quem aprova o quê fica no `Log` e nas colunas de auditoria. As mudanças de regra entram por PR neste repositório.

## Instalação

### 1. Auditoria da planilha de controle (qualquer editor da planilha)
1. Abra a planilha **Controle - Triagem de e-mails** e vá em **Extensões > Apps Script**.
2. Apague o conteúdo de `Code.gs` e cole [`controle/auditoria.gs`](controle/auditoria.gs). Salve.
3. Selecione `instalarGatilhos` e clique em **Executar**. Autorize com a sua conta.
4. Recarregue a planilha: o menu **IA Interna** vai aparecer.

> O gatilho roda com a conta de quem o instalou. Instale com a conta do responsável pelo projeto, não com uma conta pessoal temporária.

### 2. Extrator (só o responsável pelo projeto)
1. Na pasta **IA Interna - Restrito**, crie **Novo > Mais > Google Apps Script** com o nome `IA Interna - Extrator`.
2. Crie quatro arquivos e cole o conteúdo: `config.gs`, `pseudonimos.gs`, `limpeza.gs` e `extrator.gs`.
3. Em `config.gs`, troque `COLE_AQUI_UM_SEGREDO_LONGO_E_ALEATORIO` por um segredo longo (40 ou mais caracteres aleatórios). Execute `configurarUmaVez` e **apague o segredo do arquivo** em seguida. Ele fica só em **Configurações do projeto > Propriedades do script**.
4. Guarde uma cópia do segredo num cofre de senhas da empresa. Se ele se perder, os novos pseudônimos deixam de bater com os antigos.

> **Nunca altere o SAL depois do primeiro uso.** A função `configurarUmaVez` se recusa a sobrescrever.

### 3. Rodar um lote
1. Na aba **Lotes**, crie a linha do lote: `lote_id`, `codigo_setor`, período (`AAAA-MM-DD`), `modo` e status `planejado`.
2. Na conta que tem acesso à caixa do setor, abra o extrator e execute `extrairLote('LOTE-ID')`. Lotes grandes continuam sozinhos, de minuto em minuto.
3. Ao terminar, o lote fica com status `extraido` e os JSON ficam em `01-entrada/<setor>/<lote>/`.
4. A skill do Claude lê esses JSON, classifica e grava os Markdowns em `02-saida/<setor>/<lote>/`.

## Fluxo de status de um lote

```
planejado -> extraido -> em_execucao -> simulado -> em_revisao -> aprovado_aplicar -> aplicado -> entregue
                                                         |                 |
                                    revisor (preenchido pelo script)    aprovador (outra pessoa, não quem executou)
```

## Limitações conhecidas
- O `GmailApp` lê a caixa de quem executa o script. Para a caixa unificada, rode o extrator com a conta dona dessa caixa ou peça à TI uma conta de serviço com delegação.
- O mascaramento por regex cobre CPF, CNPJ, telefone, e-mail, `Senha:`, `Usuario:` e `Nome:`. Nomes soltos no texto que não são de participantes ficam para a skill trocar por `[pessoa]`.
- A proteção das colunas de auditoria é só um aviso: quem forçar a edição fica registrado no `Log`.
