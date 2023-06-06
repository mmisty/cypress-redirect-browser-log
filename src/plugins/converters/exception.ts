import type { Runtime } from 'inspector';
import { dateWithCatch } from '../../utils/functions';

export type ExceptionRes = {
  timestamp: number;
  date: string;
  message: string;
  fullMessage: string;
  logType: string;
  stack?: string;
};

export function isRuntimeException(obj: unknown): obj is Runtime.ExceptionThrownEventDataType {
  return !!obj && typeof obj === 'object' && Object.getOwnPropertyNames(obj).includes('exceptionDetails');
}

export const getExceptionDetails = (params: Runtime.ExceptionThrownEventDataType): ExceptionRes => {
  const { exceptionDetails, timestamp } = params as Runtime.ExceptionThrownEventDataType;

  const exception = exceptionDetails.exception?.description;
  const stackStarts = exception?.indexOf(' at ');
  const messageIndex = stackStarts !== -1 ? stackStarts : exception?.length;
  const message = exception?.slice(0, messageIndex).trim() ?? '';
  const stack = exception?.slice(stackStarts)?.trim() ?? undefined;

  return {
    timestamp,
    date: dateWithCatch(timestamp),
    message,
    fullMessage: exception ?? '',
    logType: exceptionDetails.text,
    stack: stack,
  };
};
