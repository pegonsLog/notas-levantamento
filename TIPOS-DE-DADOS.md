# Configuração de Tipos de Dados - Importação Excel

## 📋 Visão Geral

Este documento explica como os dados do Excel são convertidos antes de serem salvos no Firestore, garantindo que cada campo tenha o tipo de dado correto.

## 🔧 Configuração Atual

### 🚫 Colunas Ignoradas (Não Importadas)

As seguintes colunas são **ignoradas** durante a importação:

- `__EMPTY` (colunas vazias)
- `DT.REF`
- `Hora`
- `Pergunta 01`
- `Pergunta 01 : Periodo`
- `Pergunta 02`
- `Pergunta 02 : Periodo Terceiros De`
- `Pergunta 03`
- `Pergunta 03 : Periodo Terceiros Até`

Essas colunas **não serão salvas** no Firestore.

---

### 📅 Colunas de Data (Date/Timestamp)

As seguintes colunas são convertidas para **Timestamp do Firestore**:

- `EMISSÃO`
- `EMISSAO`
- `DATA DIGITACAO`
- `DATA DIGITAÇÃO`

**Formatos aceitos:**
- String: `dd/mm/yyyy` (ex: `18/11/2025`)
- Número serial do Excel (ex: `45250`)
- Objeto Date JavaScript

**Resultado no Firestore:** `Timestamp`

---

### 💰 Colunas de Valores Monetários (Number)

As seguintes colunas são convertidas para **Number**:

- `VALOR UNIT.`
- `VALOR UNITARIO`
- `VALOR UNITÁRIO`
- `TOTAL BRUTO`
- `TOTAL`
- `CUSTO`
- `ICMS`
- `CST`
- `DESCONTO`
- `ALIQ. CSLL TERCEIRO`
- `VALOR CSLL TERCEIRO`
- `ALIQ. PIS TERCEIRO`
- `VALOR PIS TERCEIRO`
- `ALIQ. COFINS TERCEIRO`
- `VALOR COFINS TERCEIRO`
- `VALOR`
- `ALIQ. INSS`
- `VALOR INSS`
- `ALIQ. IRRF`
- `VALOR IRRF`

**Formatos aceitos:**
- String brasileira: `R$ 1.234,56` → `1234.56`
- String com ponto: `1234.56` → `1234.56`
- String com vírgula: `1234,56` → `1234.56`
- Número: `1234.56` → `1234.56`

**Resultado no Firestore:** `number`

---

### 🔢 Colunas Numéricas (Number)

As seguintes colunas são convertidas para **Number**:

- `QTD`
- `QUANTIDADE`
- `NF`
- `SERIE`
- `CLIFOR`
- `CNPJ`
- `NRCM`
- `TIPO PRODUTO`

**Formatos aceitos:**
- String: `"123"` → `123`
- Número: `123` → `123`
- String com separadores: `"1.234"` → `1234`

**Resultado no Firestore:** `number`

---

### 📝 Colunas de Texto (String)

Todas as outras colunas que **não** estão nas listas acima são mantidas como **String**.

Exemplos:
- `NOME CLIFOR` → `string`
- `DESCRICAO` → `string`
- `OBSERVACOES` → `string`

---

## 🎯 Como Funciona

### 1. Leitura do Excel
```typescript
// O arquivo Excel é lido e convertido para JSON
const data = await excelImportService.readExcelFile(file);
```

### 2. Processamento dos Dados
```typescript
// Cada registro é processado aplicando as conversões
const processedData = excelImportService.processExcelData(
  data,
  dateColumns,      // ['EMISSÃO', 'EMISSAO']
  currencyColumns,  // ['VALOR UNITARIO', 'TOTAL BRUTO', 'TOTAL']
  numberColumns     // ['QUANTIDADE', 'NUMERO', 'COD']
);
```

### 3. Salvamento no Firestore
```typescript
// Os dados processados são salvos com os tipos corretos
await firestoreService.addDocumentsInBatch(collectionName, processedData);
```

---

## ⚙️ Como Adicionar Novas Colunas

### Passo 1: Editar o Componente

Abra o arquivo: `/src/app/components/excel-import/excel-import.component.ts`

### Passo 2: Adicionar à Lista Apropriada

**Para colunas de data:**
```typescript
dateColumns: string[] = [
  'EMISSÃO',
  'EMISSAO',
  'DATA_VENCIMENTO',  // ← Adicione aqui
  'DATA_ENTREGA'      // ← Adicione aqui
];
```

**Para colunas de valores monetários:**
```typescript
currencyColumns: string[] = [
  'VALOR UNITARIO',
  'TOTAL BRUTO',
  'TOTAL',
  'DESCONTO',         // ← Adicione aqui
  'ACRESCIMO'         // ← Adicione aqui
];
```

**Para colunas numéricas:**
```typescript
numberColumns: string[] = [
  'QUANTIDADE',
  'QTD',
  'PESO',             // ← Adicione aqui
  'ALTURA'            // ← Adicione aqui
];
```

---

## 🔍 Verificação dos Tipos

### No Console do Firebase

1. Acesse o Firestore Console
2. Abra um documento da coleção `notas-levantamento`
3. Verifique os tipos:
   - **Timestamp**: Ícone de calendário 📅
   - **Number**: Sem aspas, cor azul
   - **String**: Com aspas, cor vermelha

### Exemplo de Documento Correto:

```javascript
{
  "EMISSÃO": Timestamp(2025, 10, 18),        // ✅ Timestamp
  "NOME CLIFOR": "Empresa ABC Ltda",         // ✅ String
  "VALOR UNITARIO": 1234.56,                 // ✅ Number
  "TOTAL BRUTO": 12345.67,                   // ✅ Number
  "TOTAL": 11111.11,                         // ✅ Number
  "QUANTIDADE": 10,                          // ✅ Number
  "DESCRICAO": "Produto XYZ",                // ✅ String
  "importadoEm": Timestamp(2025, 10, 18),    // ✅ Timestamp (automático)
  "arquivoOrigem": "planilha.xlsx"           // ✅ String (automático)
}
```

---

## 🚨 Problemas Comuns

### Problema 1: Data como String
**Sintoma:** Campo `EMISSÃO` aparece como `"18/11/2025"` (com aspas)

**Solução:** Adicione o nome exato da coluna no array `dateColumns`

### Problema 2: Valor como String
**Sintoma:** Campo `TOTAL` aparece como `"1234.56"` (com aspas)

**Solução:** Adicione o nome exato da coluna no array `currencyColumns`

### Problema 3: Conversão não funciona
**Causa:** Nome da coluna no Excel está diferente da configuração

**Solução:** 
1. Verifique o nome exato da coluna no Excel
2. A comparação é case-insensitive, mas o nome deve estar correto
3. Adicione variações do nome (com/sem acento, etc.)

---

## 📊 Benefícios da Conversão Correta

✅ **Filtros de data funcionam corretamente**
- Consultas por período
- Ordenação cronológica

✅ **Cálculos matemáticos funcionam**
- Soma de valores
- Médias e totais
- Comparações numéricas

✅ **Melhor performance**
- Índices do Firestore funcionam melhor
- Queries mais rápidas

✅ **Gráficos funcionam corretamente**
- Agrupamento por mês
- Cálculos de totais
- Visualizações precisas

---

## 🔄 Reimportação de Dados

Se você já importou dados com tipos incorretos:

### Opção 1: Deletar e Reimportar
1. Use a página "Lista de Dados"
2. Clique em "Deletar Todos"
3. Reimporte o arquivo Excel

### Opção 2: Script de Migração
(Criar script separado se necessário para converter dados existentes)

---

## 📝 Notas Importantes

- ⚠️ A conversão é feita **antes** de salvar no Firestore
- ⚠️ Dados já salvos **não** são convertidos automaticamente
- ⚠️ Nomes de colunas são **case-insensitive** (EMISSÃO = emissão = Emissão)
- ⚠️ Células vazias são mantidas como `null`
- ⚠️ Valores inválidos são convertidos para `0` (números) ou `null` (datas)

---

## 🎓 Exemplos de Uso

### Consulta por Período (funciona com Timestamp)
```typescript
const startDate = new Date('2025-01-01');
const endDate = new Date('2025-12-31');

const docs = await firestore
  .collection('notas-levantamento')
  .where('EMISSÃO', '>=', startDate)
  .where('EMISSÃO', '<=', endDate)
  .get();
```

### Soma de Valores (funciona com Number)
```typescript
const total = documents.reduce((sum, doc) => {
  return sum + (doc['TOTAL'] || 0);
}, 0);
```

### Agrupamento por Mês (funciona com Timestamp)
```typescript
const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
```

---

## 📞 Suporte

Para adicionar novos tipos de colunas ou modificar a conversão, edite:
- **Componente:** `/src/app/components/excel-import/excel-import.component.ts`
- **Serviço:** `/src/app/services/excel-import.service.ts`
