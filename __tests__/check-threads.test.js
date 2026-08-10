const { checkUnresolvedThreads } = require('../src/check-threads');

describe('checkUnresolvedThreads', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      graphql: jest.fn()
    };
  });

  test('returns empty array when no unresolved threads', async () => {
    mockClient.graphql.mockResolvedValue({
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: [],
            pageInfo: { hasNextPage: false, endCursor: null }
          }
        }
      }
    });

    const result = await checkUnresolvedThreads(
      mockClient,
      'owner',
      'repo',
      1,
      'reviewer'
    );

    expect(result).toEqual([]);
  });

  test('filters threads by reviewer and resolved status', async () => {
    mockClient.graphql.mockResolvedValue({
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: [
              {
                isResolved: false,
                comments: {
                  nodes: [
                    {
                      author: { login: 'reviewer' },
                      body: 'This needs fixing',
                      url: 'https://github.com/owner/repo/pull/1#discussion_r123'
                    }
                  ]
                }
              },
              {
                isResolved: true,
                comments: {
                  nodes: [
                    {
                      author: { login: 'reviewer' },
                      body: 'Already resolved',
                      url: 'https://github.com/owner/repo/pull/1#discussion_r124'
                    }
                  ]
                }
              },
              {
                isResolved: false,
                comments: {
                  nodes: [
                    {
                      author: { login: 'other-reviewer' },
                      body: 'Not from our reviewer',
                      url: 'https://github.com/owner/repo/pull/1#discussion_r125'
                    }
                  ]
                }
              }
            ],
            pageInfo: { hasNextPage: false, endCursor: null }
          }
        }
      }
    });

    const result = await checkUnresolvedThreads(
      mockClient,
      'owner',
      'repo',
      1,
      'reviewer'
    );

    expect(result).toHaveLength(1);
    expect(result[0].comments.nodes[0].author.login).toBe('reviewer');
  });

  test('handles pagination correctly', async () => {
    mockClient.graphql
      .mockResolvedValueOnce({
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  isResolved: false,
                  comments: {
                    nodes: [
                      {
                        author: { login: 'reviewer' },
                        body: 'Thread 1',
                        url: 'https://github.com/owner/repo/pull/1#discussion_r1'
                      }
                    ]
                  }
                }
              ],
              pageInfo: { hasNextPage: true, endCursor: 'cursor1' }
            }
          }
        }
      })
      .mockResolvedValueOnce({
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  isResolved: false,
                  comments: {
                    nodes: [
                      {
                        author: { login: 'reviewer' },
                        body: 'Thread 2',
                        url: 'https://github.com/owner/repo/pull/1#discussion_r2'
                      }
                    ]
                  }
                }
              ],
              pageInfo: { hasNextPage: false, endCursor: null }
            }
          }
        }
      });

    const result = await checkUnresolvedThreads(
      mockClient,
      'owner',
      'repo',
      1,
      'reviewer'
    );

    expect(result).toHaveLength(2);
    expect(mockClient.graphql).toHaveBeenCalledTimes(2);
  });
});
