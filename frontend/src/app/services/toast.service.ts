import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast>();
  toastState$ = this.toastSubject.asObservable();

  private idCounter = 0;

  show(message: string, type: Toast['type'] = 'info') {
    const toast: Toast = {
      id: ++this.idCounter,
      message,
      type,
    };
    this.toastSubject.next(toast);
  }
}
