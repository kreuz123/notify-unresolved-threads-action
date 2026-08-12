const { formatThreadList } = require('../src/format-threads');

describe('formatThreadList', () => {
  test('formats threads with preview and links', () => {
    const threads = [
      {
        comments: {
          nodes: [
            {
              body: 'This is a comment that is longer than seventy characters to test truncation',
              url: 'https://github.com/owner/repo/pull/1#discussion_r1'
            }
          ]
        }
      }
    ];

    const result = formatThreadList(threads);

    expect(result).toContain('1. [View thread]');
    expect(result).toContain('This is a comment that is longer than seventy characters to test trunc...');
    expect(result).toContain('https://github.com/owner/repo/pull/1#discussion_r1');
  });

  test('does not add ellipsis for short comments', () => {
    const threads = [
      {
        comments: {
          nodes: [
            {
              body: 'Short comment',
              url: 'https://github.com/owner/repo/pull/1#discussion_r1'
            }
          ]
        }
      }
    ];

    const result = formatThreadList(threads);

    expect(result).not.toContain('...');
    expect(result).toContain('Short comment');
  });

  test('indexes threads correctly', () => {
    const threads = Array(3)
      .fill(null)
      .map((_, i) => ({
        comments: {
          nodes: [
            {
              body: `Comment ${i + 1}`,
              url: `https://github.com/owner/repo/pull/1#discussion_r${i + 1}`
            }
          ]
        }
      }));

    const result = formatThreadList(threads);
    const lines = result.split('\n');

    expect(lines[0]).toContain('1. [View thread]');
    expect(lines[1]).toContain('2. [View thread]');
    expect(lines[2]).toContain('3. [View thread]');
  });
});
