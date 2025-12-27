import { TestBed } from '@angular/core/testing';
import { ConfigService, CLAUDE_CONFIG, provideClaude } from './config.service';
import { DEFAULT_CONFIG } from '../models/config.models';

describe('ConfigService', () => {
  let service: ConfigService;

  describe('without injected config', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [ConfigService]
      });
      service = TestBed.inject(ConfigService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should use default config when no token provided', () => {
      const config = service.getConfig();
      expect(config.apiUrl).toBe(DEFAULT_CONFIG.apiUrl);
      expect(config.streaming).toBe(DEFAULT_CONFIG.streaming);
    });

    it('should return apiUrl from default config', () => {
      expect(service.apiUrl).toBe(DEFAULT_CONFIG.apiUrl);
    });

    it('should return undefined apiKey when not configured', () => {
      expect(service.apiKey).toBeUndefined();
    });
  });

  describe('with injected config', () => {
    const customConfig = {
      apiUrl: 'https://custom-api.example.com',
      apiKey: 'test-api-key-123',
      streaming: false
    };

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ConfigService,
          provideClaude(customConfig)
        ]
      });
      service = TestBed.inject(ConfigService);
    });

    it('should merge custom config with defaults', () => {
      const config = service.getConfig();
      expect(config.apiUrl).toBe(customConfig.apiUrl);
      expect(config.apiKey).toBe(customConfig.apiKey);
      expect(config.streaming).toBe(customConfig.streaming);
    });

    it('should return custom apiUrl', () => {
      expect(service.apiUrl).toBe(customConfig.apiUrl);
    });

    it('should return custom apiKey', () => {
      expect(service.apiKey).toBe(customConfig.apiKey);
    });
  });

  describe('setConfig', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [ConfigService]
      });
      service = TestBed.inject(ConfigService);
    });

    it('should update config with new values', () => {
      const newUrl = 'https://new-api.example.com';
      service.setConfig({ apiUrl: newUrl });

      expect(service.apiUrl).toBe(newUrl);
      // Deve manter outros valores
      expect(service.getConfig().streaming).toBe(DEFAULT_CONFIG.streaming);
    });

    it('should update multiple config values', () => {
      service.setConfig({
        apiUrl: 'https://updated.com',
        apiKey: 'new-key',
        streaming: false
      });

      const config = service.getConfig();
      expect(config.apiUrl).toBe('https://updated.com');
      expect(config.apiKey).toBe('new-key');
      expect(config.streaming).toBe(false);
    });
  });

  describe('getConfig', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [ConfigService]
      });
      service = TestBed.inject(ConfigService);
    });

    it('should return a copy of config (immutable)', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('provideClaude', () => {
    it('should create provider with CLAUDE_CONFIG token', () => {
      const config = { apiUrl: 'test' };
      const provider = provideClaude(config);

      expect(provider.provide).toBe(CLAUDE_CONFIG);
      expect(provider.useValue).toEqual(config);
    });
  });
});
