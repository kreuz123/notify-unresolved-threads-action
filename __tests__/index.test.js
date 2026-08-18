const mockCore = {
  getInput: jest.fn(),
  info: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
};

const mockGithub = {
  context: {
    payload: {
      review: {
        state: "approved",
        user: { login: "reviewer" },
      },
      pull_request: { number: 123 },
    },
    repo: { owner: "owner", repo: "repo" },
  },
  getOctokit: jest.fn(),
};

const mockCheckThreads = {
  checkUnresolvedThreads: jest.fn(),
};

jest.mock("@actions/core", () => mockCore);
jest.mock("@actions/github", () => mockGithub);
jest.mock("../src/check-threads", () => mockCheckThreads);

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("index action review state re-check", () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore.getInput.mockImplementation((name) => {
      if (name === "token") return "test-token";
      if (name === "wait-seconds") return "0";
      if (name === "comment-template") return "template";
      return "";
    });

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
    mockGithub.getOctokit.mockReturnValue(client);
    mockCheckThreads.checkUnresolvedThreads.mockResolvedValue([]);
  });

  test("uses paginate and ignores non-submitted reviews when selecting latest review state", async () => {
    client.paginate.mockResolvedValue([
      {
        user: { login: "reviewer" },
        state: "APPROVED",
        submitted_at: "2026-01-01T00:00:00Z",
      },
      {
        user: { login: "reviewer" },
        state: "PENDING",
      },
    ]);

    jest.isolateModules(() => {
      require("../index");
    });
    await flushPromises();
    await flushPromises();

    expect(client.paginate).toHaveBeenCalledTimes(1);
    expect(client.paginate.mock.calls[0][0]).toBe(client.rest.pulls.listReviews);
    expect(client.paginate.mock.calls[0][1]).toEqual({
      owner: "owner",
      repo: "repo",
      pull_number: 123,
      per_page: 100,
    });
    expect(mockCheckThreads.checkUnresolvedThreads).toHaveBeenCalledTimes(1);
    expect(mockCore.info).not.toHaveBeenCalledWith(
      "Reviewer's latest review state is no longer approved. Skipping thread check.",
    );
  });

  test("skips thread check when latest submitted review is not approved", async () => {
    client.paginate.mockResolvedValue([
      {
        user: { login: "reviewer" },
        state: "APPROVED",
        submitted_at: "2026-01-01T00:00:00Z",
      },
      {
        user: { login: "reviewer" },
        state: "DISMISSED",
        submitted_at: "2026-01-02T00:00:00Z",
      },
      {
        user: { login: "reviewer" },
        state: "PENDING",
      },
    ]);

    jest.isolateModules(() => {
      require("../index");
    });
    await flushPromises();
    await flushPromises();

    expect(mockCheckThreads.checkUnresolvedThreads).not.toHaveBeenCalled();
    expect(mockCore.info).toHaveBeenCalledWith(
      "Reviewer's latest review state is no longer approved. Skipping thread check.",
    );
  });
});
