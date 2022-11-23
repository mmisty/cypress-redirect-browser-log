export const stringifyWithCatch = (obj: unknown, indent = false, whenErr = 'Could not stringify'): string => {
  try {
    return JSON.stringify(obj, null, indent ? '  ' : 0);
  } catch (e) {
    return whenErr;
  }
};

export const tryParseJson = <T, K = T>(
  str: string,
  callBackSuccess: (parsed: T) => K = (p: T) => (p as unknown) as K,
  callBackFail: () => K | null = () => null,
): K | null => {
  let parsed;

  try {
    parsed = JSON.parse(str);
  } catch (err) {
    return callBackFail();
  }

  return callBackSuccess(parsed);
};
