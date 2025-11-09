import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Verificar si hay token
  const token = localStorage.getItem('accessToken');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si tiene roles de admin
  const rolesStr = localStorage.getItem('userRoles');
  if (!rolesStr) {
    router.navigate(['/']);
    return false;
  }

  try {
    const roles: string[] = JSON.parse(rolesStr);
    
    // Verificar si tiene rol de admin
    const hasAdminRole = roles.includes('admin');
    
    if (!hasAdminRole) {
      alert('No tienes permisos para acceder a esta sección. Se requiere rol de administrador.');
      router.navigate(['/']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error parsing roles:', error);
    router.navigate(['/login']);
    return false;
  }
};

