import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// Suggest comments for the code below
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // This interceptor adds the Authorization header with the Bearer token to outgoing HTTP requests
  // It retrieves the token from sessionStorage and appends it to the request headers if available

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = sessionStorage.getItem('token'); // sessionStorage

    // If token exists, clone the request and add the Authorization header
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Pass the cloned request with the token
      return next.handle(cloned);
    }
    // If no token, pass the original request
    return next.handle(req);
  }
}
