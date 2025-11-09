import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateUserRoleDto {
  roleName: string;
}

export interface UpdateUserStatusDto {
  isActive: boolean;
}

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersByRole: Record<string, number>;
}

export interface AvailableRole {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener todos los usuarios
   */
  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/admin/users`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener un usuario por ID
   */
  getUserById(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/admin/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualizar rol del usuario (reemplaza todos los roles)
   */
  updateUserRole(userId: string, roleName: string): Observable<AdminUser> {
    return this.http.put<AdminUser>(
      `${this.baseUrl}/admin/users/${userId}/role`,
      { roleName },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Agregar un rol adicional al usuario
   */
  addUserRole(userId: string, roleName: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      `${this.baseUrl}/admin/users/${userId}/role`,
      { roleName },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar un rol del usuario
   */
  removeUserRole(userId: string, roleName: string): Observable<AdminUser> {
    return this.http.delete<AdminUser>(
      `${this.baseUrl}/admin/users/${userId}/role/${roleName}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar estado activo/inactivo del usuario
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<AdminUser> {
    return this.http.put<AdminUser>(
      `${this.baseUrl}/admin/users/${userId}/status`,
      { isActive },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getUserStats(): Observable<AdminUserStats> {
    return this.http.get<AdminUserStats>(`${this.baseUrl}/admin/users/stats`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener roles disponibles para asignar
   */
  getAvailableRoles(): Observable<AvailableRole[]> {
    return this.http.get<AvailableRole[]>(`${this.baseUrl}/admin/users/available-roles`, {
      headers: this.getHeaders()
    });
  }
}


