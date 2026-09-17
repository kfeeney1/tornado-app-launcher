import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Android production acceptance documentation covers parity and device gates', async () => {
  const acceptance = await read('docs/android-production-acceptance.md');
  for (const requirement of [
    'Firebase startup/config',
    'Authentication/account',
    'Cloud profile/config sync',
    'Android Back/home exit',
    'Background/resume',
    'Native app/game launch',
    'Missing-app fallback',
    'Physical-device acceptance checklist',
    'Signing and distribution gate',
    'GO WITH DOCUMENTED LIMITATIONS',
  ]) {
    assert.match(acceptance, new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Android CI remains a blocking build-quality contract', async () => {
  const workflow = await read('.github/workflows/android-build.yml');
  for (const command of [
    'npm run lint -- --max-warnings=0',
    'tests/android-*.test.mjs tests/firebase-runtime.test.mjs',
    './gradlew testDebugUnitTest --no-daemon',
    './gradlew lintDebug --no-daemon',
    './gradlew assembleDebug --no-daemon',
  ]) {
    assert.ok(workflow.includes(command), `Android Build must include: ${command}`);
  }
});

test('Android release workflow packages both release distribution formats', async () => {
  const workflow = await read('.github/workflows/release-android.yml');
  assert.ok(workflow.includes('bundleRelease assembleRelease'));
  assert.ok(workflow.includes('android/app/build/outputs/bundle/release/*.aab'));
  assert.ok(workflow.includes('android/app/build/outputs/apk/release/*.apk'));
});

test('production signing remains external to repository source', async () => {
  const release = await read('docs/android-release.md');
  assert.match(release, /ANDROID_KEYSTORE_PATH/);
  assert.match(release, /ANDROID_KEYSTORE_PASSWORD/);
  assert.match(release, /ANDROID_KEY_ALIAS/);
  assert.match(release, /ANDROID_KEY_PASSWORD/);
});
