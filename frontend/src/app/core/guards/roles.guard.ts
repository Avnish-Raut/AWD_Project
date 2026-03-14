import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

export const rolesGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const role = auth.getRole();

    // Check if user role matches any allowed roles
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Redirect if unauthorized
    return router.createUrlTree(['/login']);
  };
};