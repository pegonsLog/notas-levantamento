import { Routes } from '@angular/router';
import { ExcelImportComponent } from './components/excel-import/excel-import.component';
import { DataListComponent } from './components/data-list/data-list.component';
import { EarningsAnalysisComponent } from './components/earnings-analysis/earnings-analysis.component';
import { CompanyYearTableComponent } from './components/company-year-table/company-year-table.component';
import { NomeRazaoManagerComponent } from './components/nome-razao-manager/nome-razao-manager.component';
import { FolhaImportComponent } from './components/folha-import/folha-import.component';
import { FolhaListComponent } from './components/folha-list/folha-list.component';
import { FolhaAnalysisComponent } from './components/folha-analysis/folha-analysis.component';

export const routes: Routes = [
  { path: '', component: ExcelImportComponent },
  { path: 'importar', component: ExcelImportComponent },
  { path: 'lista', component: DataListComponent },
  { path: 'ganhos', component: EarningsAnalysisComponent },
  { path: 'tabela-empresa-ano', component: CompanyYearTableComponent },
  { path: 'nome-razao', component: NomeRazaoManagerComponent },
  // Folha de Pagamento
  { path: 'folha-importar', component: FolhaImportComponent },
  { path: 'folha-lista', component: FolhaListComponent },
  { path: 'folha-analise', component: FolhaAnalysisComponent }
];
