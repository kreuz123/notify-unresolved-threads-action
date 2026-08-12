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
```

### Configuring the wait time and customizing the comment

Use `wait-seconds` to control how long the action waits before checking threads, and `comment-template` to change the wording of the reminder comment.

The template supports the following placeholders:

- `{reviewer}` — always renders as an `@mention` so the reviewer is notified. If omitted from your template, the mention is prepended automatically.
- `{unresolvedCount}` — the number of unresolved threads.
- `{threadList}` — the list of unresolved threads. If omitted from your template, the thread list is appended automatically so it's never lost.

```yaml
      - uses: kreuz123/notify-unresolved-threads-action@v1
        with:
          wait-seconds: 60
          comment-template: |
            Please resolve your {unresolvedCount} open conversation(s) before we can merge.

            {threadList}
```

## Inputs

| Name          | Required | Default            | Description                              |
| ------------- | -------- | ------------------- | ---------------------------------------- |
| `token`       | No       | `${{ github.token }}` | Token used to read threads and post the comment. Override only for a PAT or GitHub App token. |
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
