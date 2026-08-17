const PREVIEW_LENGTH = 70;

function formatThreadList(threads) {
  return threads
    .map((thread, index) => {
      const preview = thread.comments.nodes[0].body.substring(
        0,
        PREVIEW_LENGTH,
      );
      const isPreviewCut = thread.comments.nodes[0].body.length > PREVIEW_LENGTH;
      const ellipsis = isPreviewCut ? "..." : "";

      return `${index + 1}. [View thread](${thread.comments.nodes[0].url}) - ${preview}${ellipsis}`;
    })
    .join("\n");
}

module.exports = { formatThreadList };
