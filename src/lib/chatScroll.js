// Keep a chat at its newest message by scrolling ONLY the message container. scrollIntoView() on a
// "latest message" element also scrolls every ancestor, including the page itself, which makes the
// whole page jump while the student is typing.
export function scrollToLatest(container) {
  if (container) container.scrollTop = container.scrollHeight;
}
