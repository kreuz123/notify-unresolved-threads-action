const { buildCommentBody } = require('../src/build-comment');

const DEFAULT_TEMPLATE =
  'You have approved this PR, but you also started {unresolvedCount} unresolved review thread(s). Please resolve your own conversations. Thank you!';

describe('buildCommentBody', () => {
  test('renders the default template and appends the thread list', () => {
    const result = buildCommentBody(DEFAULT_TEMPLATE, {
      reviewer: 'octocat',
      unresolvedCount: 2,
      threadList: '1. [View thread](url)'
    });

    expect(result).toBe(
      '@octocat You have approved this PR, but you also started 2 unresolved review thread(s). Please resolve your own conversations. Thank you!\n\n**Your unresolved review threads:**\n1. [View thread](url)'
    );
  });

  test('substitutes placeholders in a custom template', () => {
    const template = 'Hey! {unresolvedCount} thread(s) still open:\n{threadList}';

    const result = buildCommentBody(template, {
      reviewer: 'octocat',
      unresolvedCount: 3,
      threadList: '1. [View thread](url)'
    });

    expect(result).toBe('@octocat Hey! 3 thread(s) still open:\n1. [View thread](url)');
  });

  test('does not duplicate the thread list when {threadList} is present in the template', () => {
    const template = 'Threads: {threadList}';

    const result = buildCommentBody(template, {
      reviewer: 'octocat',
      unresolvedCount: 1,
      threadList: '1. [View thread](url)'
    });

    expect(result.match(/View thread/g)).toHaveLength(1);
  });

  test('renders {reviewer} as a mention and does not duplicate it', () => {
    const template = 'Please resolve your threads, {reviewer}.';

    const result = buildCommentBody(template, {
      reviewer: 'octocat',
      unresolvedCount: 1,
      threadList: '1. [View thread](url)'
    });

    expect(result).toContain('Please resolve your threads, @octocat.');
    expect(result.match(/@octocat/g)).toHaveLength(1);
    expect(result).toContain('**Your unresolved review threads:**\n1. [View thread](url)');
  });

  test('handles zero unresolved threads', () => {
    const template = '{unresolvedCount} unresolved thread(s) found.';

    const result = buildCommentBody(template, {
      reviewer: 'octocat',
      unresolvedCount: 0,
      threadList: ''
    });

    expect(result).toBe(
      '@octocat 0 unresolved thread(s) found.\n\n**Your unresolved review threads:**\n'
    );
  });

  test('leaves unknown placeholders untouched', () => {
    const template = 'Hello {unknown}, {unresolvedCount} thread(s).';

    const result = buildCommentBody(template, {
      reviewer: 'octocat',
      unresolvedCount: 1,
      threadList: 'x'
    });

    expect(result).toContain('Hello {unknown}, 1 thread(s).');
  });
});
