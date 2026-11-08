import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Renders its element only for admins: `<button *appAdminOnly mat-flat-button>…</button>`.
 * Viewers get a read-only UI; the API enforces the same rule with 403s.
 */
@Directive({ selector: '[appAdminOnly]' })
export class AdminOnlyDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private shown = false;

  constructor() {
    effect(() => {
      const admin = this.auth.isAdmin();
      if (admin && !this.shown) this.container.createEmbeddedView(this.template);
      else if (!admin && this.shown) this.container.clear();
      this.shown = admin;
    });
  }
}
