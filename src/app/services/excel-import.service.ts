import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { FormatService } from './format.service';

export interface ExcelRow {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelImportService {

  constructor(private formatService: FormatService) { }

  /**
   * Lê um arquivo Excel e retorna os dados como array de objetos
   * @param file Arquivo Excel
   * @param sheetIndex Índice da planilha (padrão: 0)
   * @returns Promise com array de objetos representando as linhas
   */
  async readExcelFile(file: File, sheetIndex: number = 0): Promise<ExcelRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Pega a primeira planilha ou a planilha especificada
          const sheetName = workbook.SheetNames[sheetIndex];
          if (!sheetName) {
            reject(new Error('Planilha não encontrada'));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          
          // Converte para JSON
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
            raw: true, // Mantém valores brutos (números seriais para datas)
            defval: null // Valor padrão para células vazias
          });

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Valida se o arquivo é um Excel válido
   * @param file Arquivo a ser validado
   * @returns true se for um arquivo Excel válido
   */
  isValidExcelFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Processa os dados do Excel aplicando formatações brasileiras
   * @param data Array de dados do Excel
   * @param dateColumns Array com nomes das colunas que contêm datas
   * @param currencyColumns Array com nomes das colunas que contêm valores monetários
   * @param numberColumns Array com nomes das colunas que contêm números
   * @param ignoredColumns Array com nomes das colunas a serem ignoradas
   * @returns Array de dados processados
   */
  processExcelData(
    data: ExcelRow[],
    dateColumns: string[] = [],
    currencyColumns: string[] = [],
    numberColumns: string[] = [],
    ignoredColumns: string[] = []
  ): ExcelRow[] {
    return data.map(row => {
      const processedRow: ExcelRow = {};

      // Processa cada coluna do registro
      Object.keys(row).forEach(originalCol => {
        const colUpper = originalCol.toUpperCase();
        
        // Ignora colunas da lista de ignoradas (case-insensitive)
        const shouldIgnore = ignoredColumns.some(ic => ic.toUpperCase() === colUpper);
        if (shouldIgnore) {
          return; // Pula esta coluna
        }
        
        let value = row[originalCol];

        // Verifica se é coluna de data (case-insensitive)
        const isDateColumn = dateColumns.some(dc => dc.toUpperCase() === colUpper);
        if (isDateColumn && value) {
          value = this.parseExcelDate(value);
        }

        // Verifica se é coluna de moeda (case-insensitive)
        const isCurrencyColumn = currencyColumns.some(cc => cc.toUpperCase() === colUpper);
        if (isCurrencyColumn && value) {
          value = this.parseExcelNumber(value);
        }

        // Verifica se é coluna numérica (case-insensitive)
        const isNumberColumn = numberColumns.some(nc => nc.toUpperCase() === colUpper);
        if (isNumberColumn && value) {
          value = this.parseExcelNumber(value);
        }

        // Mantém o nome original da coluna
        processedRow[originalCol] = value;
      });

      return processedRow;
    });
  }

  /**
   * Converte valor de data do Excel para objeto Date
   * @param value Valor da célula
   * @returns Objeto Date ou null
   */
  private parseExcelDate(value: any): Date | null {
    if (!value) return null;

    // Se já for uma data
    if (value instanceof Date) {
      return value;
    }

    // Se for string no formato dd/mm/yyyy
    if (typeof value === 'string' && value.includes('/')) {
      return this.formatService.parseDate(value);
    }

    // Se for número serial do Excel
    if (typeof value === 'number') {
      return this.excelSerialToDate(value);
    }

    // Tenta converter string para data
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Converte número serial do Excel para Date
   * @param serial Número serial do Excel
   * @returns Objeto Date
   */
  private excelSerialToDate(serial: number): Date {
    // Excel usa 1/1/1900 como data base (serial 1)
    // Mas tem um bug: considera 1900 como ano bissexto (não é)
    // Por isso, para datas após 28/02/1900, subtraímos 1
    const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
    const days = serial >= 60 ? serial - 1 : serial; // Ajuste para o bug do Excel
    
    const milliseconds = days * 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + milliseconds);
    
    return date;
  }

  /**
   * Converte valor numérico do Excel
   * @param value Valor da célula
   * @returns Número ou 0
   */
  private parseExcelNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;

    // Se já for número
    if (typeof value === 'number') {
      return value;
    }

    // Se for string com formato brasileiro
    if (typeof value === 'string') {
      return this.formatService.parseNumber(value);
    }

    return 0;
  }

  /**
   * Obtém os nomes das colunas do arquivo Excel
   * @param data Array de dados do Excel
   * @returns Array com nomes das colunas
   */
  getColumnNames(data: ExcelRow[]): string[] {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }
}
