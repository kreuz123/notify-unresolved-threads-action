async function checkUnresolvedThreads(client, owner, repo, prNumber, reviewer) {
  const allThreads = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const { repository } = await client.graphql(
      `
        query($owner: String!, $repo: String!, $number: Int!, $after: String) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              reviewThreads(first: 100, after: $after) {
                nodes {
                  isResolved
                  comments(first: 1) {
                    nodes {
                      author {
                        login
                      }
                      body
                      url
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      `,
      {
        owner,
        repo,
        number: prNumber,
        after: endCursor,
      },
    );

    const threads = repository.pullRequest.reviewThreads.nodes;
    allThreads.push(...threads);

    hasNextPage = repository.pullRequest.reviewThreads.pageInfo.hasNextPage;
    endCursor = repository.pullRequest.reviewThreads.pageInfo.endCursor;
  }

  // Filter: unresolved threads started by this reviewer
  const unresolvedThreads = allThreads.filter((thread) => {
    return (
      !thread.isResolved &&
      thread.comments.nodes.length > 0 &&
      thread.comments.nodes[0]?.author?.login === reviewer
    );
  });

  return unresolvedThreads;
}

module.exports = { checkUnresolvedThreads };
