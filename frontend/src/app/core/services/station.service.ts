import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }                   from '@angular/common/http';
import { environment }                  from '../../../environments/environment';

export interface NowPlaying {
  title:      string;
  artist:     string;
  genre:      string;
  started_at: string;
  duration_s: number;
  listeners:  number;
}

export interface TrackHistory {
  title:      string;
  artist:     string;
  played_at?: string;
}

@Injectable({ providedIn: 'root' })
export class StationService {
  private ws: WebSocket | null = null;

  nowPlaying  = signal<NowPlaying | null>(null);
  history     = signal<TrackHistory[]>([]);
  connected   = signal(false);

  constructor(private http: HttpClient) {}

  // ── WebSocket ────────────────────────────────────────────────────────
  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(`${environment.wsUrl}/api/station/ws`);

    this.ws.onopen = () => this.connected.set(true);
    this.ws.onclose = () => {
      this.connected.set(false);
      this.ws = null;
      setTimeout(() => this.connect(), 3000); // auto-reconnect
    };
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.event === 'now_playing') {
        this.nowPlaying.set(msg.data);
      }
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  // ── REST ─────────────────────────────────────────────────────────────
  fetchHistory() {
    return this.http
      .get<TrackHistory[]>(`${environment.apiUrl}/api/station/history`)
      .subscribe((h) => this.history.set(h));
  }

  forceNext() {
    return this.http.post(`${environment.apiUrl}/api/station/next`, {});
  }

  getStreamUrl() {
    return `${environment.apiUrl}/api/stream/listen`;
  }
}
