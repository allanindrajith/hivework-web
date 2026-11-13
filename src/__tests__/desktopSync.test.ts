import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { machoArchs, syncDesktopApp } from '../../scripts/sync-catalog.mjs';

const THIN_ARM64 = Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0x0c, 0x00, 0x00, 0x01, 0, 0, 0, 0]);
const THIN_X86_64 = Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0x07, 0x00, 0x00, 0x01, 0, 0, 0, 0]);

function fatBinary(cpuTypes: number[]): Buffer {
  const buf = Buffer.alloc(8 + cpuTypes.length * 20);
  buf.writeUInt32BE(0xcafebabe, 0);
  buf.writeUInt32BE(cpuTypes.length, 4);
  cpuTypes.forEach((cpu, i) => buf.writeUInt32BE(cpu, 8 + i * 20));
  return buf;
}

let tmp: string;
let webDir: string;
let bundleDir: string;

function writeAppFixture(binary: Buffer, { withSig = true }: { withSig?: boolean } = {}) {
  const appRoot = path.join(tmp, 'Hivework-app/src-tauri');
  bundleDir = path.join(appRoot, 'target/release/bundle');
  fs.mkdirSync(path.join(bundleDir, 'dmg'), { recursive: true });
  fs.mkdirSync(path.join(bundleDir, 'macos'), { recursive: true });
  fs.writeFileSync(
    path.join(appRoot, 'tauri.conf.json'),
    JSON.stringify({ version: '0.5.0', plugins: { updater: { endpoints: ['https://example.test/updater.json'] } } })
  );
  fs.writeFileSync(path.join(bundleDir, 'dmg/Hivework_0.5.0_aarch64.dmg'), 'dmg-bytes');

  const stage = path.join(tmp, 'stage');
  fs.mkdirSync(path.join(stage, 'Hivework.app/Contents/MacOS'), { recursive: true });
  fs.writeFileSync(path.join(stage, 'Hivework.app/Contents/MacOS/hivework-app'), binary);
  const tarPath = path.join(bundleDir, 'macos/Hivework.app.tar.gz');
  execFileSync('tar', ['-czf', tarPath, '-C', stage, 'Hivework.app']);
  if (withSig) fs.writeFileSync(`${tarPath}.sig`, 'SIGNATURE-B64\n');
}

function readUpdater() {
  return JSON.parse(fs.readFileSync(path.join(webDir, 'public/updater.json'), 'utf8'));
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hivework-desktop-'));
  webDir = path.join(tmp, 'web');
  fs.mkdirSync(path.join(webDir, 'public'), { recursive: true });
  fs.writeFileSync(
    path.join(webDir, 'public/updater.json'),
    JSON.stringify({ version: '0.4.0', notes: 'Release notes', pub_date: '2026-01-01T00:00:00Z', platforms: {} })
  );
});

afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('machoArchs', () => {
  it('reads thin and fat Mach-O headers', () => {
    expect(machoArchs(THIN_ARM64)).toEqual(['aarch64']);
    expect(machoArchs(THIN_X86_64)).toEqual(['x86_64']);
    expect(machoArchs(fatBinary([0x0100000c, 0x01000007]))).toEqual(['aarch64', 'x86_64']);
    expect(machoArchs(Buffer.from('not a binary'))).toEqual([]);
  });
});

describe('syncDesktopApp', () => {
  it('publishes the versioned DMG and signed bundle, and lists only the binary architectures', () => {
    writeAppFixture(THIN_ARM64);
    syncDesktopApp(webDir);

    expect(fs.readFileSync(path.join(webDir, 'public/downloads/Hivework.dmg'), 'utf8')).toBe('dmg-bytes');
    expect(fs.existsSync(path.join(webDir, 'public/downloads/Hivework.app.tar.gz'))).toBe(true);

    const updater = readUpdater();
    expect(updater.version).toBe('0.5.0');
    expect(updater.notes).toBe('Release notes');
    expect(Object.keys(updater.platforms)).toEqual(['darwin-aarch64']);
    expect(updater.platforms['darwin-aarch64']).toEqual({
      signature: 'SIGNATURE-B64',
      url: 'https://example.test/downloads/Hivework.app.tar.gz',
    });
  });

  it('lists both macOS platforms for a universal binary', () => {
    writeAppFixture(fatBinary([0x0100000c, 0x01000007]));
    syncDesktopApp(webDir);
    expect(Object.keys(readUpdater().platforms).sort()).toEqual(['darwin-aarch64', 'darwin-x86_64']);
  });

  it('refuses a signature older than the bundle (rebuilt without the signing key)', () => {
    writeAppFixture(THIN_ARM64);
    const sig = path.join(bundleDir, 'macos/Hivework.app.tar.gz.sig');
    const old = new Date(Date.now() - 60 * 60 * 1000);
    fs.utimesSync(sig, old, old);
    syncDesktopApp(webDir);
    expect(readUpdater().version).toBe('0.4.0');
    expect(fs.existsSync(path.join(webDir, 'public/downloads/Hivework.app.tar.gz'))).toBe(false);
  });

  it('refuses to publish an update bundle without a signature', () => {
    writeAppFixture(THIN_ARM64, { withSig: false });
    syncDesktopApp(webDir);
    expect(readUpdater().version).toBe('0.4.0');
    expect(fs.existsSync(path.join(webDir, 'public/downloads/Hivework.app.tar.gz'))).toBe(false);
  });
});
