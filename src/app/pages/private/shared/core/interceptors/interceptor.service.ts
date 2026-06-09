import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '@core/common/common.service';
import { Observable, catchError, throwError } from 'rxjs';

const SUPABASE_STORAGE_KEY = 'revore_ss_auth';

function getSupabaseToken(): string | null {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    return raw ? JSON.parse(raw).access_token ?? null : null;
  } catch {
    return null;
  }
}

@Injectable()
export class InterceptorService implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const route   = inject(Router);
    const commonS = inject(CommonService);

    const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
    const token = getSupabaseToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const request = req.clone({ withCredentials: true, setHeaders: headers });

    return next.handle(request).pipe(
      catchError((err) => {
        if ([401, 403].includes(err.status)) {
          commonS.clearTokens();
          route.navigate(['login']);
        }
        return throwError(() => err);
      })
    );
  }
}
