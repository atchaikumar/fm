import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div style="min-height:100vh; background:var(--c-bg); position:relative; z-index:1">
      <app-navbar />
      <main style="padding-top:64px">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
