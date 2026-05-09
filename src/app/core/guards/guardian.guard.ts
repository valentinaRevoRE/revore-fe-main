import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CommonService } from '@core/common/common.service';
import { SupabaseService } from '@revore/services/supabase.service';
import { AuthService } from '@public/shared/services/auth.service';
import { firstValueFrom } from 'rxjs';

export const GuardianGuard: CanActivateFn = async (route, state) => {
  const router  = inject(Router);
  const commonS = inject(CommonService);

  if (state.url.startsWith('/dashboard/sales-tools')) {
    const { data } = await inject(SupabaseService).db.auth.getSession();
    if (!data.session) { router.navigateByUrl('/login'); return false; }
    return true;
  }

  // Verificar inactividad (se evalúa aunque la cookie siga viva)
  if (commonS.isInactive()) {
    commonS.clearTokens();
    router.navigateByUrl('/login');
    return false;
  }

  // Fast path: usuario en sessionStorage
  if (sessionStorage.getItem('user')) {
    commonS.touchActivity();
    return true;
  }

  // Slow path: sessionStorage vacío (refresh / nueva pestaña) — verificar cookie
  try {
    const user = await firstValueFrom(inject(AuthService).me());
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('userRoles', JSON.stringify(user.roles || []));
    commonS.touchActivity();
    return true;
  } catch {
    router.navigateByUrl('/login');
    return false;
  }
};

export const GuardianByProject: CanActivateFn = () => {
  if (!inject(CommonService).activeProjectId) {
    inject(Router).navigate(['dashboard', 'home']);
    return false;
  }
  return true;
};
