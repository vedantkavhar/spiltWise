import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
})
export class ToastComponent implements OnInit {
  toasts: (Toast & { element?: ElementRef<any> })[] = [];

  @ViewChildren('toastElement') toastElements!: QueryList<ElementRef<any>>;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toastState$.subscribe((toast) => {
      // Handle the 'clear' type to remove all toasts
      if (toast.type === 'clear') {
        this.toasts.forEach((t) => {
          if (t.element) {
            t.element.nativeElement.classList.add('fade-out');
          }
        });
        setTimeout(() => {
          this.toasts = [];
        }, 300); // Match the fade-out animation duration
        return;
      }

      const toastWithElement = { ...toast, element: undefined };
      this.toasts.push(toastWithElement);

      // Wait for the view to update so we can access the DOM element
      setTimeout(() => {
        const toastIndex = this.toasts.findIndex((t) => t.id === toast.id);
        const toastElement = this.toastElements.get(toastIndex);
        if (toastElement && toastIndex !== -1) {
          this.toasts[toastIndex].element = toastElement;
        }

        // Automatically remove the toast after its duration
        const duration = toast.duration ?? 3000; // Default to 3 seconds if not specified
        setTimeout(() => {
          this.removeToast(toast.id);
        }, duration);
      }, 0);
    });
  }

  closeToast(toast: Toast): void {
    this.removeToast(toast.id);
  }

  private removeToast(toastId: number): void {
    const toast = this.toasts.find((t) => t.id === toastId);
    if (toast && toast.element) {
      // Apply the fade-out animation
      toast.element.nativeElement.classList.add('fade-out');

      // Remove the toast after the animation completes (300ms)
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== toastId);
      }, 300);
    } else {
      // Fallback in case the element isn't found
      this.toasts = this.toasts.filter((t) => t.id !== toastId);
    }
  }
}
