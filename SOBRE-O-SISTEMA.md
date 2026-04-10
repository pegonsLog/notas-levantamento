# Controle de Pessoal

Sistema de gestão financeira para importação e análise de notas fiscais e folha de pagamento.

---

## O que é o sistema?

O Controle de Pessoal é uma ferramenta que permite organizar, consultar e analisar dois tipos de informações financeiras:

- **Notas Fiscais** — dados de fornecedores, valores, impostos e produtos
- **Folha de Pagamento** — dados de funcionários, salários, descontos e benefícios

O sistema recebe planilhas do Excel ou CSV, armazena os dados na nuvem e oferece telas de consulta, filtros e gráficos para facilitar a tomada de decisão.

---

## Módulo: Notas Fiscais

Este módulo possui cinco telas:

### Importar

Permite enviar uma planilha com dados de notas fiscais para o sistema. Após selecionar o arquivo, uma prévia dos dados é exibida para conferência. O sistema verifica automaticamente se já existem registros iguais, evitando duplicidade. Uma barra de progresso acompanha o envio dos dados.

### Lista

Exibe todos os registros de notas fiscais em uma tabela. É possível:

- Buscar por qualquer informação (nome do fornecedor, número da nota, valor, etc.)
- Filtrar a busca por uma coluna específica
- Ordenar os dados clicando no nome da coluna
- Visualizar os detalhes completos de um registro
- Excluir registros individualmente ou todos de uma vez

Os valores aparecem formatados em reais (R$) e as datas no formato brasileiro (dd/mm/aaaa).

### Análise

Gera uma visão dos ganhos agrupados por empresa dentro de um período escolhido. Apresenta:

- Resumo com totais gerais (valor unitário, total bruto, total geral e quantidade de empresas)
- Filtro para visualizar uma empresa específica
- Gráficos de barras mensais para cada empresa, mostrando a evolução dos valores ao longo do tempo

### Tabela

Cria uma tabela cruzada que mostra o total bruto de cada empresa por ano. É possível:

- Definir o período desejado (mês/ano inicial e final)
- Selecionar quais empresas incluir na tabela
- Consultar a razão social associada a uma pessoa física
- Exportar o resultado para um arquivo Excel

### Nome/Razão

Cadastro para associar nomes de pessoas físicas às suas respectivas razões sociais. Permite criar, editar, buscar e excluir registros, além de definir o status como Ativo ou Inativo.

---

## Módulo: Folha de Pagamento

Este módulo possui três telas:

### Importar

Permite enviar uma planilha com dados de folha de pagamento. O funcionamento é o mesmo da importação de notas fiscais: seleção do arquivo, prévia dos dados, verificação de duplicidade e acompanhamento do progresso.

### Lista

Exibe todos os registros de folha de pagamento em uma tabela com as mesmas funcionalidades da lista de notas fiscais: busca, filtro por coluna, ordenação, visualização de detalhes e exclusão.

As informações incluem funcionário, centro de custo, mês, ano, salário, salário líquido, descontos (INSS, FGTS, IRRF) e adicionais (horas extras, comissões, férias, entre outros).

### Análise

Gera uma visão detalhada dos custos com folha de pagamento por funcionário. Apresenta:

- Resumo com totais gerais (salários, líquido, descontos, adicionais e quantidade de funcionários)
- Gráfico de custo mensal total com a folha de pagamento
- Seletor de tipo de gasto para visualizar um item específico mês a mês (por exemplo: INSS, FGTS, horas extras, férias, entre outros)
- Filtro para visualizar um funcionário específico
- Detalhamento por funcionário com todos os valores mensais

---

## Formatos aceitos

- Arquivos: Excel (.xlsx, .xls) e CSV (.csv)
- Valores monetários: formato brasileiro (R$ 1.234,56)
- Datas: formato dd/mm/aaaa

---

## Gráficos

Todos os gráficos são interativos. Ao passar o mouse sobre as barras, os valores detalhados são exibidos. Os gráficos mostram a evolução mensal dos valores, facilitando a identificação de tendências e variações ao longo do tempo.

---

## Exportação

A tela "Tabela" do módulo de Notas Fiscais permite exportar os dados gerados para um arquivo Excel, possibilitando o uso das informações em outras ferramentas ou relatórios.
