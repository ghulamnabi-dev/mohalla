import { Observable } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ExpensesService } from '../../core/api/expenses.service';
import { Expense, ExpenseCategory, toDate } from '../../core/models';
import { NotificationService } from '../../core/notification.service';

export interface ExpenseDialogData {
  expense: Expense | null;
  categories: ExpenseCategory[];
}

@Component({
  selector: 'app-expense-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatButtonModule],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>{{ data.expense ? 'Edit expense' : 'Add expense' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="e.g. Generator fuel" />
          @if (form.controls.description.invalid) { <mat-error>At least 3 characters.</mat-error> }
        </mat-form-field>
        <div class="row">
          <mat-form-field>
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              @for (c of data.categories; track c.id) { <mat-option [value]="c.id">{{ c.name }}</mat-option> }
            </mat-select>
            @if (!data.categories.length) { <mat-hint>No categories yet — add one from the Categories button.</mat-hint> }
            @if (form.controls.categoryId.invalid) { <mat-error>Choose a category.</mat-error> }
          </mat-form-field>
          <mat-form-field floatLabel="always">
            <mat-label>Amount</mat-label>
            <input matInput type="number" formControlName="amount" min="1" inputmode="numeric" />
            <span matTextPrefix>Rs&nbsp;</span>
            @if (form.controls.amount.invalid) { <mat-error>Enter an amount above 0.</mat-error> }
          </mat-form-field>
        </div>
        <mat-form-field>
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="dp" formControlName="date" />
          <mat-datepicker-toggle matIconSuffix [for]="dp" />
          <mat-datepicker #dp />
          @if (form.controls.date.invalid) { <mat-error>Required.</mat-error> }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ data.expense ? 'Save changes' : 'Add expense' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ExpenseDialogComponent {
  readonly data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ExpenseDialogComponent>);
  private readonly api = inject(ExpensesService);
  private readonly notify = inject(NotificationService);

  readonly saving = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    description: [this.data.expense?.description ?? '', [Validators.required, Validators.minLength(3)]],
    categoryId: [this.data.expense?.categoryId ?? (null as number | null), Validators.required],
    amount: [this.data.expense?.amount ?? (null as number | null), [Validators.required, Validators.min(1)]],
    date: [this.data.expense ? toDate(this.data.expense.year, this.data.expense.month, this.data.expense.expenseDate) : new Date(), Validators.required],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const date = v.date as Date;
    const body: Expense = {
      id: this.data.expense?.id ?? 0,
      description: v.description,
      categoryId: v.categoryId!,
      amount: v.amount!,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      expenseDate: date.getDate(),
    };
    const req: Observable<unknown> = this.data.expense ? this.api.update(this.data.expense.id, body) : this.api.create(body);
    req.subscribe({
      next: () => this.ref.close(true),
      error: (err) => {
        this.saving.set(false);
        this.notify.error(err);
      },
    });
  }
}
