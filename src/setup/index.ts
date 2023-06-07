import { wrapLogs } from '../logging/wrap-log';

export type RedirectLogsConfig = {
  isLogCommandDetails?: boolean;
};

export const redirectTestLogs = (config?: RedirectLogsConfig) => {
  const details = config?.isLogCommandDetails === undefined ? false : config?.isLogCommandDetails;
  wrapLogs({ isLogDetails: details });
};
