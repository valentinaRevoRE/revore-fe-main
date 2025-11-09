import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService, AdminUser, AdminUserStats, AvailableRole } from './services/admin-users.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  stats: AdminUserStats | null = null;
  loading = false;
  error: string | null = null;
  searchTerm = '';
  selectedRole = 'all';
  selectedStatus = 'all';

  // Modal de edición
  showEditModal = false;
  selectedUser: AdminUser | null = null;
  newRole = '';

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  availableRoles: AvailableRole[] = [];

  constructor(private adminUsersService: AdminUsersService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
    this.loadAvailableRoles();
  }
  

  /**
   * Cargar todos los usuarios
   */
  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.adminUsersService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Error al cargar usuarios. Verifica que tengas permisos de administrador.';
        this.loading = false;
      }
    });
  }

  /**
   * Cargar estadísticas
   */
  loadStats(): void {
    this.adminUsersService.getUserStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  /**
   * Aplicar filtros de búsqueda
   */
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Filtro de búsqueda
      const matchesSearch = !this.searchTerm || 
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filtro de rol
      const matchesRole = this.selectedRole === 'all' || 
        user.roles.includes(this.selectedRole);

      // Filtro de estado
      const matchesStatus = this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' && user.isActive) ||
        (this.selectedStatus === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  /**
   * Abrir modal de edición
   */
  openEditModal(user: AdminUser): void {
    this.selectedUser = user;
    this.newRole = user.roles[0] || 'advisor';
    this.showEditModal = true;
  }

  /**
   * Cerrar modal de edición
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.newRole = '';
  }

  /**
   * Actualizar rol del usuario
   */
  updateRole(): void {
    if (!this.selectedUser || !this.newRole) return;

    // Verificar que no sea el mismo rol
    if (this.selectedUser.roles.includes(this.newRole)) {
      this.showToastMessage('El usuario ya tiene ese rol asignado', 'error');
      return;
    }

    // Verificar que el admin no se cambie a sí mismo
    const currentUserEmail = localStorage.getItem('user');
    if (currentUserEmail) {
      const currentUser = JSON.parse(currentUserEmail);
      if (currentUser.email === this.selectedUser.email) {
        this.showToastMessage('No puedes cambiar tu propio rol. Pide a otro administrador que lo haga.', 'error');
        return;
      }
    }

    this.loading = true;
    this.adminUsersService.updateUserRole(this.selectedUser.id, this.newRole).subscribe({
      next: (updatedUser) => {
        // Actualizar usuario en la lista
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.applyFilters();
        this.closeEditModal();
        this.loading = false;
        this.showToastMessage('Rol actualizado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error updating role:', error);
        const errorMessage = error?.error?.message || 'Error al actualizar rol';
        this.showToastMessage(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  /**
   * Cambiar estado activo/inactivo del usuario
   */
  toggleUserStatus(user: AdminUser): void {
    const newStatus = !user.isActive;
    const confirmMessage = newStatus 
      ? `¿Activar usuario ${user.email}?`
      : `¿Desactivar usuario ${user.email}?`;

    if (!confirm(confirmMessage)) return;

    this.adminUsersService.updateUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.applyFilters();
        this.showToastMessage('Estado actualizado exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.showToastMessage('Error al actualizar estado', 'error');
      }
    });
  }

  /**
   * Formatear fecha
   */
  formatDate(date: string | null): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener clase de badge según el rol
   */
  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      'super_admin': 'badge-super-admin',
      'admin': 'badge-admin',
      'developer': 'badge-developer',
      'commercial_leader': 'badge-commercial',
      'advisor': 'badge-advisor'
    };
    return classes[role] || 'badge-default';
  }

  /**
   * Obtener label del rol
   */
  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'developer': 'Developer',
      'commercial_leader': 'Commercial Leader',
      'advisor': 'Advisor'
    };
    return labels[role] || role;
  }

  /**
   * Mostrar mensaje toast
   */
  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  /**
   * Cargar roles disponibles desde el backend
   */
  loadAvailableRoles(): void {
    this.adminUsersService.getAvailableRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: (error) => {
        console.error('Error cargando roles disponibles:', error);
        // Fallback a roles hardcodeados si falla el backend
        this.availableRoles = [
          { value: 'admin', label: 'Admin' },
          { value: 'developer', label: 'Desarrollador' },
          { value: 'commercial_leader', label: 'Commercial Leader' },
          { value: 'advisor', label: 'Advisor' }
        ];
      }
    });
  }
}

