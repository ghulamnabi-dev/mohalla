import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';

/** ASP.NET Core ValidationProblemDetails: field names are PascalCase. */
export interface ValidationProblem {
  title?: string;
  errors: Record<string, string[] | string>;
}

export function validationProblem(err: unknown): ValidationProblem | null {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) return null;
  const body = err.error;
  return body && typeof body === 'object' && body.errors && typeof body.errors === 'object' ? (body as ValidationProblem) : null;
}

/** "PaidAmount" / "$.paidAmount" / "body.PaidAmount" → "paidAmount". */
export function toControlName(field: string): string {
  const last = field.split('.').pop() ?? field;
  return last.charAt(0).toLowerCase() + last.slice(1);
}

function messages(value: string[] | string): string[] {
  return (Array.isArray(value) ? value : [value]).filter((m) => typeof m === 'string' && m.length > 0);
}

/** First message of a validation problem, or null. */
export function firstValidationMessage(problem: ValidationProblem): string | null {
  for (const value of Object.values(problem.errors)) {
    const [first] = messages(value);
    if (first) return first;
  }
  return null;
}

/**
 * Put a 400 ValidationProblemDetails' messages on the matching form controls as a `server` error
 * (cleared by the control's own validators on the next edit).
 *
 * `aliases` maps API fields that have no control of their own (e.g. `month`) onto one that does (`date`).
 * Returns `handled: false` when nothing could be placed on a control, so the caller falls back to a snackbar;
 * `unmapped` lists messages for fields the form doesn't have.
 */
export function applyServerErrors(
  form: FormGroup,
  err: unknown,
  aliases: Record<string, string> = {},
): { handled: boolean; unmapped: string[] } {
  const problem = validationProblem(err);
  if (!problem) return { handled: false, unmapped: [] };

  const unmapped: string[] = [];
  let handled = false;
  for (const [field, value] of Object.entries(problem.errors)) {
    const [message] = messages(value);
    if (!message) continue;
    const name = toControlName(field);
    const control: AbstractControl | null = form.get(aliases[name] ?? name);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
      handled = true;
    } else {
      unmapped.push(message);
    }
  }
  return { handled, unmapped };
}
