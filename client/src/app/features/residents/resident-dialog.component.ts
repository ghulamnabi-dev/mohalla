import { Observable } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ResidentsService } from '../../core/api/residents.service';
import { Resident } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { applyServerErrors } from '../../core/problem-details';

@Component({
  selector: 'app-resident-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ resident ? 'Edit resident' : 'Add resident' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Owner name</mat-label>
          <input matInput formControlName="ownerName" autocomplete="off" />
          @if (form.controls.ownerName.hasError('server')) { <mat-error>{{ form.controls.ownerName.getError('server') }}</mat-error> }
          @else if (form.controls.ownerName.invalid) { <mat-error>Owner name is required.</mat-error> }
        </mat-form-field>
        <div class="row">
          <mat-form-field>
            <mat-label>House number</mat-label>
            <input matInput formControlName="houseNumber" />
            @if (form.controls.houseNumber.hasError('server')) { <mat-error>{{ form.controls.houseNumber.getError('server') }}</mat-error> }
            @else if (form.controls.houseNumber.invalid) { <mat-error>Required.</mat-error> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Street</mat-label>
            <input matInput formControlName="street" />
            @if (form.controls.street.hasError('server')) { <mat-error>{{ form.controls.street.getError('server') }}</mat-error> }
            @else if (form.controls.street.invalid) { <mat-error>Required.</mat-error> }
          </mat-form-field>
        </div>
        <mat-form-field>
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phoneNumber" inputmode="numeric" maxlength="11" placeholder="03XXXXXXXXX" />
          <mat-hint>11 digits</mat-hint>
          @if (form.controls.phoneNumber.hasError('server')) { <mat-error>{{ form.controls.phoneNumber.getError('server') }}</mat-error> }
          @else if (form.controls.phoneNumber.hasError('required')) { <mat-error>Phone is required.</mat-error> }
          @else if (form.controls.phoneNumber.hasError('pattern')) { <mat-error>Enter exactly 11 digits.</mat-error> }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()">{{ resident ? 'Save changes' : 'Add resident' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ResidentDialogComponent {
  readonly resident = inject<Resident | null>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ResidentDialogComponent>);
  private readonly api = inject(ResidentsService);
  private readonly notify = inject(NotificationService);

  readonly saving = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    ownerName: [this.resident?.ownerName ?? '', [Validators.required, Validators.minLength(2)]],
    houseNumber: [this.resident?.houseNumber ?? '', Validators.required],
    street: [this.resident?.street ?? '', Validators.required],
    phoneNumber: [this.resident?.phoneNumber ?? '', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const body: Resident = { id: this.resident?.id ?? 0, ...this.form.getRawValue() };
    const req: Observable<unknown> = this.resident ? this.api.update(this.resident.id, body) : this.api.create(body);
    req.subscribe({
      next: () => this.ref.close(true),
      error: (err) => {
        this.saving.set(false);
        const { handled, unmapped } = applyServerErrors(this.form, err);
        if (!handled) this.notify.error(err);
        else if (unmapped.length) this.notify.error(unmapped[0]);
      },
    });
  }
}
