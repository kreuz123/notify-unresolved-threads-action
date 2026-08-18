function getLatestSubmittedReview(reviews, reviewer) {
  return (reviews ?? []).reduce((latest, review) => {
    if (review?.user?.login !== reviewer) return latest;
    if (review.state === "PENDING" || !review.submitted_at) return latest;

    return !latest || review.submitted_at > latest.submitted_at ? review : latest;
  }, undefined);
}

module.exports = { getLatestSubmittedReview };
