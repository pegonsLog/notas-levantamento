# Sistema de Importação de Notas - Instruções

## 📋 Visão Geral

Este projeto Angular permite importar dados de arquivos Excel para o Firebase Firestore, com suporte completo para formatação brasileira (moeda Real, datas no formato dd/mm/yyyy e separador decimal com vírgula).

## 🚀 Configuração Inicial

### 1. Configurar Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **Configurações do Projeto** > **Geral**
4. Role até **Seus apps** e clique no ícone da web (`</>`)
5. Copie as credenciais do Firebase

### 2. Configurar Variáveis de Ambiente

1. Navegue até a pasta `src/environments/`
2. Você encontrará o arquivo `environment.example.ts` como referência
3. Os arquivos `environment.ts` e `environment.prod.ts` já foram criados (e estão no .gitignore)
4. Edite ambos os arquivos e substitua os valores das credenciais do Firebase:

```typescript
export const environment = {
  production: false, // true para environment.prod.ts
  firebase: {
    apiKey: "sua-api-key-aqui",
    authDomain: "seu-auth-domain.firebaseapp.com",
    projectId: "seu-project-id",
    storageBucket: "seu-storage-bucket.appspot.com",
    messagingSenderId: "seu-messaging-sender-id",
    appId: "seu-app-id"
  }
};
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar o Projeto

```bash
npm start
```

O aplicativo estará disponível em `http://localhost:4200`

## 📊 Como Usar

### Importar Dados do Excel

1. Acesse a aplicação no navegador
2. Clique em **"Escolher arquivo"**
3. Selecione um arquivo Excel (.xlsx, .xls ou .csv)
4. Visualize a prévia dos dados (primeiras 5 linhas)
5. Clique em **"Importar para Firestore"**
6. Aguarde a confirmação de sucesso

### Formato do Arquivo Excel

O arquivo Excel pode ter qualquer estrutura de colunas. Os dados serão importados exatamente como estão no arquivo, com os seguintes campos adicionais:

- `importadoEm`: Data e hora da importação
- `arquivoOrigem`: Nome do arquivo Excel original

### Personalizar Colunas

Para aplicar formatações específicas a determinadas colunas, edite o arquivo:
`src/app/components/excel-import/excel-import.component.ts`

```typescript
// Configuração das colunas (personalize conforme sua necessidade)
collectionName: string = 'notas-levantamento'; // Nome da coleção no Firestore
dateColumns: string[] = ['data', 'dataVencimento']; // Colunas de data
currencyColumns: string[] = ['valor', 'total']; // Colunas de moeda
numberColumns: string[] = ['quantidade', 'numero']; // Colunas numéricas
```

## 🎨 Formatações Brasileiras

### Serviço de Formatação

O projeto inclui um serviço completo de formatação (`FormatService`) com os seguintes métodos:

#### Formatação de Moeda
```typescript
formatCurrency(1234.56) // Retorna: "R$ 1.234,56"
```

#### Formatação de Data
```typescript
formatDate(new Date()) // Retorna: "18/11/2024"
```

#### Formatação de Número
```typescript
formatNumber(1234.56, 2) // Retorna: "1.234,56"
```

#### Conversão de Moeda
```typescript
parseCurrency("R$ 1.234,56") // Retorna: 1234.56
```

#### Conversão de Data
```typescript
parseDate("18/11/2024") // Retorna: Date object
```

#### Conversão de Número
```typescript
parseNumber("1.234,56") // Retorna: 1234.56
```

## 🔧 Serviços Disponíveis

### ExcelImportService

Responsável por ler e processar arquivos Excel:

- `readExcelFile(file)`: Lê arquivo Excel e retorna dados
- `isValidExcelFile(file)`: Valida se o arquivo é Excel
- `processExcelData(data, dateColumns, currencyColumns, numberColumns)`: Processa dados aplicando formatações
- `getColumnNames(data)`: Retorna nomes das colunas

### FirestoreService

Gerencia operações com o Firestore:

- `addDocument(collectionName, data)`: Adiciona um documento
- `addMultipleDocuments(collectionName, dataArray)`: Adiciona múltiplos documentos
- `addDocumentsInBatch(collectionName, dataArray, batchSize)`: Adiciona documentos em lotes

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   └── excel-import/          # Componente de importação
│   ├── services/
│   │   ├── excel-import.service.ts # Serviço de leitura Excel
│   │   ├── firestore.service.ts    # Serviço Firestore
│   │   └── format.service.ts       # Serviço de formatação
│   └── ...
├── environments/
│   ├── environment.ts              # Configurações dev (gitignored)
│   ├── environment.prod.ts         # Configurações prod (gitignored)
│   └── environment.example.ts      # Exemplo de configuração
└── ...
```

## 🔒 Segurança

- Os arquivos de ambiente (`environment.ts` e `environment.prod.ts`) estão no `.gitignore`
- **NUNCA** faça commit das suas credenciais do Firebase
- Use o arquivo `environment.example.ts` como referência
- Em produção, considere usar variáveis de ambiente do servidor

## 🎯 Próximos Passos

Após importar os dados, você pode criar componentes para:

- **Visualização de dados**: Tabelas com filtros e ordenação
- **Gráficos**: Visualizações usando bibliotecas como Chart.js ou ngx-charts
- **Análises**: Cálculos de médias, totais, etc.
- **Filtros avançados**: Por data, valor, categoria, etc.
- **Exportação**: Gerar relatórios em PDF ou Excel

## 📚 Tecnologias Utilizadas

- **Angular 18**: Framework principal
- **Firebase/Firestore**: Banco de dados
- **XLSX**: Biblioteca para leitura de Excel
- **Montserrat**: Fonte tipográfica
- **SCSS**: Estilização

## 🐛 Solução de Problemas

### Erro ao importar

1. Verifique se as credenciais do Firebase estão corretas
2. Certifique-se de que o Firestore está habilitado no Firebase Console
3. Verifique as regras de segurança do Firestore

### Arquivo não é reconhecido

1. Certifique-se de que o arquivo é .xlsx, .xls ou .csv
2. Verifique se o arquivo não está corrompido
3. Tente abrir o arquivo no Excel/LibreOffice primeiro

### Formatação incorreta

1. Verifique se as colunas estão configuradas corretamente no componente
2. Certifique-se de que os nomes das colunas correspondem aos do Excel
3. Verifique o formato dos dados no Excel

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do:
- [Angular](https://angular.dev)
- [Firebase](https://firebase.google.com/docs)
- [XLSX](https://www.npmjs.com/package/xlsx)
