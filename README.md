# Notify Approver of Unresolved Threads

A GitHub Action that notifies PR reviewers who approved with unresolved review threads, encouraging them to resolve their own conversations.

## Features

- ✅ Automatically checks for unresolved threads after a review is approved
- ✅ Filters to show only threads started by the approver
- ✅ Posts a friendly reminder comment with links to unresolved threads
- ✅ Configurable wait time before checking threads
- ✅ Handles pagination for PRs with many threads

## Usage

### Basic Usage

```yaml
name: Check Unresolved Threads

on:
  pull_request_review:
    types: [submitted]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: kreuz123/notify-unresolved-threads-action@v1
        with:
          token: ${{ github.token }}

