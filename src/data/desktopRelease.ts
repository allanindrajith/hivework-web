import updaterConfig from '../../public/updater.json';

export interface DesktopReleaseInfo {
  version: string;
  displayVersion: string;
  dmgUrl: string;
}

const rawVersion = typeof updaterConfig?.version === 'string' ? updaterConfig.version.trim() : '0.4.0';

export const desktopRelease: DesktopReleaseInfo = {
  version: rawVersion,
  displayVersion: rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`,
  dmgUrl: 'https://github.com/allanindrajith/hivework-app/releases/latest',
};
