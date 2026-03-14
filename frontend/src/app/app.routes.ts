import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { rolesGuard } from './core/guards/roles.guard';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './auth/reset-password/reset-password';
import { AdminLayout } from './core/layouts/admin-layout/admin-layout';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { UserManagement } from './features/admin/user-management/user-management';
import { EventManagement } from './features/admin/event-management/event-management';
import { SystemLogs } from './features/admin/system-logs/system-logs';
import { UserDashboardComponent } from './user-dashboard/user-dashboard';
import { BrowseEventsComponent } from './events/events';
import { EventDetailsComponent } from './events/event-details/event-details';
import { ProfileComponent } from './user-dashboard/profile/profile';

export const routes: Routes = [
  // Public routes
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // User Dashboard
  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    canActivate: [authGuard, rolesGuard(['USER'])],
  },

  // Any logged-in user events viewing
  { path: 'events', component: BrowseEventsComponent, canActivate: [authGuard] },
  { path: 'events/:id', component: EventDetailsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Organizer only
  // { path: 'organizer/events', component: OrgEventListComponent, canActivate: [authGuard, rolesGuard(['ORG'])] },
  // { path: 'organizer/events/create', component: CreateEventComponent, canActivate: [authGuard, rolesGuard(['ORG'])] },

  // Admin only
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, rolesGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'users', component: UserManagement },
      { path: 'events', component: EventManagement },
      { path: 'logs', component: SystemLogs },
    ]
  },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

export { authGuard, rolesGuard };