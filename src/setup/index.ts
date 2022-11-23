import { wrapLogs } from '../logging/wrap-log';

export type RedirectLogsConfig = {
  isLogFromTest?:
    | false
    | {
        isLogCommandDetails: boolean;
      };
};

export const redirectLogsBrowser = (config?: RedirectLogsConfig) => {
  if (config?.isLogFromTest) {
    wrapLogs({ isLogDetails: config.isLogFromTest.isLogCommandDetails });
  }
};
