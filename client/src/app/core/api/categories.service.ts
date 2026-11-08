import { Injectable } from '@angular/core';
import { ExpenseCategory } from '../models';
import { CrudApi } from './crud.base';

@Injectable({ providedIn: 'root' })
export class CategoriesService extends CrudApi<ExpenseCategory> {
  constructor() {
    super('ExpenseCategory');
  }
}
