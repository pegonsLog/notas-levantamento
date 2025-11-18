# 📊 Guia de Gráficos e Ícones

## 🎨 Heroicons - Ícones SVG

### Instalação
```bash
npm install heroicons
```

### Como Usar

#### 1. Ícones Inline (Recomendado)

Copie o SVG diretamente do site [heroicons.com](https://heroicons.com) e cole no seu template HTML:

**Exemplo - Ícone de Gráfico de Barras:**
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
</svg>
```

**Exemplo - Ícone de Upload:**
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
</svg>
```

#### 2. Classes CSS para Tamanho

```scss
.w-4 { width: 1rem; height: 1rem; }    // 16px
.w-5 { width: 1.25rem; height: 1.25rem; } // 20px
.w-6 { width: 1.5rem; height: 1.5rem; }  // 24px
.w-8 { width: 2rem; height: 2rem; }    // 32px
```

#### 3. Ícones Úteis para o Projeto

**Análise de Dados:**
- `ChartBarIcon` - Gráfico de barras
- `ChartPieIcon` - Gráfico de pizza
- `PresentationChartLineIcon` - Gráfico de linhas

**Ações:**
- `ArrowUpTrayIcon` - Upload
- `ArrowDownTrayIcon` - Download
- `DocumentArrowUpIcon` - Importar documento
- `DocumentArrowDownIcon` - Exportar documento

**Interface:**
- `FunnelIcon` - Filtro
- `MagnifyingGlassIcon` - Busca
- `AdjustmentsHorizontalIcon` - Configurações
- `CalendarIcon` - Data
- `CurrencyDollarIcon` - Moeda

**Status:**
- `CheckCircleIcon` - Sucesso
- `XCircleIcon` - Erro
- `ExclamationTriangleIcon` - Aviso
- `InformationCircleIcon` - Informação

---

## 📈 ECharts - Biblioteca de Gráficos

### Configuração Básica

O ECharts já está configurado no `app.config.ts`. Para usar:

#### 1. Importar no Componente

```typescript
import { Component } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-meu-grafico',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './meu-grafico.component.html'
})
export class MeuGraficoComponent {
  chartOption: EChartsOption = {
    // Configuração do gráfico
  };
}
```

#### 2. Template HTML

```html
<div echarts [options]="chartOption" class="chart-container"></div>
```

#### 3. CSS

```scss
.chart-container {
  width: 100%;
  height: 400px;
}
```

---

## 📊 Exemplos de Gráficos

### 1. Gráfico de Barras

```typescript
chartOption: EChartsOption = {
  title: {
    text: 'Vendas por Mês',
    left: 'center',
    textStyle: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 600
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      }
    }
  },
  series: [{
    name: 'Vendas',
    type: 'bar',
    data: [12000, 15000, 18000, 14000, 20000, 22000],
    itemStyle: {
      color: '#667eea'
    }
  }]
};
```

### 2. Gráfico de Pizza

```typescript
chartOption: EChartsOption = {
  title: {
    text: 'Distribuição por Categoria',
    left: 'center',
    textStyle: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 600
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: R$ {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [{
    name: 'Categoria',
    type: 'pie',
    radius: '50%',
    data: [
      { value: 12000, name: 'Categoria A' },
      { value: 8000, name: 'Categoria B' },
      { value: 15000, name: 'Categoria C' },
      { value: 10000, name: 'Categoria D' }
    ],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }]
};
```

### 3. Gráfico de Linhas

```typescript
chartOption: EChartsOption = {
  title: {
    text: 'Evolução Mensal',
    left: 'center',
    textStyle: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 600
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    boundaryGap: false
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(value);
      }
    }
  },
  series: [{
    name: 'Valor',
    type: 'line',
    data: [12000, 15000, 18000, 14000, 20000, 22000],
    smooth: true,
    itemStyle: {
      color: '#48bb78'
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [{
          offset: 0,
          color: 'rgba(72, 187, 120, 0.3)'
        }, {
          offset: 1,
          color: 'rgba(72, 187, 120, 0.05)'
        }]
      }
    }
  }]
};
```

### 4. Gráfico de Barras Horizontais

```typescript
chartOption: EChartsOption = {
  title: {
    text: 'Top 5 Produtos',
    left: 'center',
    textStyle: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 600
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(value);
      }
    }
  },
  yAxis: {
    type: 'category',
    data: ['Produto E', 'Produto D', 'Produto C', 'Produto B', 'Produto A']
  },
  series: [{
    name: 'Vendas',
    type: 'bar',
    data: [15000, 18000, 22000, 25000, 30000],
    itemStyle: {
      color: '#764ba2'
    }
  }]
};
```

### 5. Gráfico de Múltiplas Séries

```typescript
chartOption: EChartsOption = {
  title: {
    text: 'Comparativo Anual',
    left: 'center',
    textStyle: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 600
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['2023', '2024'],
    top: 30
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(value);
      }
    }
  },
  series: [
    {
      name: '2023',
      type: 'line',
      data: [10000, 12000, 15000, 13000, 16000, 18000],
      itemStyle: { color: '#667eea' }
    },
    {
      name: '2024',
      type: 'line',
      data: [12000, 15000, 18000, 14000, 20000, 22000],
      itemStyle: { color: '#48bb78' }
    }
  ]
};
```

---

## 🎨 Cores do Projeto

Use essas cores para manter consistência visual:

```typescript
const cores = {
  primaria: '#667eea',
  secundaria: '#764ba2',
  sucesso: '#48bb78',
  aviso: '#f6ad55',
  erro: '#f56565',
  info: '#4299e1'
};
```

---

## 📱 Responsividade

Para gráficos responsivos:

```typescript
chartOption: EChartsOption = {
  // ... outras configurações
  grid: {
    left: '10%',
    right: '10%',
    bottom: '10%',
    containLabel: true
  },
  // Adaptar ao redimensionamento
  responsive: true
};
```

No CSS:
```scss
.chart-container {
  width: 100%;
  height: 400px;
  
  @media (max-width: 768px) {
    height: 300px;
  }
}
```

---

## 🔗 Recursos

- **Heroicons**: https://heroicons.com
- **ECharts Exemplos**: https://echarts.apache.org/examples/
- **ngx-echarts**: https://github.com/xieziyu/ngx-echarts
- **ECharts Documentação**: https://echarts.apache.org/handbook/

---

## 💡 Dicas

1. **Performance**: Use `lazyUpdate: true` para grandes volumes de dados
2. **Temas**: ECharts suporta temas customizados
3. **Exportação**: ECharts permite exportar gráficos como imagem
4. **Interatividade**: Adicione eventos de clique nos gráficos
5. **Animações**: Configure `animation: true` para transições suaves
