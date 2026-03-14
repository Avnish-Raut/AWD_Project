import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { rolesGuard } from './core/guards/roles.guard';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './auth/reset-password/reset-password';
import { UserDashboardComponent } from './user-dashboard/user-dashboard';
import { OrganizerDashboardComponent } from './organizer-dashboard/organizer-dashboard';
import { BrowseEventsComponent } from './events/events';
import { EventDetailsComponent } from './events/event-details/event-details';
import { CreateEventComponent } from './events/create-event/create-event';

export const routes: Routes = [
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

  // Organizer Dashboard
  {
    path: 'organizer-dashboard',
    component: OrganizerDashboardComponent,
    canActivate: [authGuard, rolesGuard(['ORG'])],
  },

  // ADDED: Create Event Route
  {
    path: 'create-event',
    component: CreateEventComponent,
    canActivate: [authGuard, rolesGuard(['ORG'])],
  },

  { path: 'events', component: BrowseEventsComponent, canActivate: [authGuard] },
  { path: 'events/:id', component: EventDetailsComponent, canActivate: [authGuard] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

export { authGuard, rolesGuard };