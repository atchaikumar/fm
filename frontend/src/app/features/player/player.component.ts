import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, AfterViewChecked } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { StationService } from '../../core/services/station.service';
import { ChatService }    from '../../core/services/chat.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .page { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
    @media (max-width: 1024px) { .page { grid-template-columns: 1fr; } }

    /* ── Player card ── */
    .player-card {
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 16px;
      padding: 32px;
      position: relative;
      overflow: hidden;
    }
    .player-card::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 20% 50%, rgba(0,229,200,0.04) 0%, transparent 60%);
      pointer-events: none;
    }
    .corner-tag {
      position: absolute; top: 0; right: 0;
      background: var(--c-amber);
      color: #000;
      font-family: var(--font-mono);
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.15em;
      padding: 5px 14px;
      border-bottom-left-radius: 10px;
    }
    .track-row { display: flex; align-items: center; gap: 24px; }
    .album-art {
      width: 100px; height: 100px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0d2020, #1a1a2e);
      border: 1px solid var(--c-border2);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; flex-shrink: 0;
    }
    .album-art::after {
      content: '';
      position: absolute; inset: 0;
      background: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,229,200,0.03) 4px, rgba(0,229,200,0.03) 5px);
    }
    .album-icon { font-size: 32px; position: relative; z-index: 1; }
    .genre-badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 3px;
      border: 1px solid var(--c-cyan);
      color: var(--c-cyan);
      margin-bottom: 8px;
    }
    .track-title {
      font-family: var(--font-display);
      font-size: 26px; font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--c-text);
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .track-artist {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--c-muted);
      letter-spacing: 0.05em;
    }

    /* ── VU Meter ── */
    .vu-meter {
      display: flex; align-items: flex-end; gap: 3px;
      height: 36px; margin: 24px 0 8px;
    }
    .vu-bar {
      flex: 1; border-radius: 2px;
      background: linear-gradient(to top, var(--c-cyan) 0%, var(--c-amber) 70%, var(--c-red) 100%);
    }
    .vu-bar:nth-child(1)  { animation: vu1 0.7s ease-in-out infinite; }
    .vu-bar:nth-child(2)  { animation: vu2 0.6s ease-in-out infinite 0.05s; }
    .vu-bar:nth-child(3)  { animation: vu3 0.8s ease-in-out infinite 0.1s; }
    .vu-bar:nth-child(4)  { animation: vu4 0.55s ease-in-out infinite 0.15s; }
    .vu-bar:nth-child(5)  { animation: vu5 0.9s ease-in-out infinite 0.08s; }
    .vu-bar:nth-child(6)  { animation: vu6 0.65s ease-in-out infinite 0.2s; }
    .vu-bar:nth-child(7)  { animation: vu7 0.75s ease-in-out infinite 0.03s; }
    .vu-bar:nth-child(8)  { animation: vu1 0.5s ease-in-out infinite 0.12s; }
    .vu-bar:nth-child(9)  { animation: vu3 0.85s ease-in-out infinite 0.18s; }
    .vu-bar:nth-child(10) { animation: vu2 0.7s ease-in-out infinite 0.07s; }
    .vu-bar:nth-child(11) { animation: vu5 0.6s ease-in-out infinite 0.22s; }
    .vu-bar:nth-child(12) { animation: vu4 0.78s ease-in-out infinite 0.04s; }
    .vu-bar:nth-child(13) { animation: vu7 0.88s ease-in-out infinite 0.16s; }
    .vu-bar:nth-child(14) { animation: vu1 0.68s ease-in-out infinite 0.09s; }
    .vu-bar:nth-child(15) { animation: vu8 0.58s ease-in-out infinite 0.13s; }
    .vu-bar:nth-child(16) { animation: vu3 0.72s ease-in-out infinite 0.25s; }
    .vu-bar.paused { animation-play-state: paused; height: 15% !important; opacity: 0.3; }

    /* ── Progress ── */
    .progress-wrap {
      height: 3px; background: rgba(255,255,255,0.06);
      border-radius: 2px; overflow: hidden; margin-bottom: 24px;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--c-cyan), var(--c-amber));
      border-radius: 2px;
      transform-origin: left;
      animation: progress-track 180s linear infinite;
    }

    /* ── Controls ── */
    .controls { display: flex; align-items: center; gap: 16px; }
    .play-btn {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--c-amber);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 0 20px rgba(255,184,48,0.3);
      flex-shrink: 0;
    }
    .play-btn:hover { transform: scale(1.08); box-shadow: 0 0 30px rgba(255,184,48,0.5); }
    .next-btn {
      background: none; border: 1px solid var(--c-border2);
      color: var(--c-muted); border-radius: 8px;
      padding: 8px 16px; cursor: pointer;
      font-family: var(--font-mono); font-size: 11px;
      letter-spacing: 0.1em;
      transition: color 0.2s, border-color 0.2s;
    }
    .next-btn:hover { color: var(--c-text); border-color: var(--c-border2); }
    .vol-group {
      margin-left: auto; display: flex; align-items: center; gap: 10px;
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.12em; color: var(--c-hint);
    }
    input[type=range] {
      -webkit-appearance: none; width: 90px; height: 3px;
      background: rgba(255,255,255,0.1); border-radius: 2px; cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 12px; height: 12px;
      border-radius: 50%; background: var(--c-amber);
      box-shadow: 0 0 8px rgba(255,184,48,0.5);
    }

    /* ── History ── */
    .history-card {
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 16px; padding: 24px; margin-top: 20px;
    }
    .section-label {
      font-family: var(--font-mono);
      font-size: 10px; letter-spacing: 0.2em;
      color: var(--c-hint); text-transform: uppercase;
      margin-bottom: 16px;
    }
    .history-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--c-border);
      animation: fade-up 0.3s ease forwards;
    }
    .history-item:last-child { border-bottom: none; }
    .history-num {
      font-family: var(--font-mono); font-size: 10px;
      color: var(--c-hint); width: 20px; text-align: right; flex-shrink: 0;
    }
    .history-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--c-border2); flex-shrink: 0;
    }
    .history-title { font-size: 13px; font-weight: 600; color: var(--c-text); }
    .history-artist { font-family: var(--font-mono); font-size: 11px; color: var(--c-muted); }

    /* ── Chat ── */
    .chat-card {
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 16px;
      display: flex; flex-direction: column;
      height: calc(100vh - 112px);
      min-height: 500px;
      position: sticky; top: 80px;
    }
    .chat-header {
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--c-border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .chat-header-title {
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.2em; color: var(--c-muted); text-transform: uppercase;
    }
    .chat-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex;
      flex-direction: column; gap: 12px;
    }
    .msg-wrap { display: flex; flex-direction: column; gap: 3px; }
    .msg-wrap.mine { align-items: flex-end; }
    .msg-user {
      font-family: var(--font-mono); font-size: 9px;
      letter-spacing: 0.08em; color: var(--c-hint);
    }
    .msg-user.dj { color: var(--c-amber); }
    .msg-bubble {
      padding: 8px 12px; border-radius: 10px;
      font-size: 13px; line-height: 1.5;
      max-width: 88%; word-break: break-word;
      animation: fade-up 0.2s ease forwards;
    }
    .msg-bubble.dj {
      background: rgba(255,184,48,0.08);
      border: 1px solid rgba(255,184,48,0.2);
      color: var(--c-text);
      border-top-left-radius: 2px;
    }
    .msg-bubble.user {
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--c-border);
      color: var(--c-text);
    }
    .msg-bubble.mine {
      background: rgba(0,229,200,0.08);
      border: 1px solid rgba(0,229,200,0.18);
      color: var(--c-text);
      border-top-right-radius: 2px;
    }
    .chat-input-row {
      padding: 16px;
      border-top: 1px solid var(--c-border);
      display: flex; gap: 10px; align-items: center;
    }
    .chat-input {
      flex: 1; background: rgba(255,255,255,0.04);
      border: 1px solid var(--c-border);
      border-radius: 10px; padding: 10px 14px;
      color: var(--c-text); font-family: var(--font-display);
      font-size: 13px; outline: none;
      transition: border-color 0.2s;
    }
    .chat-input::placeholder { color: var(--c-hint); }
    .chat-input:focus { border-color: rgba(0,229,200,0.3); }
    .send-btn {
      width: 38px; height: 38px; border-radius: 10px;
      background: var(--c-cyan); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; color: #000; font-weight: 700;
      transition: opacity 0.2s, transform 0.15s;
      flex-shrink: 0;
    }
    .send-btn:hover { opacity: 0.85; transform: scale(1.05); }
  `],
  template: `
    <div class="page">
      <!-- Left column -->
      <div>
        <!-- Player card -->
        <div class="player-card">
          <div class="corner-tag">▶ ON AIR</div>

          <div class="track-row">
            <div class="album-art">
              <span class="album-icon">🎵</span>
            </div>
            <div style="flex:1; min-width:0">
              <div class="genre-badge">{{ station.nowPlaying()?.genre ?? 'Loading' }}</div>
              <div class="track-title">{{ station.nowPlaying()?.title ?? '—' }}</div>
              <div class="track-artist">{{ station.nowPlaying()?.artist ?? '—' }}</div>
            </div>
          </div>

          <!-- VU Meter -->
          <div class="vu-meter">
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
            <div class="vu-bar" [class.paused]="!playing()"></div>
          </div>

          <div class="progress-wrap">
            <div class="progress-bar"></div>
          </div>

          <div class="controls">
            <button class="play-btn" (click)="togglePlay()">
              {{ playing() ? '⏸' : '▶' }}
            </button>
            <button class="next-btn" (click)="station.forceNext().subscribe()">⏭ NEXT</button>
            <div class="vol-group">
              VOL
              <input type="range" min="0" max="1" step="0.05" [value]="volume()" (input)="setVolume($event)" />
            </div>
          </div>

          <audio #audioEl [src]="station.getStreamUrl()" preload="none"></audio>
        </div>

        <!-- History -->
        <div class="history-card">
          <div class="section-label">Recently Played</div>
          @for (track of station.history(); track track.title; let i = $index) {
            <div class="history-item">
              <span class="history-num">{{ i + 1 }}</span>
              <span class="history-dot"></span>
              <div>
                <div class="history-title">{{ track.title }}</div>
                <div class="history-artist">{{ track.artist }}</div>
              </div>
            </div>
          }
          @empty {
            <div style="text-align:center; padding:24px 0; color:var(--c-hint); font-family:var(--font-mono); font-size:12px">
              No history yet
            </div>
          }
        </div>
      </div>

      <!-- Chat -->
      <div class="chat-card">
        <div class="chat-header">
          <span class="chat-header-title">Live Chat</span>
          <span style="width:6px; height:6px; border-radius:50%; flex-shrink:0"
                [style.background]="chat.connected() ? 'var(--c-cyan)' : 'rgba(255,255,255,0.15)'"
                [style.box-shadow]="chat.connected() ? '0 0 8px var(--c-cyan)' : 'none'">
          </span>
        </div>

        <div #chatBox class="chat-messages">
          @for (msg of chat.messages(); track msg.id) {
            <div class="msg-wrap" [class.mine]="!msg.is_ai">
              <span class="msg-user" [class.dj]="msg.is_ai">{{ msg.username }}</span>
              <div class="msg-bubble"
                [class.dj]="msg.is_ai"
                [class.mine]="!msg.is_ai">
                {{ msg.message }}
              </div>
            </div>
          }
          @empty {
            <div style="margin:auto; text-align:center; color:var(--c-hint); font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em">
              Be the first to say something
            </div>
          }
        </div>

        <div class="chat-input-row">
          <input class="chat-input" [(ngModel)]="chatInput" (keyup.enter)="sendChat()" placeholder="Say something…" />
          <button class="send-btn" (click)="sendChat()">↑</button>
        </div>
      </div>
    </div>
  `,
})
export class PlayerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('audioEl') audioEl!: ElementRef<HTMLAudioElement>;
  @ViewChild('chatBox') chatBox!: ElementRef<HTMLDivElement>;

  playing   = signal(false);
  volume    = signal(0.8);
  chatInput = '';
  username  = 'Listener_' + Math.floor(Math.random() * 9999);
  private lastMsgCount = 0;

  constructor(public station: StationService, public chat: ChatService) {}

  ngOnInit() {
    this.station.connect();
    this.station.fetchHistory();
    this.chat.connect();
    this.chat.loadHistory();
  }

  ngOnDestroy() {
    this.station.disconnect();
    this.chat.disconnect();
  }

  ngAfterViewChecked() {
    const msgs = this.chat.messages();
    if (msgs.length !== this.lastMsgCount) {
      this.lastMsgCount = msgs.length;
      const box = this.chatBox?.nativeElement;
      if (box) box.scrollTop = box.scrollHeight;
    }
  }

  togglePlay() {
    const el = this.audioEl?.nativeElement;
    if (!el) return;
    if (this.playing()) { el.pause(); this.playing.set(false); }
    else { el.play().catch(() => {}); this.playing.set(true); }
  }

  setVolume(event: Event) {
    const v = parseFloat((event.target as HTMLInputElement).value);
    this.volume.set(v);
    if (this.audioEl?.nativeElement) this.audioEl.nativeElement.volume = v;
  }

  sendChat() {
    if (!this.chatInput.trim()) return;
    this.chat.send(this.username, this.chatInput.trim());
    this.chatInput = '';
  }
}
