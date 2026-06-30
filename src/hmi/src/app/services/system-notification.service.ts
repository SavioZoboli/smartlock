import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

interface SnackbarClass{
  tipo:'sucesso'|'erro'|'info',
  classe:string
}

@Injectable({
  providedIn: 'root',
})
export class SystemNotificationService {

  constructor(private snackBar:MatSnackBar){}

  private snackbar_class:readonly SnackbarClass[] = [
    {tipo:'sucesso',classe:'success-snackbar'},
    {tipo:'erro',classe:'error-snackbar'}
  ]

  public notificar(mensagem:string,tipo:'sucesso'|'erro'|'info'){

    let painelClass = this.snackbar_class.filter(sc=>sc.tipo == tipo)[0].classe

    this.snackBar.open(mensagem, 'Fechar', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: [painelClass],
    });
  }
}
