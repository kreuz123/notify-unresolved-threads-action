function getLatestSubmittedReview(reviews, reviewer) {
  return reviews
    .filter(
      (review) =>
        review.user.login === reviewer &&
        review.state !== "PENDING" &&
        review.submitted_at,
    )
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .pop();
}

module.exports = { getLatestSubmittedReview };
