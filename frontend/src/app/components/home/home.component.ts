import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  goToSignin(): void {
    this.router.navigate(['/signin']);
  }
}
