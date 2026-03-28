import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { RequestsService, SongRequest } from '../../core/services/requests.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { StationService } from '../../core/services/station.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .dashboard-page { max-width: 1400px; margin: 0 auto; padding: 40px 24px; }
    .header { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--c-text); }
    .subtitle { font-family: var(--font-mono); font-size: 12px; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.1em; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
    .stat-card {
      background: var(--c-surface); border: 1px solid var(--c-border);
      border-radius: 16px; padding: 24px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .stat-label { font-family: var(--font-mono); font-size: 10px; color: var(--c-hint); text-transform: uppercase; }
    .stat-value { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--c-cyan); }

    .main-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px; }

    .card {
      background: var(--c-surface); border: 1px solid var(--c-border);
      border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;
      height: 600px;
    }
    .card-header {
      padding: 16px 24px; border-bottom: 1px solid var(--c-border);
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.02);
    }
    .card-title { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.15em; }

    /* ── Requests Table ── */
    .req-list { flex: 1; overflow-y: auto; padding: 12px; }
    .req-item {
      padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03);
      border: 1px solid var(--c-border); margin-bottom: 12px;
      display: flex; justify-content: space-between; align-items: flex-start;
      transition: border-color 0.2s;
    }
    .req-item:hover { border-color: rgba(0,229,200,0.2); }
    .req-info { flex: 1; }
    .req-song { font-size: 15px; font-weight: 700; color: var(--c-text); }
    .req-meta { font-family: var(--font-mono); font-size: 11px; color: var(--c-muted); margin-top: 4px; }
    .req-note { font-size: 12px; color: var(--c-hint); font-style: italic; margin-top: 8px; border-left: 2px solid var(--c-border2); padding-left: 10px; }
    .req-actions { display: flex; gap: 8px; }
    .btn {
      padding: 6px 12px; border-radius: 6px; font-family: var(--font-mono); font-size: 10px;
      font-weight: 700; cursor: pointer; transition: opacity 0.2s; border: none;
    }
    .btn-approve { background: var(--c-cyan); color: #000; }
    .btn-reject { background: rgba(255,107,107,0.15); border: 1px solid rgba(255,107,107,0.3); color: var(--c-red); }

    /* ── Chat Feed ── */
    .chat-feed { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .chat-msg { display: flex; flex-direction: column; gap: 4px; border-bottom: 1px solid var(--c-border); padding-bottom: 12px; }
    .chat-user { font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--c-cyan); }
    .chat-user.ai { color: var(--c-amber); }
    .chat-text { font-size: 13px; line-height: 1.5; color: var(--c-text); }
    .chat-time { font-family: var(--font-mono); font-size: 9px; color: var(--c-hint); align-self: flex-end; }
  `],
  template: `
    <div class="dashboard-page">
      <div class="header">
        <div>
          <div class="subtitle">Broadcast Center</div>
          <h1 class="title">Station Dashboard</h1>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Live Listeners</span>
          <span class="stat-value">{{ analytics.liveCount() }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Tracks</span>
          <span class="stat-value">{{ analytics.totalPlays() }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending Requests</span>
          <span class="stat-value">{{ requests.requests().length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Uptime</span>
          <span class="stat-value">99.8%</span>
        </div>
      </div>

      <div class="main-grid">
        <!-- Song Requests -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Live Requests</span>
            <button class="btn" style="background: rgba(255,255,255,0.05); color: var(--c-text)" (click)="requests.load()">REFRESH</button>
          </div>
          <div class="req-list">
            @for (req of requests.requests(); track req.id) {
              <div class="req-item">
                <div class="req-info">
                  <div class="req-song">{{ req.song_title }}</div>
                  <div class="req-meta">by {{ req.artist }} · From: {{ req.requester }}</div>
                  @if (req.note) {
                    <div class="req-note">"{{ req.note }}"</div>
                  }
                </div>
                <div class="req-actions">
                  <button class="btn btn-approve" (click)="updateRequest(req.id, 'approved')">APPROVE</button>
                  <button class="btn btn-reject" (click)="updateRequest(req.id, 'rejected')">REJECT</button>
                </div>
              </div>
            } @empty {
              <div style="text-align:center; padding:40px; color:var(--c-hint); font-family:var(--font-mono); font-size:12px">
                No active requests
              </div>
            }
          </div>
        </div>

        <!-- Chat Moderation -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Global Chat Feed</span>
          </div>
          <div class="chat-feed">
            @for (msg of chat.messages(); track msg.id) {
              <div class="chat-msg">
                <div class="chat-user" [class.ai]="msg.is_ai">{{ msg.username }} {{ msg.is_ai ? '🎙' : '' }}</div>
                <div class="chat-text">{{ msg.message }}</div>
                <div class="chat-time">{{ msg.created_at | date:'HH:mm' }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  constructor(
    public chat: ChatService,
    public requests: RequestsService,
    public analytics: AnalyticsService,
    public station: StationService
  ) {}

  ngOnInit() {
    this.chat.connect();
    this.chat.loadHistory();
    this.requests.load();
    this.analytics.load();
  }

  updateRequest(id: string, status: SongRequest['status']) {
    this.requests.updateStatus(id, status).subscribe(() => {
      this.requests.load();
    });
  }
}
