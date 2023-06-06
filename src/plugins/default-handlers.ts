import type { ConsoleEvents, TypedEventEmitter } from './event-emitter';
import { stringifyWithCatch } from '../utils/json-utils';

const prefix = () => 'FROM CHROME >> ';

export const defaultHandlers = (event: keyof ConsoleEvents, eventEm: TypedEventEmitter<ConsoleEvents>) => {
  switch (event) {
    case 'exception': {
      eventEm.on('exception', res => {
        console.error(`${prefix()} ${res.date} | UNCAUGHT | ${res.message}`);
        console.error(`${prefix()} ${res.date} | UNCAUGHT |   ${res.stack ?? res.fullMessage}`);
      });
      break;
    }

    case 'warn': {
      eventEm.on('warn', res => {
        console.warn(`${prefix()} ${res.date} | ${res.logType} | ${res.message}`);

        if (res.stack) {
          console.warn(`${prefix()} ${res.date} | ${res.logType} | ${res.stack}`);
        }
      });
      break;
    }

    case 'error': {
      eventEm.on('error', res => {
        console.error(`${prefix()} ${res.date} | ${res.logType} | ${res.message}`);

        if (res.stack) {
          console.error(`${prefix()} ${res.date} | ${res.logType} | ${res.stack}`);
        }
      });
      break;
    }

    case 'trace':
    case 'table':
    case 'debug':

    case 'log': {
      eventEm.on(event, res => {
        console.log(`${prefix()} ${res.date} | ${res.logType} | ${res.message}`);
      });
      break;
    }

    case 'test:log': {
      eventEm.on('test:log', res => {
        const command = res.command ? `command: ${res.command} ->` : '';
        const details = res.details ? ` | details: ${res.details}` : '';
        console.log(`${prefix()} ${res.date} | ${res.logType} | ${command} ${res.message}${details}`);
      });
      break;
    }

    default: {
      eventEm.on(event, res => {
        console.log(`${prefix()} ${stringifyWithCatch(res)}`);
      });
      break;
    }
  }
};
