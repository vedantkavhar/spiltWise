import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();
  let authReq = req;

  if (authToken) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`),
    });
  }

  // Add withCredentials for routes that need cookies (e.g., /refresh-token)
  const routesRequiringCredentials = ['/auth/refresh-token', '/auth/logout', '/auth/signin', '/auth/signup'];
  if (routesRequiringCredentials.some(route => req.url.includes(route))) {
    authReq = authReq.clone({
      withCredentials: true,
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error.expired) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

const handle401Error = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> => {
  return authService.refreshToken().pipe(
    switchMap((response: { accessToken: string }) => {
      const newToken = response.accessToken;
      if (newToken) {
        authService.updateAccessToken(newToken);
        const clonedReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${newToken}`),
          withCredentials: true,
        });
        return next(clonedReq);
      }
      authService.logout();
      return throwError(() => new Error('Token refresh failed'));
    }),
    catchError((err) => {
      authService.logout();
      return throwError(() => err);
    })
  );
};
