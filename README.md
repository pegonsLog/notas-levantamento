# 📊 Notas Levantamento

Sistema de importação e análise de dados Excel para Firebase Firestore com formatação brasileira completa.

## ✨ Características

- ✅ Importação de arquivos Excel (.xlsx, .xls, .csv)
- ✅ Formatação brasileira (R$, dd/mm/yyyy, vírgula decimal)
- ✅ Prévia de dados antes da importação
- ✅ Upload em lote para Firestore
- ✅ Interface moderna e responsiva
- ✅ Fonte Montserrat
- ✅ Proteção de credenciais (gitignored)

## 🚀 Início Rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Firebase
Edite os arquivos em `src/environments/`:
- `environment.ts` (desenvolvimento)
- `environment.prod.ts` (produção)

Use `environment.example.ts` como referência.

### 3. Executar
```bash
npm start
```

Acesse: `http://localhost:4200`

## 📖 Documentação Completa

Consulte o arquivo **[INSTRUCOES.md](./INSTRUCOES.md)** para documentação detalhada incluindo:
- Configuração do Firebase
- Como usar o sistema
- Personalização de colunas
- Serviços disponíveis
- Formatações brasileiras
- Solução de problemas

## 📁 Estrutura Principal

```
src/
├── app/
│   ├── components/excel-import/    # Componente de importação
│   └── services/                   # Serviços (Excel, Firestore, Format)
├── environments/                   # Configurações Firebase
└── styles.scss                     # Estilos globais
```

## 🎯 Exemplo de Uso

1. Selecione um arquivo Excel
2. Visualize a prévia dos dados
3. Clique em "Importar para Firestore"
4. Dados são salvos na coleção `notas-levantamento`

Arquivo de exemplo: `exemplo-dados.csv`

## 🔒 Segurança

- Arquivos de ambiente estão no `.gitignore`
- **NUNCA** faça commit de credenciais
- Use variáveis de ambiente em produção

## 🛠️ Tecnologias

- Angular 18
- Firebase/Firestore
- XLSX (importação de Excel)
- ECharts / ngx-echarts (gráficos)
- Heroicons (ícones SVG)
- TypeScript
- SCSS

## 📝 Comandos Úteis

```bash
npm start          # Servidor de desenvolvimento
npm run build      # Build de produção
npm test           # Testes unitários
```

---

Desenvolvido com Angular CLI 18.2.19
