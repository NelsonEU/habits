import { fileNameOf, incomingFileUri, isInboxCopy } from './incoming';

const shared = 'file:///private/var/mobile/Containers/Data/Application/ABC/Documents/Inbox/daygraph-backup-2026-10-07%2016:53:23.003108.json';

test('recognizes a shared file, and nothing else', () => {
  expect(incomingFileUri(shared)).toBe(shared);
  expect(incomingFileUri('content://com.android.providers.downloads/document/42')).not.toBeNull();
  expect(incomingFileUri('/stats/3')).toBeNull();
  expect(incomingFileUri('habitudes://settings')).toBeNull();
});

test('fileNameOf decodes the name for display', () => {
  expect(fileNameOf(shared)).toBe('daygraph-backup-2026-10-07 16:53:23.003108.json');
  expect(fileNameOf('file:///Inbox/bad%E0.json')).toBe('bad%E0.json');
});

test("deletes only iOS's Inbox copy, never the user's own file", () => {
  expect(isInboxCopy(shared)).toBe(true);
  expect(isInboxCopy('content://com.android.providers.downloads/document/42')).toBe(false);
  expect(isInboxCopy('file:///private/var/mobile/Documents/backup.json')).toBe(false);
});
