const core = require("@actions/core");
const github = require("@actions/github");
const { checkUnresolvedThreads } = require("./src/check-threads");
const { formatThreadList } = require("./src/format-threads");
const { buildCommentBody } = require("./src/build-comment");

async function run() {
  try {
    // Get inputs
    const token = core.getInput("token");
    const waitSecondsInput = core.getInput("wait-seconds").trim();
    const waitSeconds = Number(waitSecondsInput);

    if (!/^\d+$/.test(waitSecondsInput) || !Number.isSafeInteger(waitSeconds)) {
      throw new Error('Input "wait-seconds" must be a non-negative integer.');
    }

    const commentTemplate = core.getInput("comment-template");

    // Get context
    const context = github.context;
    const client = github.getOctokit(token);

    // Check if this is an approved review before waiting
    if (context.payload.review?.state !== "approved") {
      core.info("Review is not approved. Skipping thread check.");
      return;
    }

    // Wait as configured
    if (waitSeconds > 0) {
      core.info(`Waiting ${waitSeconds} seconds before checking threads...`);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    }

    const reviewer = context.payload.review.user.login;
    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request.number;

    // Re-fetch the reviewer's current state after the wait, in case it changed
    const { data: reviews } = await client.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });
    const latestReview = reviews
      .filter((r) => r.user.login === reviewer)
      .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
      .pop();
    if (latestReview?.state !== "APPROVED") {
      core.info(
        "Reviewer's latest review state is no longer approved. Skipping thread check.",
      );
      return;
    }

    core.info(`Checking unresolved threads for reviewer: ${reviewer}`);

    // Fetch and check threads
    const unresolvedThreads = await checkUnresolvedThreads(
      client,
      owner,
      repo,
      prNumber,
      reviewer,
    );

    if (unresolvedThreads.length === 0) {
      core.info("No unresolved threads found.");
      core.setOutput("reviewer", reviewer);
      core.setOutput("unresolvedCount", "0");
      core.setOutput("threadList", "");
      return;
    }

    // Format output
    const threadList = formatThreadList(unresolvedThreads);

    // Set outputs
    core.setOutput("reviewer", reviewer);
    core.setOutput("unresolvedCount", unresolvedThreads.length.toString());
    core.setOutput("threadList", threadList);

    // Post comment
    const commentBody = buildCommentBody(commentTemplate, {
      reviewer,
      unresolvedCount: unresolvedThreads.length,
      threadList,
    });

    await client.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: commentBody,
    });

    core.info(
      `Comment posted successfully. Notified ${reviewer} of ${unresolvedThreads.length} unresolved thread(s).`,
    );
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
