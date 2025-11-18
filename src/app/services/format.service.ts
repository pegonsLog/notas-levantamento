import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormatService {

  /**
   * Formata um número para moeda brasileira (R$)
   * @param value Valor numérico
   * @returns String formatada como R$ 1.234,56
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata uma data para o padrão brasileiro (dd/mm/yyyy)
   * @param date Data a ser formatada
   * @returns String formatada como dd/mm/yyyy
   */
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Formata manualmente para garantir dd/mm/yyyy
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Formata um número decimal com vírgula como separador
   * @param value Valor numérico
   * @param decimals Número de casas decimais (padrão: 2)
   * @returns String formatada como 1.234,56
   */
  formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Converte string de moeda brasileira para número
   * @param value String no formato "R$ 1.234,56" ou "1.234,56"
   * @returns Número decimal
   */
  parseCurrency(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Converte string de data brasileira para objeto Date
   * @param value String no formato "dd/mm/yyyy"
   * @returns Objeto Date
   */
  parseDate(value: string): Date | null {
    if (!value) return null;
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  /**
   * Converte string de número brasileiro para número
   * @param value String no formato "1.234,56"
   * @returns Número decimal
   */
  parseNumber(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
}
