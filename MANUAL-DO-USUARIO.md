# Manual do Usuário — Controle de Pessoal

Sistema para importação e análise de notas fiscais e folha de pagamento.

---

## Como acessar

Abra o sistema no navegador. Você verá o cabeçalho com dois botões principais:

- **Notas Fiscais** — para trabalhar com notas fiscais e fornecedores
- **Folha de Pagamento** — para trabalhar com dados de folha dos funcionários

Clique em um dos botões para alternar entre os módulos. A barra de navegação abaixo mostra as páginas disponíveis no módulo selecionado.

---

## Módulo: Notas Fiscais

Ao clicar em "Notas Fiscais", você terá acesso a 5 páginas:

### Importar

Página para enviar planilhas Excel ou CSV com dados de notas fiscais.

**Passo a passo:**

1. Clique no botão "Escolher arquivo".
2. Selecione um arquivo `.xlsx`, `.xls` ou `.csv` do seu computador.
3. O sistema mostra uma prévia com as 5 primeiras linhas e o total de registros encontrados.
4. Confira se os dados estão corretos na prévia.
5. Clique em "Importar para Firestore".
6. Acompanhe a barra de progresso. Ao finalizar, uma mensagem de sucesso aparece em verde.

**Observações importantes:**
- Se o arquivo contiver registros que já existem no sistema (mesmo fornecedor, nota fiscal, data e valor), a importação será bloqueada e o sistema informará quais registros são duplicados.
- Para cancelar, clique em "Cancelar" a qualquer momento antes de importar.
- Formatos aceitos: valores em Real (R$ 1.234,56), datas no formato dd/mm/aaaa.

---

### Lista

Página que exibe todos os registros de notas fiscais importados.

**O que você pode fazer:**

- **Buscar:** Digite qualquer termo no campo "Buscar" para filtrar os registros. A busca acontece em tempo real.
- **Filtrar por coluna:** Use o seletor "Filtrar por coluna" para buscar apenas em uma coluna específica (ex: buscar só por NOME CLIFOR).
- **Ordenar:** Clique no nome de qualquer coluna no cabeçalho da tabela. Uma seta (↑ ou ↓) indica a direção da ordenação. Clique novamente para inverter.
- **Ver detalhes:** Clique no ícone de olho (👁) na linha do registro. Um painel abre mostrando todos os campos.
- **Excluir um registro:** Clique no ícone de lixeira (🗑) na linha do registro. Confirme no painel que aparece.
- **Excluir todos:** Clique no botão "Excluir Todos" no topo. Um aviso aparece pedindo confirmação. Essa ação é irreversível.
- **Atualizar:** Clique em "Atualizar" para recarregar os dados do banco.
- **Limpar filtros:** Clique em "Limpar Filtros" para remover busca e ordenação.

O contador no topo mostra quantos registros estão sendo exibidos do total (ex: "45 de 120 registro(s)").

---

### Análise

Página de análise de ganhos agrupados por empresa (fornecedor).

**Passo a passo:**

1. Selecione a data inicial e a data final do período que deseja analisar.
2. Clique em "Gerar Análise".
3. O sistema exibe:
   - **Cards de resumo** no topo com: Total (Valor Unitário), Total Bruto, Total Geral e quantidade de empresas.
   - **Filtro por empresa:** Use o seletor para ver os dados de uma empresa específica ou de todas.
   - **Lista de empresas:** Cada empresa aparece como um card com seus totais. Clique no card para expandir e ver os gráficos de barras mensais (Valor Unitário, Total Bruto e Total).

4. Para recomeçar, clique em "Limpar".

Se não houver dados no período selecionado, uma mensagem de aviso aparece.

---

### Tabela

Página que gera uma tabela cruzada mostrando o total bruto de cada empresa por ano.

**Passo a passo:**

1. No campo "Mês/Ano Inicial", digite o período no formato `mm/aaaa` (ex: `01/2023`).
2. No campo "Mês/Ano Final", digite o período final (ex: `12/2025`).
3. Na seção "Pessoa Física / Razão Social", você pode buscar por nome para consultar a razão social associada.
4. Na seção "Empresas", marque os checkboxes das empresas que deseja incluir na tabela. Use:
   - "Selecionar Todas" para marcar/desmarcar todas.
   - O campo de busca para filtrar empresas pelo nome.
   - "Mostrar Empresas Escolhidas" para conferir sua seleção antes de gerar.
5. Clique em "Gerar Tabela".
6. A tabela aparece com empresas nas linhas, anos nas colunas e totais em cada célula.
7. Clique em "Exportar Excel" para baixar a tabela como arquivo `.xlsx`.

---

### Nome/Razão

Página para cadastrar e gerenciar a relação entre nomes de pessoa física e razões sociais de empresas.

**O que você pode fazer:**

- **Novo registro:** Clique em "Novo Registro". Preencha o nome da pessoa física, o nome/razão social e o status (Ativo ou Inativo). Clique em "Salvar".
- **Editar:** Clique no ícone de lápis (✏) na linha do registro. Altere os campos e clique em "Salvar".
- **Excluir:** Clique no ícone de lixeira (🗑). Confirme a exclusão.
- **Buscar:** Digite no campo de busca para filtrar por nome, razão social ou status.

---

## Módulo: Folha de Pagamento

Ao clicar em "Folha de Pagamento", você terá acesso a 3 páginas:

### Importar

Página para enviar planilhas Excel ou CSV com dados de folha de pagamento.

**Passo a passo:**

1. Clique no botão "Escolher arquivo".
2. Selecione o arquivo com os dados da folha.
3. Confira a prévia dos dados (5 primeiras linhas).
4. Clique em "Importar para Firestore".
5. Acompanhe o progresso da importação.

**Observações:**
- O sistema detecta duplicados pela combinação de funcionário + mês + ano. Se já existir, a importação é bloqueada.
- A planilha deve conter colunas como: FUNCIONARIO, MES, ANO, SALARIO MES, SALARIO LIQUIDO, e os campos de descontos e adicionais (INSS, FGTS, IRRF, HORAS EXTRAS, FERIAS, etc.).

---

### Lista

Página que exibe todos os registros de folha de pagamento.

Funciona da mesma forma que a lista de notas fiscais:

- Busca em tempo real
- Filtro por coluna específica
- Ordenação clicando no cabeçalho
- Visualizar detalhes de um registro
- Excluir registro individual ou todos
- Valores monetários aparecem formatados (ex: R$ 2.500,00)

---

### Análise

Página de análise detalhada da folha de pagamento por funcionário.

**Passo a passo:**

1. Selecione o ano inicial e o ano final nos seletores. Os anos disponíveis são detectados automaticamente dos dados importados.
2. Clique em "Gerar Análise".
3. O sistema exibe:

   - **Cards de resumo:** Total Salários, Total Líquido, Total Descontos e quantidade de funcionários.
   
   - **Gráfico de custo mensal:** Mostra a soma dos salários de todos os funcionários mês a mês em barras verdes.
   
   - **Análise de gasto específico:** Use o seletor para escolher um tipo de gasto (ex: INSS, FGTS, Horas Extras, Férias, etc.). Um gráfico de barras roxo aparece mostrando aquele gasto mês a mês, com os valores exibidos acima de cada barra.
   
   - **Filtro por funcionário:** Use o seletor para ver os dados de um funcionário específico ou de todos.
   
   - **Lista de funcionários:** Cada funcionário aparece como um card com nome, quantidade de registros, total de salário e total líquido. Clique no card para expandir e ver uma tabela detalhada com todos os meses, incluindo: salário, adiantamento, líquido, comissão, horas extras, bônus, insalubridade, férias, odonto, vale cultura, farmácia, INSS, INSS 13º, INSS férias, Sistema S, RAT, FGTS, IRRF e IRRF férias.

4. Para recomeçar, clique em "Limpar".

---

## Dicas gerais

- **Formatos de arquivo aceitos:** `.xlsx`, `.xls` e `.csv`
- **Valores monetários:** Use o formato brasileiro (R$ 1.234,56 ou 1234,56). O sistema converte automaticamente.
- **Datas:** Use o formato dd/mm/aaaa (ex: 18/11/2024).
- **Duplicados:** O sistema impede a importação de dados que já existem. Se precisar reimportar, exclua os registros antigos primeiro pela página "Lista".
- **Exportar para Excel:** Disponível na página "Tabela" do módulo Notas Fiscais. Gere a tabela e clique em "Exportar Excel".
- **Gráficos interativos:** Passe o mouse sobre as barras dos gráficos para ver os valores detalhados.
