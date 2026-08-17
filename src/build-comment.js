function renderTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
  );
}

function buildCommentBody(template, { reviewer, unresolvedCount, threadList }) {
  const mentionsReviewer = template.includes("{reviewer}");
  const values = {
    reviewer: `@${reviewer}`,
    unresolvedCount,
    threadList,
  };
  const message = renderTemplate(template, values);
  const mentionedMessage = mentionsReviewer
    ? message
    : `@${reviewer} ${message}`;

  if (template.includes("{threadList}")) {
    return mentionedMessage;
  }

  return `${mentionedMessage}\n\n**Your unresolved review threads:**\n${threadList}`;
}

module.exports = { buildCommentBody };
