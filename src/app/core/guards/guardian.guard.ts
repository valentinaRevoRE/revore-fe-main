import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CommonService } from '@core/common/common.service';
import { SupabaseService } from '@revore/services/supabase.service';

export const GuardianGuard: CanActivateFn = async (route, state) => {
  if (state.url.startsWith('/dashboard/sales-tools')) {
    const supabaseS = inject(SupabaseService);
    const { data } = await supabaseS.db.auth.getSession();
    if (!data.session) {
      inject(Router).navigateByUrl('/login');
      return false;
    }
    return true;
  }

  const commonService = inject(CommonService);
  const router = inject(Router);
  const canActivate: boolean = !!commonService.localToken;
  const actualDate: Date = new Date();
  actualDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const isValidSessionTime: boolean = actualDate <= new Date(commonService.localLimitDate);

  if (canActivate && isValidSessionTime) {
    return true;
  } else {
    commonService.clearTokens();
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
