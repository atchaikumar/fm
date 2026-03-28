import { Injectable, signal } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { environment }         from '../../../environments/environment';

export interface ChatMessage {
  id:         string;
  username:   string;
  message:    string;
  is_ai:      boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private ws: WebSocket | null = null;

  messages  = signal<ChatMessage[]>([]);
  connected = signal(false);

  constructor(private http: HttpClient) {}

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(`${environment.wsUrl}/api/chat/ws`);

    this.ws.onopen  = () => this.connected.set(true);
    this.ws.onclose = () => {
      this.connected.set(false);
      this.ws = null;
      setTimeout(() => this.connect(), 3000);
    };
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.event === 'chat') {
        this.messages.update((prev) => [...prev, msg.data].slice(-100));
      }
    };
  }

  loadHistory() {
    this.http
      .get<ChatMessage[]>(`${environment.apiUrl}/api/chat/messages`)
      .subscribe((msgs) => this.messages.set(msgs));
  }

  send(username: string, message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ username, message }));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
