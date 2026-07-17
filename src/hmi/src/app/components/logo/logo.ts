import { Component, computed, inject, input, Input } from '@angular/core';
import { ThemeTogglerService } from '../../services/theme-toggler.service';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {

  themeService = inject(ThemeTogglerService);

  // Define a entrada como um Signal. Aceita 'mono' ou 'color'. O padrão é 'color'.
  styleType = input<'mono' | 'color'>('color');

  // computed() reage automaticamente tanto à mudança do input quanto do tema
  path = computed(() => {
    const isDark = this.themeService.isDarkTheme();
    const currentStyle = this.styleType();
    const themeString = isDark ? 'dark' : 'light';

    return `logo/${currentStyle}_${themeString}.svg`; 
  });
}
