import { fileNameOf, incomingFileUri } from './incoming';

const shared = 'file:///private/var/mobile/Containers/Data/Application/ABC/Documents/Inbox/daygraph-backup-2026-10-07%2016:53:23.003108.json';

test('recognizes a shared file, and nothing else', () => {
  expect(incomingFileUri(shared)).toBe(shared);
  expect(incomingFileUri('/stats/3')).toBeNull();
  expect(incomingFileUri('habitudes://settings')).toBeNull();
});

test('fileNameOf decodes the name for display', () => {
  expect(fileNameOf(shared)).toBe('daygraph-backup-2026-10-07 16:53:23.003108.json');
  expect(fileNameOf('file:///Inbox/bad%E0.json')).toBe('bad%E0.json');
});
