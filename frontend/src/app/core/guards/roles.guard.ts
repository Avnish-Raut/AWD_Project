import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Protects routes that require a specific role.
 * Usage in routes:  canActivate: [authGuard, rolesGuard(['ORG'])]
 *   or:             canActivate: [authGuard, rolesGuard(['ADMIN'])]
 *   or:             canActivate: [authGuard, rolesGuard(['ORG', 'ADMIN'])]
 *
 * Always combine with authGuard — rolesGuard assumes the user is already
 * authenticated and focuses only on role validation.
 */
export const rolesGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole();

  if (role && allowedRoles.includes(role)) {
    return true;
  }

  // Authenticated but wrong role — send back to home
  return router.createUrlTree(['/']);
};
