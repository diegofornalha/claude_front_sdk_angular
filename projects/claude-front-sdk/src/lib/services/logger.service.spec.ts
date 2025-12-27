import { TestBed } from '@angular/core/testing';
import { LoggerService, LOGGER_ENABLED } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  describe('when enabled (development mode)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LoggerService,
          { provide: LOGGER_ENABLED, useValue: true }
        ]
      });
      service = TestBed.inject(LoggerService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should call console.debug for debug()', () => {
      spyOn(console, 'debug');
      service.debug('TestContext', 'test message', { data: 123 });
      expect(console.debug).toHaveBeenCalledWith('[TestContext]', 'test message', { data: 123 });
    });

    it('should call console.info for info()', () => {
      spyOn(console, 'info');
      service.info('TestContext', 'info message');
      expect(console.info).toHaveBeenCalledWith('[TestContext]', 'info message');
    });

    it('should call console.warn for warn()', () => {
      spyOn(console, 'warn');
      service.warn('TestContext', 'warning message');
      expect(console.warn).toHaveBeenCalledWith('[TestContext]', 'warning message');
    });

    it('should call console.error for error()', () => {
      spyOn(console, 'error');
      service.error('TestContext', 'error message');
      expect(console.error).toHaveBeenCalledWith('[TestContext]', 'error message');
    });

    it('should call console.group for group()', () => {
      spyOn(console, 'group');
      service.group('Test Group');
      expect(console.group).toHaveBeenCalledWith('Test Group');
    });

    it('should call console.groupEnd for groupEnd()', () => {
      spyOn(console, 'groupEnd');
      service.groupEnd();
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('when disabled (production mode)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LoggerService,
          { provide: LOGGER_ENABLED, useValue: false }
        ]
      });
      service = TestBed.inject(LoggerService);
    });

    it('should NOT call console.debug for debug()', () => {
      spyOn(console, 'debug');
      service.debug('TestContext', 'test message');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should NOT call console.info for info()', () => {
      spyOn(console, 'info');
      service.info('TestContext', 'info message');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should STILL call console.warn for warn()', () => {
      spyOn(console, 'warn');
      service.warn('TestContext', 'warning message');
      expect(console.warn).toHaveBeenCalledWith('[TestContext]', 'warning message');
    });

    it('should STILL call console.error for error()', () => {
      spyOn(console, 'error');
      service.error('TestContext', 'error message');
      expect(console.error).toHaveBeenCalledWith('[TestContext]', 'error message');
    });

    it('should NOT call console.group for group()', () => {
      spyOn(console, 'group');
      service.group('Test Group');
      expect(console.group).not.toHaveBeenCalled();
    });

    it('should NOT call console.groupEnd for groupEnd()', () => {
      spyOn(console, 'groupEnd');
      service.groupEnd();
      expect(console.groupEnd).not.toHaveBeenCalled();
    });
  });

  describe('with multiple arguments', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LoggerService,
          { provide: LOGGER_ENABLED, useValue: true }
        ]
      });
      service = TestBed.inject(LoggerService);
    });

    it('should pass all arguments to console methods', () => {
      spyOn(console, 'debug');
      const obj = { key: 'value' };
      const arr = [1, 2, 3];

      service.debug('Context', 'message', obj, arr, 42, true);

      expect(console.debug).toHaveBeenCalledWith(
        '[Context]', 'message', obj, arr, 42, true
      );
    });
  });
});
