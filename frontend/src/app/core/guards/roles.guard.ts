import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
export const rolesGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const role = auth.getRole();
    //console.log(`[RolesGuard] User Role: ${role} | Required: ${allowedRoles}`);
    if (role && allowedRoles.includes(role)) {
      return true;
    }
    console.warn(`[RolesGuard] Access Denied. Redirecting to login.`);
    return router.createUrlTree(['/login']);
  };
};
