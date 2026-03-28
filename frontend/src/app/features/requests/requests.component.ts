import { Component, OnInit, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { RequestsService, SongRequestIn } from '../../core/services/requests.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .page { max-width: 1280px; margin: 0 auto; padding: 40px 24px; display: grid; grid-template-columns: 480px 1fr; gap: 24px; }
    @media (max-width: 900px) { .page { grid-template-columns: 1fr; } }
    .page-eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.25em; color: var(--c-amber); text-transform: uppercase; margin-bottom: 8px; }
    .card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 16px; padding: 32px; }
    .card-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
    .card-sub { color: var(--c-muted); font-size: 13px; margin-bottom: 28px; }
    .field { margin-bottom: 16px; }
    .field label {
      display: block; font-family: var(--font-mono); font-size: 9px;
      letter-spacing: 0.2em; color: var(--c-hint); text-transform: uppercase; margin-bottom: 6px;
    }
    .field input, .field textarea {
      width: 100%; background: rgba(255,255,255,0.03);
      border: 1px solid var(--c-border); border-radius: 10px;
      padding: 12px 14px; color: var(--c-text);
      font-family: var(--font-display); font-size: 13px; outline: none;
      transition: border-color 0.2s; resize: none;
    }
    .field input::placeholder, .field textarea::placeholder { color: var(--c-hint); }
    .field input:focus, .field textarea:focus { border-color: rgba(0,229,200,0.35); }
    .submit-btn {
      width: 100%; padding: 14px;
      background: var(--c-amber); border: none; border-radius: 10px;
      color: #000; font-family: var(--font-display);
      font-size: 13px; font-weight: 700; letter-spacing: 0.05em;
      cursor: pointer; transition: opacity 0.2s, transform 0.15s;
      margin-top: 4px;
    }
    .submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.35; transform: none; cursor: not-allowed; }
    .dj-response {
      margin-top: 20px; padding: 16px 18px;
      background: rgba(255,184,48,0.06);
      border: 1px solid rgba(255,184,48,0.2);
      border-radius: 12px; animation: fade-up 0.4s ease;
    }
    .dj-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; color: var(--c-amber); margin-bottom: 6px; }
    .dj-text { font-size: 13px; line-height: 1.6; color: var(--c-text); font-style: italic; }
    .queue-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .refresh-btn { background: none; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; color: var(--c-hint); transition: color 0.2s; }
    .refresh-btn:hover { color: var(--c-text); }
    .req-item {
      padding: 16px; border-radius: 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--c-border);
      margin-bottom: 10px; animation: fade-up 0.3s ease;
    }
    .req-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .req-title { font-size: 14px; font-weight: 700; }
    .req-meta { font-family: var(--font-mono); font-size: 11px; color: var(--c-muted); }
    .req-badge { font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.12em; padding: 3px 8px; border-radius: 4px; flex-shrink: 0; }
    .req-dj { font-size: 12px; color: var(--c-muted); font-style: italic; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--c-border); }
    .empty { text-align: center; padding: 40px 0; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--c-hint); }
  `],
  template: `
    <div class="page">
      <!-- Form -->
      <div>
        <div class="page-eyebrow">🎤 On-Air Request Line</div>
        <div class="card">
          <div class="card-title">Request a Song</div>
          <div class="card-sub">DJ Nova will acknowledge your request live on air.</div>

          <div class="field">
            <label>Your Name</label>
            <input [(ngModel)]="form.requester" placeholder="e.g. Priya from Chennai" />
          </div>
          <div class="field">
            <label>Song Title</label>
            <input [(ngModel)]="form.song_title" placeholder="e.g. Midnight City" />
          </div>
          <div class="field">
            <label>Artist</label>
            <input [(ngModel)]="form.artist" placeholder="e.g. M83" />
          </div>
          <div class="field">
            <label>Message for DJ (optional)</label>
            <textarea [(ngModel)]="form.note" rows="3" placeholder="Dedicate this to someone, share a memory…"></textarea>
          </div>
          <button class="submit-btn" (click)="submit()" [disabled]="submitting()">
            {{ submitting() ? 'Sending to DJ Nova…' : '🎙 Send Request' }}
          </button>

          @if (djResponse()) {
            <div class="dj-response">
              <div class="dj-label">🎙 DJ NOVA SAYS</div>
              <div class="dj-text">"{{ djResponse() }}"</div>
            </div>
          }
        </div>
      </div>

      <!-- Queue -->
      <div class="card">
        <div class="queue-header">
          <div>
            <div class="page-eyebrow">Live Queue</div>
            <div class="card-title">Requests</div>
          </div>
          <button class="refresh-btn" (click)="svc.load()">↻ REFRESH</button>
        </div>

        @if (svc.loading()) {
          <div class="empty">Loading queue…</div>
        } @else {
          @for (req of svc.requests(); track req.id) {
            <div class="req-item">
              <div class="req-top">
                <div>
                  <div class="req-title">{{ req.song_title }}</div>
                  <div class="req-meta">{{ req.artist }} · by {{ req.requester }}</div>
                </div>
                <span class="req-badge" [style.background]="statusBg(req.status)" [style.color]="statusColor(req.status)">
                  {{ req.status | uppercase }}
                </span>
              </div>
              @if (req.ai_response) {
                <div class="req-dj">🎙 "{{ req.ai_response }}"</div>
              }
            </div>
          }
          @empty {
            <div class="empty">No requests yet — be the first!</div>
          }
        }
      </div>
    </div>
  `,
})
export class RequestsComponent implements OnInit {
  form: SongRequestIn = { requester: '', song_title: '', artist: '', note: '' };
  submitting = signal(false);
  djResponse = signal('');
  constructor(public svc: RequestsService) {}
  ngOnInit() { this.svc.load(); }
  statusBg(s: string) { return s==='approved'?'rgba(74,222,128,0.12)':s==='playing'?'rgba(0,229,200,0.12)':'rgba(250,204,21,0.12)'; }
  statusColor(s: string) { return s==='approved'?'#4ade80':s==='playing'?'var(--c-cyan)':'#facc15'; }
  submit() {
    if (!this.form.requester || !this.form.song_title) return;
    this.submitting.set(true); this.djResponse.set('');
    this.svc.submit(this.form).subscribe({
      next: (r) => { this.djResponse.set(r.ai_response??''); this.submitting.set(false); this.form={requester:this.form.requester,song_title:'',artist:'',note:''}; this.svc.load(); },
      error: () => this.submitting.set(false),
    });
  }
}
