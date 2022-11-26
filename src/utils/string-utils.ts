import type { Runtime } from 'inspector';

export const appendMultiline = (addition: string, message: string): string => {
  if (message.indexOf('\n') !== -1) {
    return message
      .split('\n')
      .map(line => `${addition}${line}`)
      .join('\n');
  }

  return `${addition} ${message}`;
};

export const stringifyStack = (callFrames?: Runtime.CallFrame[]): string | undefined =>
  callFrames?.map(c => `at ${c.url}:${c.lineNumber} (${c.functionName})`).join('\n');
