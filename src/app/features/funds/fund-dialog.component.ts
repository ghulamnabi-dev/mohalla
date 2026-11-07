import { Observable } from 'rxjs';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FundsService } from '../../core/api/funds.service';
import { Fund, Resident, toDate } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { applyServerErrors } from '../../core/problem-details';
import { PkrPipe } from '../../shared/pkr.pipe';

export interface FundDialogData {
  fund: Fund | null;
  residents: Resident[];
}

@Component({
  selector: 'app-fund-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatButtonModule, PkrPipe],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>{{ data.fund ? 'Edit payment' : 'Record payment' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Resident</mat-label>
          <mat-select formControlName="residentId">
            @for (r of data.residents; track r.id) {
              <mat-option [value]="r.id">{{ r.ownerName }} — H-{{ r.houseNumber }}, {{ r.street }}</mat-option>
            }
          </mat-select>
          @if (form.controls.residentId.hasError('server')) { <mat-error>{{ form.controls.residentId.getError('server') }}</mat-error> }
          @else if (form.controls.residentId.invalid) { <mat-error>Choose a resident.</mat-error> }
        </mat-form-field>

        <div class="row">
          <mat-form-field>
            <mat-label>Date paid</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="date" />
            <mat-datepicker-toggle matIconSuffix [for]="dp" />
            <mat-datepicker #dp />
            @if (form.controls.date.hasError('server')) { <mat-error>{{ form.controls.date.getError('server') }}</mat-error> }
            @else if (form.controls.date.invalid) { <mat-error>Required.</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Paid to</mat-label>
            <input matInput formControlName="paidTo" placeholder="e.g. Treasurer" />
            @if (form.controls.paidTo.hasError('server')) { <mat-error>{{ form.controls.paidTo.getError('server') }}</mat-error> }
            @else if (form.controls.paidTo.invalid) { <mat-error>Required.</mat-error> }
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field floatLabel="always">
            <mat-label>Amount due</mat-label>
            <input matInput type="number" formControlName="amount" min="1" inputmode="numeric" />
            <span matTextPrefix>Rs&nbsp;</span>
            @if (form.controls.amount.hasError('server')) { <mat-error>{{ form.controls.amount.getError('server') }}</mat-error> }
            @else if (form.controls.amount.invalid) { <mat-error>Enter an amount above 0.</mat-error> }
          </mat-form-field>
          <mat-form-field floatLabel="always">
            <mat-label>Amount paid</mat-label>
            <input matInput type="number" formControlName="paidAmount" min="0" inputmode="numeric" />
            <span matTextPrefix>Rs&nbsp;</span>
            @if (form.controls.paidAmount.hasError('server')) { <mat-error>{{ form.controls.paidAmount.getError('server') }}</mat-error> }
            @else if (form.controls.paidAmount.hasError('required') || form.controls.paidAmount.hasError('min')) { <mat-error>Enter 0 or more.</mat-error> }
            @else if (form.hasError('overpaid')) { <mat-error>Cannot exceed the amount due.</mat-error> }
          </mat-form-field>
        </div>

        <p class="muted" style="margin:0">
          Outstanding after this payment: <strong class="mono">{{ outstanding() | pkr }}</strong>
        </p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ data.fund ? 'Save changes' : 'Record payment' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class FundDialogComponent {
  readonly data = inject<FundDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<FundDialogComponent>);
  private readonly api = inject(FundsService);
  private readonly notify = inject(NotificationService);

  readonly saving = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group(
    {
      residentId: [this.data.fund?.residentId ?? (this.data.residents.length === 1 ? this.data.residents[0].id : (null as number | null)), Validators.required],
      date: [this.data.fund ? toDate(this.data.fund.year, this.data.fund.month, this.data.fund.datePaid) : new Date(), Validators.required],
      paidTo: [this.data.fund?.paidTo ?? '', [Validators.required, Validators.minLength(2)]],
      amount: [this.data.fund?.amount ?? (null as number | null), [Validators.required, Validators.min(1)]],
      paidAmount: [this.data.fund?.paidAmount ?? 0, [Validators.required, Validators.min(0)]],
    },
    { validators: (g) => ((g.get('paidAmount')?.value ?? 0) > (g.get('amount')?.value ?? 0) ? { overpaid: true } : null) },
  );

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  readonly outstanding = computed(() => Math.max((this.values().amount ?? 0) - (this.values().paidAmount ?? 0), 0));

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const date = v.date as Date;
    const body: Fund = {
      id: this.data.fund?.id ?? 0,
      residentId: v.residentId!,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      datePaid: date.getDate(),
      paidTo: v.paidTo,
      amount: v.amount!,
      paidAmount: v.paidAmount,
      outstanding: v.amount! - v.paidAmount,
    };
    const req: Observable<unknown> = this.data.fund ? this.api.update(this.data.fund.id, body) : this.api.create(body);
    req.subscribe({
      next: () => this.ref.close(true),
      error: (err) => {
        this.saving.set(false);
        const { handled, unmapped } = applyServerErrors(this.form, err, { month: 'date', year: 'date', datePaid: 'date', outstanding: 'paidAmount' });
        if (!handled) this.notify.error(err);
        else if (unmapped.length) this.notify.error(unmapped[0]);
      },
    });
  }
}
