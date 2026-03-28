import { Component, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';

interface Channel {
  id: string; name: string; genre: string;
  description: string; emoji: string; color: string; listeners: number;
}

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .page { max-width: 1280px; margin: 0 auto; padding: 40px 24px; }
    .page-header { margin-bottom: 40px; }
    .page-eyebrow {
      font-family: var(--font-mono); font-size: 10px;
      letter-spacing: 0.25em; color: var(--c-amber);
      text-transform: uppercase; margin-bottom: 8px;
    }
    .page-title { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; }
    .page-sub { color: var(--c-muted); font-size: 14px; margin-top: 6px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .ch-card {
      background: var(--c-surface);
      border: 1px solid var(--c-border);
      border-radius: 16px; padding: 28px;
      cursor: pointer; position: relative; overflow: hidden;
      transition: border-color 0.25s, transform 0.2s;
    }
    .ch-card:hover { transform: translateY(-2px); border-color: var(--c-border2); }
    .ch-card.active { border-color: var(--c-amber); }
    .ch-glow {
      position: absolute; inset: 0; opacity: 0;
      transition: opacity 0.25s; pointer-events: none;
    }
    .ch-card:hover .ch-glow { opacity: 1; }
    .ch-card.active .ch-glow { opacity: 1; }
    .ch-emoji { font-size: 36px; margin-bottom: 20px; display: block; }
    .ch-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .ch-name { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
    .live-badge {
      display: flex; align-items: center; gap: 5px;
      font-family: var(--font-mono); font-size: 9px; font-weight: 700;
      letter-spacing: 0.15em; color: var(--c-amber);
    }
    .live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--c-amber); animation: pulse-glow 1.4s infinite; }
    .ch-desc { font-size: 13px; color: var(--c-muted); margin-bottom: 20px; line-height: 1.5; }
    .ch-meta {
      display: flex; align-items: center; gap: 12px;
      font-family: var(--font-mono); font-size: 10px;
      color: var(--c-hint); letter-spacing: 0.05em;
    }
    .ch-meta-sep { opacity: 0.3; }
    .ch-listeners { color: var(--c-muted); }
    .mini-bars { display: flex; align-items: flex-end; gap: 2px; height: 14px; margin-left: auto; }
    .mini-bar { width: 3px; border-radius: 1px; opacity: 0; transition: opacity 0.3s; }
    .ch-card.active .mini-bar { opacity: 0.6; }
    .mini-bar:nth-child(1) { animation: vu1 0.8s ease-in-out infinite; }
    .mini-bar:nth-child(2) { animation: vu3 0.7s ease-in-out infinite 0.1s; }
    .mini-bar:nth-child(3) { animation: vu5 0.9s ease-in-out infinite 0.05s; }
    .mini-bar:nth-child(4) { animation: vu2 0.6s ease-in-out infinite 0.15s; }
  `],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="page-eyebrow">▶ Broadcast Network</div>
        <h1 class="page-title">Channels</h1>
        <p class="page-sub">Six AI-curated stations. One DJ per channel. Always live.</p>
      </div>

      <div class="grid">
        @for (ch of channels(); track ch.id) {
          <div class="ch-card" [class.active]="active()?.id === ch.id" (click)="selectChannel(ch)">
            <div class="ch-glow" [style.background]="'radial-gradient(ellipse at 30% 30%, ' + ch.color + '18, transparent 70%)'"></div>

            <span class="ch-emoji">{{ ch.emoji }}</span>

            <div class="ch-top">
              <div class="ch-name">{{ ch.name }}</div>
              @if (active()?.id === ch.id) {
                <div class="live-badge"><span class="live-dot"></span>LIVE</div>
              }
            </div>

            <div class="ch-desc">{{ ch.description }}</div>

            <div class="ch-meta">
              <span [style.color]="ch.color">{{ ch.genre }}</span>
              <span class="ch-meta-sep">·</span>
              <span class="ch-listeners">{{ ch.listeners }}</span>
              <div class="mini-bars">
                <div class="mini-bar" [style.background]="ch.color"></div>
                <div class="mini-bar" [style.background]="ch.color"></div>
                <div class="mini-bar" [style.background]="ch.color"></div>
                <div class="mini-bar" [style.background]="ch.color"></div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ChannelsComponent {
  active = signal<Channel | null>(null);
  channels = signal<Channel[]>([
    { id:'chill',     name:'Chill Lounge',    genre:'Lo-Fi / Ambient',       description:'Laid-back AI beats engineered for deep focus and late-night sessions.',    emoji:'🌙', color:'#818cf8', listeners:142 },
    { id:'synthwave', name:'Neon Nights',      genre:'Synthwave / Retro',     description:'Retro-futuristic synths and driving rhythms straight from 2089.',           emoji:'🌆', color:'#f472b6', listeners:89  },
    { id:'jazz',      name:'Midnight Jazz',    genre:'Jazz / Neo-Soul',       description:'AI-improvised smooth grooves and neo-soul for the quiet hours.',             emoji:'🎷', color:'#fbbf24', listeners:61  },
    { id:'edm',       name:'Electric Grid',    genre:'EDM / House',           description:'High-energy AI-generated drops and festival-ready anthems around the clock.',emoji:'⚡', color:'#34d399', listeners:207 },
    { id:'classical', name:'AI Philharmonic',  genre:'Classical / Cinematic', description:'Fully AI-composed orchestral works and cinematic soundscapes.',             emoji:'🎻', color:'#a78bfa', listeners:38  },
    { id:'hiphop',    name:'Digital Cipher',   genre:'Hip-Hop / Beats',       description:'Boom-bap, trap and AI-generated lyricism — bars written by a machine.',    emoji:'🎤', color:'#fb923c', listeners:174 },
  ]);
  selectChannel(ch: Channel) { this.active.set(ch); }
}
