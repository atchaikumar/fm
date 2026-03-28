import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { environment }         from '../../../environments/environment';

export interface AnalyticsData {
  current_listeners:    number;
  total_plays_tracked:  number;
  recent_history:       Array<{ title: string; artist: string; genre?: string }>;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  data    = signal<AnalyticsData | null>(null);
  loading = signal(false);

  liveCount  = computed(() => this.data()?.current_listeners ?? 0);
  totalPlays = computed(() => this.data()?.total_plays_tracked ?? 0);

  constructor(private http: HttpClient) {}

  load() {
    this.loading.set(true);
    this.http
      .get<AnalyticsData>(`${environment.apiUrl}/api/analytics/`)
      .subscribe({
        next: (d) => { this.data.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }
}
