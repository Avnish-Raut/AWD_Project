import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";

export interface Log {
  log_id: number;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  created_at: string;
  user_id: number | null;
  user?: {
    username: string;
    email: string;
  } | null;
}

export interface LogsResponse {
  logs: Log[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: "root"
})
export class LogsService {
  private apiUrl = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient) {}

  getLogs(level?: string, offset?: number, limit?: number): Observable<LogsResponse> {
    let params = new HttpParams();
    
    if (level && level !== "ALL") params = params.set("level", level);
    if (offset !== undefined) params = params.set("offset", offset.toString());
    if (limit !== undefined) params = params.set("limit", limit.toString());
    
    return this.http.get<LogsResponse>(this.apiUrl, { params });
  }
}
