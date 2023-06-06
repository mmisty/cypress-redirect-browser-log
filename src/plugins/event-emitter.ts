import { EventEmitter } from 'events';
import type { ExceptionRes } from './converters/exception';
import type { TestLogEntry } from './converters/test-log';
import type { BrowserEntryRes } from './converters/browser-log';
import type { LogEntryRes } from './converters/console-log';

export type ConsoleEvents = {
  /**
   * Uncaught Exception from tested application that shown in console
   */
  exception: [err: ExceptionRes];

  /**
   * Error from tested application that shown in console
   */
  error: [res: LogEntryRes | BrowserEntryRes];

  /**
   * Warning from tested application that shown in console
   */
  warn: [res: LogEntryRes | BrowserEntryRes];

  /**
   * Log console event
   */
  log: [res: TestLogEntry | LogEntryRes | BrowserEntryRes];

  /**
   * Debug console event
   */
  debug: [res: TestLogEntry | LogEntryRes | BrowserEntryRes];

  /**
   * Trace console event
   */
  trace: [res: TestLogEntry | LogEntryRes | BrowserEntryRes];

  /**
   * Table console event
   */
  table: [res: TestLogEntry | LogEntryRes | BrowserEntryRes];

  /**
   * Event from test when redirect browser log are switched on in setup/e2e.ts with isLogFromTest  - true
   * @example:
   * redirectLogsBrowser({
   *   isLogFromTest: true,
   *   isLogCommandDetails: true,
   * });
   */
  'test:log': [res: TestLogEntry];
};

export class TypedEventEmitter<TEvents extends Record<string, any>> {
  private emitter = new EventEmitter();

  eventNames() {
    return this.emitter.eventNames();
  }

  emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
    this.emitter.emit(eventName, ...(eventArg as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void,
  ) {
    this.emitter.on(eventName, handler as any);
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void,
  ) {
    this.emitter.off(eventName, handler as any);
  }
}
