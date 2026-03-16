import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalUsers: number = 0;

  constructor(
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const skip = (this.currentPage - 1) * this.pageSize;
    
    this.usersService.getUsers(this.searchQuery, skip, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('Received users response:', response);
        if (Array.isArray(response)) {
          this.users = response;
          this.totalUsers = response.length;
        } else {
          this.users = response?.data || [];
          this.totalUsers = response?.total || this.users.length;
        }
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges(); // Force angular to update the template
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.error = 'Failed to load users';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to page 1 on new search
    this.loadUsers();
  }

  nextPage(): void {
    if (this.currentPage * this.pageSize < this.totalUsers) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
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
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert('Failed to reactivate user');
          console.error(err);
        }
      });
    }
  }
}
