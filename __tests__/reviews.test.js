const { getLatestSubmittedReview } = require("../src/reviews");

describe("getLatestSubmittedReview", () => {
  test("returns the latest submitted review for a reviewer", () => {
    const result = getLatestSubmittedReview(
      [
        {
          user: { login: "octocat" },
          state: "APPROVED",
          submitted_at: "2026-01-01T00:00:00Z",
        },
        {
          user: { login: "octocat" },
          state: "CHANGES_REQUESTED",
          submitted_at: "2026-01-03T00:00:00Z",
        },
        {
          user: { login: "someone-else" },
          state: "APPROVED",
          submitted_at: "2026-01-04T00:00:00Z",
        },
      ],
      "octocat",
    );

    expect(result.state).toBe("CHANGES_REQUESTED");
  });

  test("ignores pending or non-submitted reviews", () => {
    const result = getLatestSubmittedReview(
      [
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
      ],
      "octocat",
    );

    expect(result.state).toBe("APPROVED");
  });

  test("returns undefined when there are no submitted reviews", () => {
    const result = getLatestSubmittedReview(
      [
        {
          user: { login: "octocat" },
          state: "PENDING",
          submitted_at: null,
        },
      ],
      "octocat",
    );

    expect(result).toBeUndefined();
  });
});
