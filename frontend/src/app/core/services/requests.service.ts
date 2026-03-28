import { Injectable, signal } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { environment }         from '../../../environments/environment';

export interface SongRequest {
  id:          string;
  requester:   string;
  song_title:  string;
  artist:      string;
  note:        string;
  status:      'pending' | 'approved' | 'playing' | 'rejected';
  ai_response: string;
  created_at:  string;
}

export interface SongRequestIn {
  requester:  string;
  song_title: string;
  artist:     string;
  note:       string;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  requests = signal<SongRequest[]>([]);
  loading  = signal(false);

  constructor(private http: HttpClient) {}

  load() {
    this.loading.set(true);
    this.http
      .get<SongRequest[]>(`${environment.apiUrl}/api/requests/`)
      .subscribe({
        next: (r) => { this.requests.set(r); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  submit(body: SongRequestIn) {
    return this.http.post<{ id: string; status: string; ai_response: string; message: string }>(
      `${environment.apiUrl}/api/requests/`,
      body
    );
  }

  updateStatus(id: string, status: SongRequest['status']) {
    return this.http.patch(`${environment.apiUrl}/api/requests/${id}`, { status });
  }
}
