import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LeaderboardEntry {
  rank: number;
  address: string;
  alias: string;
  totalMints: number;
  totalVerificationsReceived: number;
  tier: number;
  tierLabel: string;
  score: number;
  isSeed: boolean;
}

export interface ArtistStats {
  address: string;
  alias: string | null;
  totalMints: number;
  totalVerificationsGiven: number;
  totalVerificationsReceived: number;
  tier: number;
  stakeBalance: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard`);
  }

  getArtistStats(address: string): Observable<ArtistStats> {
    return this.http.get<ArtistStats>(`${this.baseUrl}/artists/${address}/stats`);
  }

  getCertificate(tokenId: number): string {
    return `${this.baseUrl}/certificate/${tokenId}`;
  }

  healthCheck(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.baseUrl}/health`);
  }
}
