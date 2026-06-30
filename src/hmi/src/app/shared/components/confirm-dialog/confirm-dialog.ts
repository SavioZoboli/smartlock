import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { 
  MatDialogModule, 
  MatDialogRef, 
  MAT_DIALOG_DATA 
} from '@angular/material/dialog';

// Interface para garantir a tipagem do que o Dialog espera receber
export interface ConfirmDialogData {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p>{{ data.mensagem }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancelar()">{{ data.textoCancelar || 'Cancelar' }}</button>
      <button mat-flat-button color="warn" (click)="onConfirmar()">{{ data.textoConfirmar || 'Confirmar' }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancelar(): void {
    this.dialogRef.close(false); // Retorna falso ao fechar
  }

  onConfirmar(): void {
    this.dialogRef.close(true); // Retorna verdadeiro ao confirmar
  }
}