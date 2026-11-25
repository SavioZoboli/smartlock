import { TestBed } from '@angular/core/testing';
import { ThemeTogglerService } from './theme-toggler.service';

describe('ThemeTogglerService', () => {
  const html = document.documentElement;

  const criar = () => {
    const service = TestBed.inject(ThemeTogglerService);
    TestBed.tick(); // executa o effect que aplica o tema
    return service;
  };

  beforeEach(() => {
    localStorage.clear();
    html.classList.remove('dark-theme', 'light-theme');
  });

  afterEach(() => vi.restoreAllMocks());

  it('usa o tema salvo no localStorage (dark)', () => {
    localStorage.setItem('app-theme', 'dark');

    const service = criar();

    expect(service.isDarkTheme()).toBe(true);
    expect(html.classList.contains('dark-theme')).toBe(true);
  });

  it('sem preferência salva, segue o tema do sistema operacional', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

    const service = criar();

    expect(service.isDarkTheme()).toBe(true);
  });

  it('toggleTheme alterna a classe no <html> e persiste no localStorage', () => {
    localStorage.setItem('app-theme', 'light');
    const service = criar();
    expect(html.classList.contains('light-theme')).toBe(true);

    service.toggleTheme();
    TestBed.tick();

    expect(service.isDarkTheme()).toBe(true);
    expect(html.classList.contains('dark-theme')).toBe(true);
    expect(html.classList.contains('light-theme')).toBe(false);
    expect(localStorage.getItem('app-theme')).toBe('dark');
  });
});

