import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CommonService } from '@core/common/common.service';
import { SupabaseService } from '@revore/services/supabase.service';
import { AuthService } from '@public/shared/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const GuardianGuard: CanActivateFn = async (route, state) => {
  const router   = inject(Router);
  const commonS  = inject(CommonService);

  if (state.url.startsWith('/dashboard/sales-tools')) {
    const supabaseS = inject(SupabaseService);
    const { data }  = await supabaseS.db.auth.getSession();
    if (!data.session) {
      router.navigateByUrl('/login');
      return false;
    }
    return true;
  }

  // Fast path: sessionStorage tiene usuario y la sesión no ha expirado
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    const stillValid = new Date() <= new Date(commonS.localLimitDate);
    if (stillValid) return true;
    commonS.clearTokens();
    router.navigateByUrl('/login');
    return false;
  }

  // Slow path: no hay sesión en memoria, verificar cookie con el servidor
  try {
    const authS = inject(AuthService);
    const user  = await firstValueFrom(authS.me());
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('userRoles', JSON.stringify(user.roles || []));
    return true;
  } catch {
    router.navigateByUrl('/login');
    return false;
  }
};

export const GuardianByProject: CanActivateFn = (route, state) => {
  const _cmS = inject(CommonService);
  if (!_cmS.activeProjectId) {
    inject(Router).navigate(['dashboard', 'home']);
    return false;
  }
  return true;
};
