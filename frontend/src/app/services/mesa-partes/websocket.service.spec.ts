import { TestBed } from '@angular/core/testing';
import { WebSocketService } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be connected initially', () => {
    expect(service.isConnected()).toBeFalsy();
  });

  it('should emit connection status changes', (done) => {
    service.getConnectionStatus().subscribe(status => {
      expect(status).toBeDefined();
      expect(status.connected).toBeDefined();
      expect(status.reconnecting).toBeDefined();
      done();
    });
  });
});
