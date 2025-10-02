import { ApplicationConfig } from '@angular/core';
import {
  ExtraOptions,
  provideRouter,
  withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { InterceptorService } from '@private/shared/core/interceptors/interceptor.service';
import { provideEnvironmentNgxMask } from 'ngx-mask';

const routerOptions: ExtraOptions = {
  initialNavigation: 'enabledBlocking',
  scrollPositionRestoration: 'top',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling(routerOptions)),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideEnvironmentNgxMask(),
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
  ],
};
