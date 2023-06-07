import type { ConsoleEvents, TypedEventEmitter } from './event-emitter';
import { stringifyWithCatch } from '../utils/json-utils';
import { dateWithCatch, fixStringLength } from '../utils/functions';
import { appendMultiline } from '../utils/string-utils';

const defaultLine = (date: string, level: string, message: string) => {
  return appendMultiline(`FROM CHROME >> ${date} | ${fixStringLength(level)} | `, message.trim());
};

export const defaultHandlers = (event: keyof ConsoleEvents, eventEm: TypedEventEmitter<ConsoleEvents>) => {
  switch (event) {
    case 'exception': {
      eventEm.on('exception', res => {
        const message = [res.message, `  ${res.stack ?? res.fullMessage}`].join('\n');
        console.error(defaultLine(res.date, 'UNCAUGHT', message));
      });
      break;
    }

    case 'warn': {
      eventEm.on('warn', res => {
        const message = res.stack ? [res.message, `  ${res.stack}`].join('\n') : res.message;
        console.warn(defaultLine(res.date, res.logType, message));
      });
      break;
    }

    case 'error': {
      eventEm.on('error', res => {
        const message = res.stack ? [res.message, `  ${res.stack}`].join('\n') : res.message;
        console.error(defaultLine(res.date, res.logType, message));
      });
      break;
    }

    case 'trace':
    case 'table':
    case 'debug':

    case 'log': {
      eventEm.on(event, res => {
        console.log(defaultLine(res.date, res.logType, res.message));
      });
      break;
    }

    case 'test:log': {
      eventEm.on('test:log', res => {
        const command = res.command ? `command: ${res.command} ->` : '';
        const details = res.details ? ` | details: ${res.details}` : '';
        const message = `${command} ${res.message}${details}`;
        console.log(defaultLine(res.date, res.logType, message));
      });
      break;
    }

    default: {
      eventEm.on(event, res => {
        console.log(defaultLine(dateWithCatch(Date.now()), 'unknown', stringifyWithCatch(res)));
      });
      break;
    }
  }
};
