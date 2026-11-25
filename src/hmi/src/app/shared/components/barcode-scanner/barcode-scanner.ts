import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Html5Qrcode } from 'html5-qrcode';

let nextUniqueId = 0;

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './barcode-scanner.html',
  styleUrl: './barcode-scanner.scss',
})
export class BarcodeScannerComponent implements OnChanges, OnDestroy {
  /** Desabilita o botão de iniciar leitura (ex: quando falta selecionar Unidade/SmartLock) */
  @Input() disabled = false;

  /** Mensagem exibida quando o leitor está desabilitado */
  @Input() disabledHint = 'Selecione a Unidade e o SmartLock antes de iniciar a leitura.';

  /** Mantém a câmera aberta para leitura sequencial ininterrupta */
  @Input() continuous = true;

  /** Intervalo mínimo (ms) para ignorar leituras repetidas consecutivas do mesmo código */
  @Input() cooldownMs = 1500;

  /** Padrão de vibração (ms) acionado a cada leitura válida via Vibration API */
  @Input() vibratePattern: number | number[] = 150;

  /** Texto do botão para abrir a câmera */
  @Input() startButtonText = 'Iniciar Leitura por Câmera';

  /** Texto do botão para fechar a câmera */
  @Input() stopButtonText = 'Pausar Leitura';

  /** Emite o código de barras decodificado */
  @Output() codeScanned = new EventEmitter<string>();

  /** Emite mensagem de erro caso falhe a permissão ou inicialização da câmera */
  @Output() scanError = new EventEmitter<string>();

  /** Emite mudanças no estado ativo da câmera */
  @Output() activeChange = new EventEmitter<boolean>();

  readonly readerElementId = `barcode-reader-${++nextUniqueId}`;

  isScanning = false;
  isStarting = false;
  scanSuccessFlash = false;
  lastScannedValue = '';
  errorMessage = '';

  private html5QrCode: Html5Qrcode | null = null;
  private lastScanTimestamp = 0;
  private flashTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && this.disabled && (this.isScanning || this.isStarting)) {
      this.stopScanner();
    }
  }

  async toggleScanner(): Promise<void> {
    if (this.isScanning) {
      await this.stopScanner();
    } else {
      await this.startScanner();
    }
  }

  async startScanner(): Promise<void> {
    if (this.disabled || this.isScanning || this.isStarting) {
      return;
    }

    this.errorMessage = '';
    this.isStarting = true;
    this.cdr.detectChanges();

    try {
      if (!this.html5QrCode) {
        this.html5QrCode = this.createHtml5QrCodeInstance();
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 110 },
        aspectRatio: 1.777778,
      };

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => this.handleDecodedText(decodedText),
        () => {
          // Ignora frames intermediários sem código de barras visível
        },
      );

      this.isScanning = true;
      this.isStarting = false;
      this.activeChange.emit(true);
      this.cdr.detectChanges();
    } catch (err: any) {
      this.isScanning = false;
      this.isStarting = false;
      const msg =
        err?.message ||
        'Não foi possível acessar a câmera. Verifique as permissões de vídeo do navegador.';
      this.errorMessage = msg;
      this.scanError.emit(msg);
      this.activeChange.emit(false);
      this.cdr.detectChanges();
    }
  }

  async stopScanner(): Promise<void> {
    if (!this.html5QrCode) {
      this.isScanning = false;
      this.isStarting = false;
      return;
    }

    try {
      if (this.isScanning) {
        await this.html5QrCode.stop();
      }
      this.html5QrCode.clear();
    } catch {
      // Ignora erro caso já esteja parado
    } finally {
      this.isScanning = false;
      this.isStarting = false;
      this.activeChange.emit(false);
      this.cdr.detectChanges();
    }
  }

  /** Método separado para facilitar mock em testes unitários */
  protected createHtml5QrCodeInstance(): Html5Qrcode {
    return new Html5Qrcode(this.readerElementId);
  }

  /** Processa cada leitura válida da câmera */
  handleDecodedText(rawText: string): void {
    const cleaned = rawText?.trim();
    if (!cleaned) {
      return;
    }

    const now = Date.now();
    if (cleaned === this.lastScannedValue && now - this.lastScanTimestamp < this.cooldownMs) {
      return;
    }

    this.lastScannedValue = cleaned;
    this.lastScanTimestamp = now;

    this.triggerVibration();
    this.triggerVisualFeedback();
    this.codeScanned.emit(cleaned);

    if (!this.continuous) {
      this.stopScanner();
    } else {
      this.cdr.detectChanges();
    }
  }

  private triggerVibration(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(this.vibratePattern);
      } catch {
        // Alguns navegadores restringem vibrate se não houver interação prévia
      }
    }
  }

  private triggerVisualFeedback(): void {
    this.scanSuccessFlash = true;
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
    this.flashTimeoutId = setTimeout(() => {
      this.scanSuccessFlash = false;
      this.cdr.detectChanges();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
    if (this.isScanning && this.html5QrCode) {
      this.html5QrCode
        .stop()
        .then(() => this.html5QrCode?.clear())
        .catch(() => {});
    }
  }
}

