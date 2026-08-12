# Notify Approver of Unresolved Threads

A GitHub Action that notifies PR reviewers who approved with unresolved review threads, encouraging them to resolve their own conversations.

## Features

- ✅ Automatically checks for unresolved threads after a review is approved
- ✅ Filters to show only threads started by the approver
- ✅ Posts a friendly reminder comment with links to unresolved threads
- ✅ Configurable wait time before checking threads
- ✅ Customizable comment template
- ✅ Handles pagination for PRs with many threads

## How it works

1. Triggers when a PR review is **submitted**.
2. Waits `wait-seconds` (GitHub needs a moment to register the review's thread state).
3. Skips silently unless the review `state` is `approved`.
4. Fetches all review threads (with pagination) and keeps the unresolved ones started by the approving reviewer.
5. Posts a comment on the PR mentioning the reviewer, listing their unresolved threads.

## Usage

### Basic Usage

```yaml
name: Check Unresolved Threads

on:
  pull_request_review:
    types: [submitted]

permissions:
  contents: read
  pull-requests: write

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: kreuz123/notify-unresolved-threads-action@v1
        with:
          token: ${{ github.token }}
```

### Using the outputs

```yaml
      - uses: kreuz123/notify-unresolved-threads-action@v1
        id: notify
        with:
          token: ${{ github.token }}

      - run: |
          echo "Reviewer: ${{ steps.notify.outputs.reviewer }}"
          echo "Unresolved count: ${{ steps.notify.outputs.unresolvedCount }}"
          echo "Thread list: ${{ steps.notify.outputs.threadList }}"
```

### Customizing the comment

Use `comment-template` to change the wording of the reminder comment. The template supports the placeholders `{reviewer}`, `{unresolvedCount}`, and `{threadList}`. `{reviewer}` always renders as an `@mention` so the reviewer is notified; if you omit it, the mention is prepended automatically. If `{threadList}` is omitted from your template, the thread list is appended automatically so it's never lost.

```yaml
      - uses: kreuz123/notify-unresolved-threads-action@v1
        with:
          token: ${{ github.token }}
          comment-template: |
            Please resolve your {unresolvedCount} open conversation(s) before we can merge.

            {threadList}
```

## Inputs

| Name          | Required | Default            | Description                              |
| ------------- | -------- | ------------------- | ---------------------------------------- |
| `token`       | No       | `${{ github.token }}` | GitHub token used to read threads and post the comment. GitHub Actions provides this automatically, so you rarely need to pass it explicitly. |
| `wait-seconds` | No      | `45`                 | Seconds to wait before checking threads, to let GitHub finish registering thread state. |
| `comment-template` | No | See `action.yml` | Template for the reminder comment. Supports `{reviewer}`, `{unresolvedCount}`, and `{threadList}` placeholders. `{reviewer}` always renders as an `@mention`; if omitted, the mention is prepended automatically. If `{threadList}` isn't included, the thread list is appended automatically. |

## Outputs

| Name              | Description                                             |
| ----------------- | -------------------------------------------------------- |
| `reviewer`        | Username of the reviewer who approved.                    |
| `unresolvedCount` | Number of unresolved threads started by the reviewer.     |
| `threadList`       | Markdown-formatted list of unresolved threads (empty when none). |

## Required permissions

The workflow's `GITHUB_TOKEN` needs:

- `pull-requests: write` — to read review threads and post the reminder comment.
- `contents: read` — default checkout permission.

`issues: write` is **not** required; PR comments are covered by `pull-requests: write`.
