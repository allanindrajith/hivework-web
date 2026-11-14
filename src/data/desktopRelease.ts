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

export const MAC_QUARANTINE_CMD = 'xattr -cr /Applications/Hivework.app';

export const MAC_AGENT_INSTALL_PROMPT =
  'Install the downloaded Hivework app by copying it to /Applications and run "xattr -cr /Applications/Hivework.app" in Terminal to bypass macOS Gatekeeper.';

