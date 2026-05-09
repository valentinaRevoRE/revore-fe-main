import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Verificar si hay token
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si tiene roles de admin
  const rolesStr = sessionStorage.getItem('userRoles');
  if (!rolesStr) {
    router.navigate(['/']);
    return false;
  }

  try {
    const roles: string[] = JSON.parse(rolesStr);
    
    // Verificar si tiene rol de admin
    const hasAdminRole = roles.includes('admin');
    
    if (!hasAdminRole) {
      router.navigate(['/dashboard/home']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error parsing roles:', error);
    router.navigate(['/login']);
    return false;
  }
};

