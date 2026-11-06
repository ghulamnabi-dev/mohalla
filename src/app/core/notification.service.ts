import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, undefined, { duration: 3000, panelClass: 'snack-success' });
  }

  error(message: string | HttpErrorResponse): void {
    const text = typeof message === 'string' ? message : this.describe(message);
    this.snack.open(text, 'Dismiss', { duration: 6000, panelClass: 'snack-error' });
  }

  private describe(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Cannot reach the API. Is the server running?';
    if (typeof err.error === 'string' && err.error.length < 200) return err.error;
    if (err.error?.title) return err.error.title;
    if (err.status === 401) return 'Your session has expired. Please sign in again.';
    if (err.status === 404) return 'Not found.';
    return `Request failed (${err.status}).`;
  }
}
