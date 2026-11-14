import { useEffect, useState } from 'react';
import { desktopRelease, type DesktopReleaseInfo } from '../data/desktopRelease';

export function useDesktopRelease(): DesktopReleaseInfo {
  const [release, setRelease] = useState<DesktopReleaseInfo>(desktopRelease);

  useEffect(() => {
    let cancelled = false;

    fetch('./updater.json', { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data && typeof data.version === 'string' && data.version.trim().length > 0) {
          const raw = data.version.trim();
          setRelease({
            version: raw,
            displayVersion: raw.startsWith('v') ? raw : `v${raw}`,
            dmgUrl: 'https://github.com/allanindrajith/hivework-app/releases/latest',
          });
        }
      })
      .catch(() => {
        // Fall back gracefully to bundled metadata
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return release;
}
