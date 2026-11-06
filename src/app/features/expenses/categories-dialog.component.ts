import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoriesService } from '../../core/api/categories.service';
import { ExpenseCategory } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

/** Inline add / rename / delete of expense categories. Every change is persisted immediately. */
@Component({
  selector: 'app-categories-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatListModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>Expense categories</h2>
    <mat-dialog-content class="content">
      <form class="add" (ngSubmit)="add()">
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>New category</mat-label>
          <input matInput [formControl]="newName" placeholder="e.g. Security, Water, Generator" />
        </mat-form-field>
        <button mat-flat-button type="submit" [disabled]="newName.invalid || busy()">Add</button>
      </form>
      @if (busy()) { <mat-progress-bar mode="indeterminate" /> }
      <mat-list>
        @for (c of categories(); track c.id) {
          <mat-list-item>
            @if (editing()?.id === c.id) {
              <form class="edit" (ngSubmit)="rename()">
                <mat-form-field subscriptSizing="dynamic"><input matInput [formControl]="editName" cdkFocusInitial /></mat-form-field>
                <button mat-icon-button type="submit" matTooltip="Save" aria-label="Save"><mat-icon>check</mat-icon></button>
                <button mat-icon-button type="button" (click)="editing.set(null)" matTooltip="Cancel" aria-label="Cancel"><mat-icon>close</mat-icon></button>
              </form>
            } @else {
              <div class="cat-row">
                <span>{{ c.name }}</span>
                <span class="row-actions">
                  <button mat-icon-button (click)="startEdit(c)" matTooltip="Rename" aria-label="Rename"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button (click)="remove(c)" matTooltip="Delete" aria-label="Delete"><mat-icon>delete</mat-icon></button>
                </span>
              </div>
            }
          </mat-list-item>
        } @empty {
          <p class="muted" style="padding:16px 0;text-align:center">No categories yet.</p>
        }
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Done</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content { min-width: min(440px, 90vw); }
    .add { display: flex; gap: 8px; align-items: center; margin: 8px 0 12px; mat-form-field { flex: 1; } }
    .edit { display: flex; gap: 4px; align-items: center; width: 100%; mat-form-field { flex: 1; } }
    .cat-row { display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .row-actions { display: inline-flex; }
  `,
})
export class CategoriesDialogComponent {
  private readonly api = inject(CategoriesService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly categories = signal<ExpenseCategory[]>([]);
  readonly busy = signal(false);
  readonly editing = signal<ExpenseCategory | null>(null);
  readonly newName = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] });
  readonly editName = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] });

  constructor() {
    this.load();
  }

  load(): void {
    this.busy.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.categories.set(rows);
        this.busy.set(false);
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.error(err);
      },
    });
  }

  add(): void {
    if (this.newName.invalid) return;
    this.busy.set(true);
    this.api.create({ name: this.newName.value.trim() }).subscribe({
      next: () => {
        this.newName.reset();
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.error(err);
      },
    });
  }

  startEdit(c: ExpenseCategory): void {
    this.editing.set(c);
    this.editName.setValue(c.name);
  }

  rename(): void {
    const c = this.editing();
    if (!c || this.editName.invalid) return;
    this.busy.set(true);
    this.api.update(c.id, { ...c, name: this.editName.value.trim() }).subscribe({
      next: () => {
        this.editing.set(null);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.notify.error(err);
      },
    });
  }

  remove(c: ExpenseCategory): void {
    this.dialog
      .open(ConfirmDialogComponent, { data: { title: 'Delete category?', message: `"${c.name}" will be removed. Expenses already filed under it keep their records.`, confirmLabel: 'Delete', destructive: true } })
      .afterClosed()
      .subscribe((ok: boolean) => {
        if (!ok) return;
        this.busy.set(true);
        this.api.delete(c.id).subscribe({
          next: () => this.load(),
          error: (err) => {
            this.busy.set(false);
            this.notify.error(err);
          },
        });
      });
  }
}
