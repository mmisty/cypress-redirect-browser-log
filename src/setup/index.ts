import { wrapLogs } from '../logging/wrap-log';

export type RedirectLogsConfig = {
  isLogFromTest: boolean;
  isLogCommandDetails?: boolean;
};

export const redirectLogsBrowser = (config?: RedirectLogsConfig) => {
  if (config?.isLogFromTest) {
    wrapLogs({ isLogDetails: config.isLogCommandDetails });
  }
};
