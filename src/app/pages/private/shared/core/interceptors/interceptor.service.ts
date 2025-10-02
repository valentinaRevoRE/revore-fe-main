import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '@core/common/common.service';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const route = inject(Router);
    const commonS = inject(CommonService);
    const token: string | null = localStorage.getItem('sT') ?? null;
    let request = req;
    if (token) {
      request = req.clone({
        setHeaders: {
          authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
    }
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
