import { Component, inject } from '@angular/core';
import { ThemeTogglerService } from '../../services/theme-toggler.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-theme-toggler',
  imports: [MatTooltip, MatIcon, MatButtonModule, MatSlideToggle],
  templateUrl: './theme-toggler.html',
  styleUrl: './theme-toggler.scss',
})
export class ThemeToggler {
protected themeToggler = inject(ThemeTogglerService);
}
