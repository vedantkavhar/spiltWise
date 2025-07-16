import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'clear';
  duration?: number; // Optional duration in milliseconds
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast>();
  toastState$ = this.toastSubject.asObservable();

  private idCounter = 0;

  show(message: string, type: Toast['type'] = 'info', duration: number = 1000) {
    // Prevent the 'clear' type from being used with the show method
    if (type === 'clear') {
      throw new Error('Use clear() method to clear toasts');
    }

    const toast: Toast = {
      id: ++this.idCounter,
      message,
      type,
      duration,
    };
    this.toastSubject.next(toast);
  }

  clear() {
    const toast: Toast = {
      id: ++this.idCounter,
      message: '',
      type: 'clear',
    };
    this.toastSubject.next(toast);
  }
}
