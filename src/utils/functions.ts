export const getMatches = (str: string, regexp: RegExp): string[][] => {
  if (regexp.flags.indexOf('g') === -1) {
    throw new Error('Specify global flag (g) for regexp in getMatches func');
  }
  const matches: string[][] = [];

  let match = regexp.exec(str);

  if (match) {
    matches.push(match.slice(1));
  }

  while (match != null) {
    match = regexp.exec(str);

    if (match) {
      matches.push(match.slice(1));
    }
  }

  return matches;
};

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const parseBoolean = (check: string | boolean | undefined): boolean | undefined => {
  switch (typeof check) {
    case 'undefined':
      return undefined;

    case 'boolean':
      return check;

    case 'string': {
      const res = () => {
        try {
          return JSON.parse(check.toLowerCase());
        } catch (e) {
          throw new Error(`Could not parse boolean from string: '${check.toLowerCase()}'`);
        }
      };
      const result = res();

      if (typeof result !== 'boolean') {
        throw new Error('String should have boolean value');
      }

      return result;
    }

    default:
      throw new Error(`Error during parsing boolean: unexpected type of value: ${typeof check}`);
  }
};

export const dateWithCatch = (timestamp: number): string => {
  try {
    return `${new Date(timestamp).toISOString()}`;
  } catch (e) {
    return '<could nod parse date>';
  }
};
