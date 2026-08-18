jest.mock("@actions/core", () => ({
  getInput: jest.fn(),
  info: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
}));

jest.mock("@actions/github", () => ({
  context: {},
  getOctokit: jest.fn(),
}));

jest.mock("../src/check-threads", () => ({
  checkUnresolvedThreads: jest.fn(),
}));

jest.mock("../src/format-threads", () => ({
  formatThreadList: jest.fn(),
}));

jest.mock("../src/build-comment", () => ({
  buildCommentBody: jest.fn(),
}));

const core = require("@actions/core");
const github = require("@actions/github");
const { checkUnresolvedThreads } = require("../src/check-threads");
const { run } = require("../index");

describe("run", () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      paginate: jest.fn(),
      rest: {
        pulls: {
          listReviews: jest.fn(),
        },
        issues: {
          createComment: jest.fn(),
        },
      },
    };

    core.getInput.mockImplementation((name) => {
      if (name === "token") return "test-token";
      if (name === "wait-seconds") return "0";
      if (name === "comment-template") return "template";
      return "";
    });
    github.getOctokit.mockReturnValue(client);
    checkUnresolvedThreads.mockResolvedValue([]);
  });

  test("uses paginate and ignores non-submitted reviews", async () => {
    github.context = {
      payload: {
        review: {
          state: "approved",
          user: { login: "octocat" },
        },
        pull_request: { number: 123 },
      },
      repo: { owner: "owner", repo: "repo" },
    };

    client.paginate.mockResolvedValue([
      {
        user: { login: "octocat" },
        state: "APPROVED",
        submitted_at: "2026-01-01T00:00:00Z",
      },
      {
        user: { login: "octocat" },
        state: "PENDING",
        submitted_at: null,
      },
    ]);

    await run();

    expect(client.paginate).toHaveBeenCalledWith(client.rest.pulls.listReviews, {
      owner: "owner",
      repo: "repo",
      pull_number: 123,
      per_page: 100,
    });
    expect(checkUnresolvedThreads).toHaveBeenCalledTimes(1);
  });

  test("skips thread check when latest submitted review is not approved", async () => {
    github.context = {
      payload: {
        review: {
          state: "approved",
          user: { login: "octocat" },
        },
        pull_request: { number: 123 },
      },
      repo: { owner: "owner", repo: "repo" },
    };

    client.paginate.mockResolvedValue([
      {
        user: { login: "octocat" },
        state: "APPROVED",
        submitted_at: "2026-01-01T00:00:00Z",
      },
      {
        user: { login: "octocat" },
        state: "CHANGES_REQUESTED",
        submitted_at: "2026-01-02T00:00:00Z",
      },
      {
        user: { login: "octocat" },
        state: "PENDING",
        submitted_at: null,
      },
    ]);

    await run();

    expect(checkUnresolvedThreads).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(
      "Reviewer's latest review state is no longer approved. Skipping thread check.",
    );
  });

  test("skips everything when payload review state is not approved", async () => {
    github.context = {
      payload: {
        review: {
          state: "commented",
          user: { login: "octocat" },
        },
        pull_request: { number: 123 },
      },
      repo: { owner: "owner", repo: "repo" },
    };

    await run();

    expect(client.paginate).not.toHaveBeenCalled();
    expect(checkUnresolvedThreads).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(
      "Review is not approved. Skipping thread check.",
    );
  });
});
