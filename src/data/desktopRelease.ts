import updaterConfig from '../../public/updater.json';

export interface DesktopReleaseInfo {
  version: string;
  displayVersion: string;
  dmgUrl: string;
  windowsUrl: string;
}

const rawVersion = typeof updaterConfig?.version === 'string' ? updaterConfig.version.trim() : '0.4.0';

export const desktopRelease: DesktopReleaseInfo = {
  version: rawVersion,
  displayVersion: rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`,
  dmgUrl: 'https://github.com/allanindrajith/hivework-app/releases/latest',
  windowsUrl: 'https://github.com/allanindrajith/hivework-app/releases/latest',
};

export const MAC_QUARANTINE_CMD = 'xattr -cr /Applications/Hivework.app';

export const MAC_AGENT_INSTALL_PROMPT =
  'Install the downloaded Hivework app by copying it to /Applications and run "xattr -cr /Applications/Hivework.app" in Terminal to bypass macOS Gatekeeper.';

export const WIN_UNBLOCK_CMD = 'Unblock-File .\\Hivework_0.4.0_x64-setup.exe';

export const WIN_AGENT_INSTALL_PROMPT =
  'Run the downloaded Hivework Windows installer (Hivework_0.4.0_x64-setup.exe). If Windows Defender SmartScreen blocks it, click "More info" and "Run anyway", or run "Unblock-File .\\Hivework_0.4.0_x64-setup.exe" in PowerShell.';
