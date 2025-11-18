import { Routes } from '@angular/router';
import { ExcelImportComponent } from './components/excel-import/excel-import.component';
import { DataListComponent } from './components/data-list/data-list.component';
import { EarningsAnalysisComponent } from './components/earnings-analysis/earnings-analysis.component';

export const routes: Routes = [
  { path: '', component: ExcelImportComponent },
  { path: 'importar', component: ExcelImportComponent },
  { path: 'lista', component: DataListComponent },
  { path: 'ganhos', component: EarningsAnalysisComponent }
];
