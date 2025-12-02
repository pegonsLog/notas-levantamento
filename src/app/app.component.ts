import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Controle de Pessoal';
  activeMenu: 'notas' | 'folha' = 'notas';

  constructor(private router: Router) {
    // Detecta automaticamente qual menu mostrar baseado na rota atual
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.activeMenu = url.includes('folha') ? 'folha' : 'notas';
    });
  }

  setMenu(menu: 'notas' | 'folha'): void {
    this.activeMenu = menu;
    // Navega para a primeira rota do menu selecionado
    if (menu === 'notas') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/folha-importar']);
    }
  }
}
