import { Injectable } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  observable?: Observable<T>;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or execute the provided function
   */
  get<T>(key: string, fetchFn: () => Observable<T>, ttl: number = this.defaultTTL): Observable<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if valid
    if (cached && (now - cached.timestamp) < ttl) {
      if (cached.observable) {
        return cached.observable;
      }
      return of(cached.data);
    }

    // Fetch new data
    const observable = fetchFn().pipe(
      shareReplay(1)
    );

    // Store observable to prevent duplicate requests
    this.cache.set(key, {
      data: null as any,
      timestamp: now,
      observable
    });

    // Subscribe to store the actual data
    observable.subscribe(data => {
      this.cache.set(key, {
        data,
        timestamp: now
      });
    });

    return observable;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    Array.from(this.cache.keys())
      .filter(key => regex.test(key))
      .forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries())
      .filter(([_, entry]) => (now - entry.timestamp) > this.defaultTTL)
      .forEach(([key]) => this.cache.delete(key));
  }
}
