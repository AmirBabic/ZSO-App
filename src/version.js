import { execFileSync } from 'node:child_process';

function readGitValue(args, fallback) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return fallback;
  }
}

export function createVersionInfo({ appVersion, contentVersion }) {
  const commit = process.env.GIT_COMMIT
    || readGitValue(['rev-parse', '--short', 'HEAD'], 'unknown');
  const buildTimestamp = process.env.BUILD_TIMESTAMP
    || readGitValue(['show', '-s', '--format=%cI', 'HEAD'], new Date().toISOString());

  return {
    appVersion,
    buildTimestamp,
    commit,
    contentVersion,
    cacheVersion: `${appVersion}-${commit}-${contentVersion}`
      .replaceAll(/[^a-zA-Z0-9._-]/g, '-')
  };
}
