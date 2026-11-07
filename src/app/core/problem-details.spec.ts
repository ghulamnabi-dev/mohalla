import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { applyServerErrors, toControlName } from './problem-details';

const problem = (errors: Record<string, string[]>) =>
  new HttpErrorResponse({ status: 400, error: { title: 'One or more validation errors occurred.', errors } });

describe('problem details', () => {
  it('maps PascalCase API fields to camelCase control names', () => {
    expect(toControlName('PhoneNumber')).toBe('phoneNumber');
    expect(toControlName('$.paidAmount')).toBe('paidAmount');
  });

  it('puts server messages on matching controls and reports the rest', () => {
    const form = new FormGroup({ phoneNumber: new FormControl(''), date: new FormControl<Date | null>(null) });
    const result = applyServerErrors(form, problem({ PhoneNumber: ['Must be 11 digits.'], Month: ['Bad month.'], Other: ['Nope.'] }), { month: 'date' });
    expect(result.handled).toBeTrue();
    expect(result.unmapped).toEqual(['Nope.']);
    expect(form.controls.phoneNumber.getError('server')).toBe('Must be 11 digits.');
    expect(form.controls.date.getError('server')).toBe('Bad month.');
  });

  it('ignores errors that are not validation problems', () => {
    const form = new FormGroup({ name: new FormControl('') });
    expect(applyServerErrors(form, new HttpErrorResponse({ status: 403 })).handled).toBeFalse();
    expect(applyServerErrors(form, new HttpErrorResponse({ status: 400, error: { title: 'Bad' } })).handled).toBeFalse();
  });
});
