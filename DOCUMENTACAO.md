# Documentação Completa — Controle de Pessoal

Sistema de importação, gerenciamento e análise de dados financeiros (notas fiscais e folha de pagamento) construído com Angular 18 e Firebase Firestore.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Configuração e Instalação](#configuração-e-instalação)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Navegação e Rotas](#navegação-e-rotas)
6. [Módulo: Notas Fiscais](#módulo-notas-fiscais)
7. [Módulo: Folha de Pagamento](#módulo-folha-de-pagamento)
8. [Serviços](#serviços)
9. [Modelos de Dados](#modelos-de-dados)
10. [Coleções no Firestore](#coleções-no-firestore)
11. [Conversão de Tipos de Dados](#conversão-de-tipos-de-dados)
12. [Gráficos (ECharts)](#gráficos-echarts)
13. [Deploy (Firebase Hosting)](#deploy-firebase-hosting)
14. [Segurança](#segurança)
15. [Solução de Problemas](#solução-de-problemas)

---

## Visão Geral

O app "Controle de Pessoal" é dividido em dois módulos principais:

- **Notas Fiscais** — Importação de planilhas Excel com dados de notas fiscais/levantamento, listagem com filtros, análise de ganhos por empresa com gráficos, tabela cruzada empresa × ano e cadastro de nomes/razões sociais.
- **Folha de Pagamento** — Importação de planilhas de folha de pagamento, listagem dos registros e análise detalhada por funcionário com gráficos de custo mensal e gastos específicos.

Ambos os módulos seguem o mesmo fluxo: **Importar → Listar → Analisar**.

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 18.2 | Framework frontend (standalone components) |
| Firebase / Firestore | 10.14 | Banco de dados NoSQL e hosting |
| @angular/fire | 18.0 | Integração Angular + Firebase |
| ECharts / ngx-echarts | 6.0 / 18.0 | Gráficos interativos |
| XLSX (SheetJS) | 0.18.5 | Leitura de arquivos Excel e CSV |
| Heroicons | 2.2 | Ícones SVG |
| SCSS | — | Estilização |
| Montserrat | — | Fonte tipográfica (Google Fonts) |

---

## Configuração e Instalação

### Pré-requisitos

- Node.js (v18+)
- npm
- Conta no Firebase com projeto criado

### Passo a passo

1. Instale as dependências:
```bash
npm install
```

2. Configure as credenciais do Firebase em `src/environments/environment.ts` e `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET.appspot.com",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
  }
};
```

> Use `environment.example.ts` como referência. Os arquivos de ambiente estão no `.gitignore`.

3. Inicie o servidor de desenvolvimento:
```bash
npm start
```

4. Acesse `http://localhost:4200`

---

## Estrutura do Projeto

```
src/app/
├── components/
│   ├── excel-import/           # Importação de notas fiscais
│   ├── data-list/              # Listagem de notas fiscais
│   ├── earnings-analysis/      # Análise de ganhos por empresa
│   ├── company-year-table/     # Tabela cruzada empresa × ano
│   ├── nome-razao-manager/     # CRUD de nomes/razões sociais
│   ├── folha-import/           # Importação de folha de pagamento
│   ├── folha-list/             # Listagem de folha de pagamento
│   └── folha-analysis/         # Análise de folha de pagamento
├── services/
│   ├── excel-import.service.ts # Leitura e processamento de Excel
│   ├── firestore.service.ts    # Operações CRUD no Firestore
│   └── format.service.ts       # Formatação brasileira (R$, datas)
├── models/
│   └── nome-razao.interface.ts # Interface NomeRazao
├── app.component.ts            # Componente raiz com navegação
├── app.routes.ts               # Definição de rotas
└── app.config.ts               # Providers (Firebase, ECharts, Router)
```

---

## Navegação e Rotas

O app possui um header fixo com dois botões de menu principal ("Notas Fiscais" e "Folha de Pagamento"). Ao clicar, a barra de navegação secundária muda para exibir as páginas do módulo selecionado.

| Rota | Componente | Módulo |
|---|---|---|
| `/` ou `/importar` | ExcelImportComponent | Notas Fiscais |
| `/lista` | DataListComponent | Notas Fiscais |
| `/ganhos` | EarningsAnalysisComponent | Notas Fiscais |
| `/tabela-empresa-ano` | CompanyYearTableComponent | Notas Fiscais |
| `/nome-razao` | NomeRazaoManagerComponent | Notas Fiscais |
| `/folha-importar` | FolhaImportComponent | Folha de Pagamento |
| `/folha-lista` | FolhaListComponent | Folha de Pagamento |
| `/folha-analise` | FolhaAnalysisComponent | Folha de Pagamento |

---

## Módulo: Notas Fiscais

### 1. Importar Notas (`/importar`)

**O que faz:** Importa dados de arquivos Excel (.xlsx, .xls) ou CSV para a coleção `notas-levantamento` no Firestore.

**Como usar:**
1. Clique em "Escolher arquivo" e selecione a planilha.
2. O sistema exibe uma prévia das 5 primeiras linhas e o total de registros.
3. Clique em "Importar para Firestore".
4. Acompanhe a barra de progresso (importação em lotes de até 500 registros).
5. Ao concluir, uma mensagem de sucesso aparece.

**Detalhes técnicos:**
- Verifica duplicados antes de importar (chave: `NOME CLIFOR + NF + EMISSÃO + VALOR`). Se encontrar duplicados, bloqueia a importação e lista quais registros já existem.
- Converte automaticamente colunas de data, moeda e números (veja [Conversão de Tipos](#conversão-de-tipos-de-dados)).
- Remove colunas configuradas como ignoradas (`__EMPTY`, `DT.REF`, `Hora`, etc.).
- Adiciona metadados: `importadoEm` (timestamp) e `arquivoOrigem` (nome do arquivo).

---

### 2. Lista de Notas (`/lista`)

**O que faz:** Exibe todos os registros da coleção `notas-levantamento` em uma tabela interativa.

**Funcionalidades:**
- Busca em tempo real (todas as colunas ou coluna específica).
- Ordenação clicando no cabeçalho da coluna (↑ crescente / ↓ decrescente).
- Visualizar detalhes de um registro em modal.
- Excluir registro individual (com confirmação).
- Excluir todos os registros (com confirmação — ação irreversível).
- Formatação automática: datas como `dd/mm/yyyy`, valores como `R$ 1.234,56`, IDs sem decimais.
- Contador de registros filtrados/total.

**Colunas exibidas (ordem fixa):**
CLIFOR, NOME CLIFOR, CNPJ, TIPO, NF, SERIE, VALOR UNIT., TOTAL BRUTO, TOTAL, DESCONTO, EMISSÃO, DATA DIGITACAO, NRCM, PRODUTO, TIPO PRODUTO, QTD, CUSTO, CFOP, CST, alíquotas e valores de impostos (CSLL, PIS, COFINS, ICMS, INSS, IRRF).

---

### 3. Análise de Ganhos (`/ganhos`)

**O que faz:** Analisa os dados de notas fiscais agrupados por empresa (NOME CLIFOR), com gráficos de barras mensais.

**Como usar:**
1. Selecione o período (data início e data fim).
2. Clique em "Gerar Análise".
3. O sistema exibe:
   - Cards com totais gerais (Valor Unitário, Total Bruto, Total, quantidade de empresas).
   - Filtro por empresa específica.
   - Para cada empresa: um card com totais e 3 gráficos de barras (Valor Unitário, Total Bruto e Total por mês).
   - Accordion expansível para ver os detalhes de cada empresa.

---

### 4. Tabela Empresa × Ano (`/tabela-empresa-ano`)

**O que faz:** Gera uma tabela cruzada mostrando o total bruto de cada empresa por ano, dentro de um período selecionado.

**Como usar:**
1. Defina o período no formato `mm/aaaa` (ex: `01/2023` a `12/2025`).
2. Selecione as empresas desejadas usando os checkboxes (busca disponível).
3. Clique em "Gerar Tabela".
4. A tabela mostra: empresa nas linhas, anos nas colunas, com totais por linha e por coluna.
5. Clique em "Exportar Excel" para baixar a tabela como arquivo `.xlsx`.

**Recursos adicionais:**
- Integração com a coleção `nome-razao` para referência de nomes/razões sociais.
- Modal para conferir empresas selecionadas antes de gerar.
- Total geral no rodapé.

---

### 5. Gerenciador de Nomes/Razões Sociais (`/nome-razao`)

**O que faz:** CRUD completo para cadastrar e gerenciar a relação entre nome de pessoa física e razão social de empresas.

**Como usar:**
- Clique em "Novo" para adicionar um registro.
- Preencha: Nome Pessoa Física, Nome/Razão Social e Status (Ativo/Inativo).
- Use a busca para filtrar registros.
- Edite ou exclua registros existentes.

**Dados armazenados na coleção `nome-razao`:**
```typescript
{
  nomePessoaFisica: string;
  nomeRazaoSocial: string;
  status: string; // "Ativo" ou "Inativo"
}
```

---

## Módulo: Folha de Pagamento

### 1. Importar Folha (`/folha-importar`)

**O que faz:** Importa dados de folha de pagamento de arquivos Excel/CSV para a coleção `folha-pagamento`.

**Funcionamento idêntico ao importador de notas, com diferenças:**
- Coleção destino: `folha-pagamento`
- Detecção de duplicados por: `FUNCIONARIO + MES + ANO`
- Colunas monetárias específicas: SALARIO, SALARIO MES, ADIANTAMENTO, SALARIO LIQUIDO, COMISSAO+DSR, HORAS EXTRAS, BONUS, INSALUBRIDADE, FERIAS, ODONTO, VALE CULTURA, FARMACIA, INSS, INSS13º, INSS FERIAS, SISTEMA S, RAT, FGTS, IRRF, IRRF FERIAS
- Colunas numéricas: MES, ANO
- Sem colunas de data ou ignoradas

---

### 2. Lista da Folha (`/folha-lista`)

**O que faz:** Exibe todos os registros de folha de pagamento em tabela interativa.

**Funcionalidades idênticas à lista de notas:**
- Busca, ordenação, visualização em modal, exclusão individual e em massa.
- Formatação automática de valores monetários.

**Colunas exibidas (ordem fixa):**
FUNCIONARIO, CENTRO CUSTO, DESCRICAO CC, MES, ANO, SALARIO, SALARIO MES, ADIANTAMENTO, SALARIO LIQUIDO, COMISSAO+DSR, HORAS EXTRAS, BONUS, INSALUBRIDADE, FERIAS, ODONTO, VALE CULTURA, FARMACIA, INSS, INSS13º, INSS FERIAS, SISTEMA S, RAT, FGTS, IRRF, IRRF FERIAS.

---

### 3. Análise da Folha (`/folha-analise`)

**O que faz:** Analisa os dados de folha de pagamento agrupados por funcionário, com gráficos de custo mensal.

**Como usar:**
1. Selecione o intervalo de anos (ex: 2023 a 2025). Os anos disponíveis são detectados automaticamente dos dados.
2. Clique em "Gerar Análise".
3. O sistema exibe:
   - Cards com totais gerais: Total Salário, Total Líquido, Total Descontos, Total Adicionais, quantidade de funcionários.
   - Gráfico de barras: Custo Mensal com Folha (soma de salários por mês).
   - Filtro por funcionário específico.
   - Seletor de tipo de gasto para gráfico detalhado (Salário, Líquido, Adiantamento, Comissão, Horas Extras, Insalubridade, Férias, INSS, FGTS, IRRF, Odonto, etc.).
   - Para cada funcionário: card com totais e accordion expansível com registros detalhados.

**Categorias de cálculo:**
- Descontos: INSS, INSS13º, INSS FERIAS, SISTEMA S, RAT, FGTS, IRRF, IRRF FERIAS, ODONTO, VALE CULTURA, FARMACIA
- Adicionais: COMISSAO+DSR, HORAS EXTRAS, INSALUBRIDADE, FERIAS, ADIANTAMENTO

---

## Serviços

### ExcelImportService (`excel-import.service.ts`)

Responsável por ler e processar arquivos Excel/CSV.

| Método | Descrição |
|---|---|
| `readExcelFile(file, sheetIndex?)` | Lê arquivo Excel e retorna array de objetos JSON |
| `isValidExcelFile(file)` | Valida extensão (.xlsx, .xls, .csv) |
| `processExcelData(data, dateColumns, currencyColumns, numberColumns, ignoredColumns)` | Aplica conversões de tipo e remove colunas ignoradas |
| `getColumnNames(data)` | Retorna nomes das colunas do arquivo |

---

### FirestoreService (`firestore.service.ts`)

Gerencia todas as operações CRUD com o Firestore.

| Método | Descrição |
|---|---|
| `addDocument(collection, data)` | Adiciona um documento |
| `addMultipleDocuments(collection, dataArray)` | Adiciona múltiplos documentos |
| `addDocumentsInBatch(collection, dataArray, batchSize, onProgress?)` | Importação em lotes com callback de progresso |
| `updateDocument(collection, docId, data)` | Atualiza um documento |
| `getCollection(collection)` | Retorna Observable da coleção |
| `getAllDocuments(collection)` | Retorna Promise com todos os documentos |
| `getDocumentsWithQuery(collection, orderByField?, direction?)` | Busca com ordenação |
| `deleteDocument(collection, docId)` | Exclui um documento |
| `deleteAllDocuments(collection)` | Exclui todos os documentos (em batch de 500) |

---

### FormatService (`format.service.ts`)

Utilitários de formatação no padrão brasileiro.

| Método | Entrada | Saída |
|---|---|---|
| `formatCurrency(1234.56)` | number | `"R$ 1.234,56"` |
| `formatDate(date)` | Date ou string | `"18/11/2024"` |
| `formatNumber(1234.56, 2)` | number, decimais | `"1.234,56"` |
| `parseCurrency("R$ 1.234,56")` | string | `1234.56` |
| `parseDate("18/11/2024")` | string | `Date` |
| `parseNumber("1.234,56")` | string | `1234.56` |

---

## Modelos de Dados

### NomeRazao (`nome-razao.interface.ts`)

```typescript
interface NomeRazao {
  nomePessoaFisica: string;
  nomeRazaoSocial: string;
  status: string; // "Ativo" | "Inativo"
}
```

---

## Coleções no Firestore

### `notas-levantamento`

Armazena dados de notas fiscais importados do Excel.

Campos típicos: CLIFOR, NOME CLIFOR, CNPJ, TIPO, NF, SERIE, VALOR UNIT., TOTAL BRUTO, TOTAL, DESCONTO, EMISSÃO (Timestamp), DATA DIGITACAO (Timestamp), NRCM, PRODUTO, TIPO PRODUTO, QTD, CUSTO, CFOP, CST, alíquotas e valores de impostos, `importadoEm` (Timestamp), `arquivoOrigem` (string).

### `folha-pagamento`

Armazena dados de folha de pagamento.

Campos típicos: FUNCIONARIO, CENTRO CUSTO, DESCRICAO CC, MES (number), ANO (number), SALARIO MES (number), SALARIO LIQUIDO (number), ADIANTAMENTO, COMISSAO+DSR, HORAS EXTRAS, BONUS, INSALUBRIDADE, FERIAS, ODONTO, VALE CULTURA, FARMACIA, INSS, INSS13º, INSS FERIAS, SISTEMA S, RAT, FGTS, IRRF, IRRF FERIAS, `importadoEm`, `arquivoOrigem`.

### `nome-razao`

Cadastro de nomes de pessoa física e razões sociais.

Campos: `nomePessoaFisica`, `nomeRazaoSocial`, `status`.

---

## Conversão de Tipos de Dados

Na importação, o sistema converte automaticamente os dados do Excel para os tipos corretos no Firestore:

### Notas Fiscais

| Tipo | Colunas |
|---|---|
| Ignoradas | `__EMPTY`, `DT.REF`, `Hora`, `Pergunta 01`, `Pergunta 01 : Periodo`, `Pergunta 02`, `Pergunta 02 : Periodo Terceiros De`, `Pergunta 03`, `Pergunta 03 : Periodo Terceiros Até` |
| Data → Timestamp | `EMISSÃO`, `EMISSAO`, `DATA DIGITACAO`, `DATA DIGITAÇÃO` |
| Moeda → number | `VALOR UNIT.`, `VALOR UNITARIO`, `TOTAL BRUTO`, `TOTAL`, `CUSTO`, `ICMS`, `CST`, `DESCONTO`, alíquotas e valores de CSLL, PIS, COFINS, INSS, IRRF |
| Numérica → number | `QTD`, `QUANTIDADE`, `NF`, `SERIE`, `CLIFOR`, `CNPJ`, `NRCM`, `TIPO PRODUTO` |
| Demais | Mantidas como string |

### Folha de Pagamento

| Tipo | Colunas |
|---|---|
| Moeda → number | `SALARIO`, `SALARIO MES`, `ADIANTAMENTO`, `SALARIO LIQUIDO`, `COMISSAO+DSR`, `HORAS EXTRAS`, `BONUS`, `INSALUBRIDADE`, `FERIAS`, `ODONTO`, `VALE CULTURA`, `FARMACIA`, `INSS`, `INSS13º`, `INSS FERIAS`, `SISTEMA S`, `RAT`, `FGTS`, `IRRF`, `IRRF FERIAS` |
| Numérica → number | `MES`, `ANO` |
| Demais | Mantidas como string |

**Formatos aceitos na conversão:**
- Moeda: `R$ 1.234,56` → `1234.56` / `1234,56` → `1234.56` / `1234.56` → `1234.56`
- Data: `dd/mm/yyyy` / número serial do Excel / objeto Date
- Número: `"123"` → `123` / `"1.234"` → `1234`

A comparação de nomes de colunas é case-insensitive. Variações com e sem acento são suportadas.

---

## Gráficos (ECharts)

O app usa ECharts (via ngx-echarts) para visualizações interativas:

- **Análise de Ganhos:** Gráficos de barras mensais por empresa para Valor Unitário, Total Bruto e Total. Gradiente roxo/azul.
- **Análise de Folha:** Gráfico de custo mensal com folha (gradiente verde). Gráfico de gasto específico selecionável (gradiente roxo).
- Todos os gráficos possuem tooltips com valores formatados em R$, labels com fonte Montserrat e barras com bordas arredondadas.

Para criar novos gráficos, importe `NgxEchartsDirective` no componente e use a diretiva `echarts` no template:

```html
<div echarts [options]="chartOption" style="height: 400px;"></div>
```

---

## Deploy (Firebase Hosting)

O projeto está configurado para deploy no Firebase Hosting.

```bash
# Build de produção
npm run build

# Deploy
firebase deploy
```

O `firebase.json` está configurado para servir de `dist/notas-levantamento/browser` com rewrite para SPA (todas as rotas redirecionam para `index.html`).

Projeto Firebase: `notas-levantamento-ino`

---

## Segurança

- Arquivos de ambiente (`environment.ts`, `environment.prod.ts`) estão no `.gitignore`. Nunca faça commit de credenciais.
- As regras do Firestore estão abertas para desenvolvimento (leitura/escrita permitida até 2055). Em produção, configure regras restritivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notas-levantamento/{doc} {
      allow read, write: if request.auth != null;
    }
    match /folha-pagamento/{doc} {
      allow read, write: if request.auth != null;
    }
    match /nome-razao/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Solução de Problemas

| Problema | Solução |
|---|---|
| Dados não aparecem na lista | Verifique se há dados na coleção do Firestore e se as credenciais estão corretas em `environment.ts` |
| Arquivo não é reconhecido | Certifique-se de que é `.xlsx`, `.xls` ou `.csv` e não está corrompido |
| Importação bloqueada por duplicados | Os registros já existem no banco. Delete-os primeiro pela lista ou use um arquivo diferente |
| Formatação incorreta de valores | Verifique se o nome da coluna no Excel corresponde exatamente às listas de `currencyColumns`/`dateColumns`/`numberColumns` no componente de importação |
| Gráficos não aparecem | Confirme que `provideEcharts()` está no `app.config.ts` e que `NgxEchartsDirective` está importado no componente |
| Erro ao excluir todos | Verifique as permissões do Firestore (regras de segurança) |
| Datas aparecem como string | Adicione o nome exato da coluna no array `dateColumns` do componente de importação |

---

## Comandos Úteis

```bash
npm start              # Servidor de desenvolvimento (localhost:4200)
npm run build          # Build de produção
firebase deploy        # Deploy no Firebase Hosting
ng generate component components/nome  # Gerar novo componente
```
