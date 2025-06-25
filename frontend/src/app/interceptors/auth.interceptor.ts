import {HttpInterceptor, HttpRequest, HttpHandler,HttpEvent,HTTP_INTERCEPTORS}
from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
 
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const token = sessionStorage.getItem('token'); // sessionStorage
 
        if (token) {
            const cloned = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next.handle(cloned);
        }
 
        return next.handle(req);
    }
}
 