import sanitizeHtml from 'sanitize-html';

/**
 * Strip dangerous HTML out of a free-form text field while keeping
 * basic typographic elements. Used for sticky-note / markdown content.
 */
export function sanitizeRichText(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'u', 's',
      'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3',
      'blockquote', 'code', 'pre',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      code: ['class'],
      pre: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}

/** Strip all tags entirely. Used for short fields like title/description. */
export function sanitizePlainText(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}
