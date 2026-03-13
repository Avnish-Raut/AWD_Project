import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User } from '../../../core/services/users/users.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchQuery: string = '';

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getUsers(this.searchQuery).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadUsers();
  }

  updateRole(user: User, newRole: string): void {
    if (confirm(`Are you sure you want to change ${user.username}'s role to ${newRole}?`)) {
      this.usersService.updateUserRole(user.user_id, newRole).subscribe({
        next: (updatedUser) => {
          user.role = updatedUser.role;
        },
        error: (err) => {
          alert('Failed to update role');
          console.error(err);
        }
      });
    } else {
      // Revert select box if cancelled
      this.loadUsers(); 
    }
  }

  deactivateUser(user: User): void {
    if (confirm(`Are you sure you want to deactivate ${user.username}?`)) {
      this.usersService.deactivateUser(user.user_id).subscribe({
        next: () => {
          user.deleted_at = new Date().toISOString();
        },
        error: (err) => {
          alert('Failed to deactivate user');
          console.error(err);
        }
      });
    }
  }

  reactivateUser(user: User): void {
    if (confirm(`Are you sure you want to reactivate ${user.username}?`)) {
      this.usersService.reactivateUser(user.user_id).subscribe({
        next: (updatedUser) => {
          user.deleted_at = updatedUser.deleted_at;
        },
        error: (err) => {
          alert('Failed to reactivate user');
          console.error(err);
        }
      });
    }
  }
}
