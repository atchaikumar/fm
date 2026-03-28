import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { AnalyticsService }   from '../../core/services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .page { max-width: 1280px; margin: 0 auto; padding: 40px 24px; }
    .page-eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.25em; color: var(--c-amber); text-transform: uppercase; margin-bottom: 8px; }
    .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 36px; }
    .page-title { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; }
    .refresh-btn { background: none; border: 1px solid var(--c-border); border-radius: 8px; padding: 8px 16px; color: var(--c-muted); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; cursor: pointer; transition: color 0.2s, border-color 0.2s; }
    .refresh-btn:hover { color: var(--c-text); border-color: var(--c-border2); }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    @media (max-width: 700px) { .kpi-grid { grid-template-columns: 1fr; } }
    .kpi-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 16px; padding: 28px; position: relative; overflow: hidden; }
    .kpi-card::before { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
    .kpi-card.amber::before { background: linear-gradient(90deg, transparent, var(--c-amber), transparent); }
    .kpi-card.cyan::before  { background: linear-gradient(90deg, transparent, var(--c-cyan), transparent); }
    .kpi-card.green::before { background: linear-gradient(90deg, transparent, #4ade80, transparent); }
    .kpi-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; color: var(--c-hint); text-transform: uppercase; margin-bottom: 16px; }
    .kpi-value { font-size: 48px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
    .kpi-value.amber { color: var(--c-amber); }
    .kpi-value.cyan  { color: var(--c-cyan);  }
    .kpi-value.green { color: #4ade80; }
    .kpi-sub { font-family: var(--font-mono); font-size: 10px; color: var(--c-hint); margin-top: 8px; }
    .table-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 16px; overflow: hidden; }
    .table-header { padding: 24px 28px; border-bottom: 1px solid var(--c-border); }
    .table-title { font-size: 16px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px 28px; text-align: left; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; color: var(--c-hint); text-transform: uppercase; border-bottom: 1px solid var(--c-border); }
    td { padding: 16px 28px; border-bottom: 1px solid var(--c-border); font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .td-num { font-family: var(--font-mono); font-size: 11px; color: var(--c-hint); }
    .td-title { font-weight: 600; }
    .td-artist { color: var(--c-muted); font-size: 12px; }
    .genre-chip { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); color: var(--c-muted); border: 1px solid var(--c-border); }
    .empty-row { text-align: center; padding: 40px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--c-hint); }
  `],
  template: `
    <div class="page">
      <div class="page-eyebrow">📊 Station Metrics</div>
      <div class="page-header">
        <h1 class="page-title">Analytics</h1>
        <button class="refresh-btn" (click)="svc.load()">↻ REFRESH</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card amber">
          <div class="kpi-label">Live Listeners</div>
          <div class="kpi-value amber">{{ svc.data()?.current_listeners ?? '0' }}</div>
          <div class="kpi-sub">Right now on-air</div>
        </div>
        <div class="kpi-card cyan">
          <div class="kpi-label">Tracks Played</div>
          <div class="kpi-value cyan">{{ svc.data()?.total_plays_tracked ?? '0' }}</div>
          <div class="kpi-sub">This session</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">AI DJ Status</div>
          <div class="kpi-value green" style="font-size:32px">ON AIR</div>
          <div class="kpi-sub">DJ Nova is broadcasting</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <div class="page-eyebrow" style="margin-bottom:4px">Playback Log</div>
          <div class="table-title">Recent Plays</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Artist</th>
              <th>Genre</th>
            </tr>
          </thead>
          <tbody>
            @for (track of svc.data()?.recent_history ?? []; track track.title; let i = $index) {
              <tr>
                <td class="td-num">{{ i + 1 }}</td>
                <td class="td-title">{{ track.title }}</td>
                <td class="td-artist">{{ track.artist }}</td>
                <td><span class="genre-chip">{{ track.genre ?? '—' }}</span></td>
              </tr>
            }
            @empty {
              <tr><td colspan="4" class="empty-row">No playback data yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  constructor(public svc: AnalyticsService) {}
  ngOnInit() { this.svc.load(); }
}
