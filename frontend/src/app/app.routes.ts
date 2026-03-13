import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { rolesGuard } from './core/guards/roles.guard';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './auth/reset-password/reset-password';

export const routes: Routes = [
  // Public routes
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  { path: 'reset-password', component: ResetPasswordComponent },
  // Protected routes (canActivate: [authGuard] applied — add components as they are built)
  // Any logged-in user
  // { path: 'events', component: EventListComponent, canActivate: [authGuard] },
  // { path: 'events/:id', component: EventDetailComponent, canActivate: [authGuard] },
  // { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Organizer only
  // { path: 'organizer/events', component: OrgEventListComponent, canActivate: [authGuard, rolesGuard(['ORG'])] },
  // { path: 'organizer/events/create', component: CreateEventComponent, canActivate: [authGuard, rolesGuard(['ORG'])] },

  // Admin only
  // { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard, rolesGuard(['ADMIN'])] },
  // { path: 'admin/logs', component: AdminLogsComponent, canActivate: [authGuard, rolesGuard(['ADMIN'])] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

// Re-export guards so other modules can import from one place
export { authGuard, rolesGuard };
