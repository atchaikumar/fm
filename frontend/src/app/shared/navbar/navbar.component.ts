import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StationService } from '../../core/services/station.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: 64px;
      background: rgba(8,10,15,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--c-border);
      display: flex; align-items: center; padding: 0 28px; gap: 0;
    }
    .brand {
      display: flex; align-items: center; gap: 10px; margin-right: 40px;
    }
    .brand-text {
      font-family: var(--font-mono);
      font-size: 15px; font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--c-amber);
    }
    .on-air-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--c-red);
      box-shadow: 0 0 8px var(--c-red), 0 0 20px rgba(255,77,109,0.4);
      animation: pulse-glow 1.4s ease-in-out infinite;
    }
    .freq-label {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--c-muted);
      letter-spacing: 0.1em;
      margin-left: -4px;
    }
    .nav-link {
      font-family: var(--font-display);
      font-size: 12px; font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--c-muted);
      text-decoration: none;
      padding: 6px 16px;
      border-radius: 4px;
      transition: color 0.2s, background 0.2s;
    }
    .nav-link:hover { color: var(--c-text); background: rgba(255,255,255,0.04); }
    .nav-link.active { color: var(--c-amber); }
    .status-area {
      margin-left: auto;
      display: flex; align-items: center; gap: 20px;
    }
    .status-pill {
      display: flex; align-items: center; gap: 7px;
      font-family: var(--font-mono);
      font-size: 10px; letter-spacing: 0.12em;
      color: var(--c-muted);
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .vu-mini {
      display: flex; align-items: flex-end; gap: 2px; height: 16px;
    }
    .vu-mini span {
      width: 3px; border-radius: 1px;
      background: var(--c-cyan);
      opacity: 0.7;
    }
    .vu-mini span:nth-child(1) { animation: vu1 0.8s ease-in-out infinite; }
    .vu-mini span:nth-child(2) { animation: vu2 0.7s ease-in-out infinite 0.1s; }
    .vu-mini span:nth-child(3) { animation: vu3 0.9s ease-in-out infinite 0.2s; }
    .vu-mini span:nth-child(4) { animation: vu4 0.6s ease-in-out infinite 0.05s; }
    .vu-mini span:nth-child(5) { animation: vu5 1.0s ease-in-out infinite 0.15s; }
    .ticker-wrap {
      max-width: 200px; overflow: hidden;
      border-left: 1px solid var(--c-border); padding-left: 16px;
    }
    .ticker-inner {
      white-space: nowrap;
      animation: ticker 12s linear infinite;
      font-family: var(--font-mono);
      font-size: 10px; color: var(--c-hint);
      letter-spacing: 0.05em;
    }
  `],
  template: `
    <nav>
      <div class="brand">
        <span class="brand-text">AI·FM</span>
        <span class="on-air-dot"></span>
        <span class="freq-label">99.9</span>
      </div>

      @if (station.connected()) {
        <div class="vu-mini" style="margin-right:24px">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      }

      <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Now Playing</a>
      <a class="nav-link" routerLink="/channels"  routerLinkActive="active">Channels</a>
      <a class="nav-link" routerLink="/requests"  routerLinkActive="active">Requests</a>
      <a class="nav-link" routerLink="/analytics" routerLinkActive="active">Analytics</a>
      <a class="nav-link" routerLink="/dashboard" routerLinkActive="active" style="color: var(--c-cyan); border: 1px solid rgba(0,229,200,0.2)">Dashboard</a>

      <div class="status-area">
        <div class="status-pill">
          <span class="status-dot" [style.background]="station.connected() ? 'var(--c-cyan)' : 'rgba(255,255,255,0.2)'"
                [style.box-shadow]="station.connected() ? '0 0 8px var(--c-cyan)' : 'none'"></span>
          {{ station.connected() ? 'LIVE' : 'OFFLINE' }}
        </div>
        <div class="status-pill">
          <span style="color:var(--c-amber)">{{ station.nowPlaying()?.listeners ?? 0 }}</span>
          &nbsp;LISTENERS
        </div>
        <div class="ticker-wrap" *ngIf="station.nowPlaying()">
          <div class="ticker-inner">
            NOW PLAYING: {{ station.nowPlaying()?.title }} — {{ station.nowPlaying()?.artist }}
            &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
            NOW PLAYING: {{ station.nowPlaying()?.title }} — {{ station.nowPlaying()?.artist }}
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  constructor(public station: StationService) {}
}
