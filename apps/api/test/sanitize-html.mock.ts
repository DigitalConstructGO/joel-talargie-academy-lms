const sanitizeHtml = (value: string): string =>
  value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
export default sanitizeHtml;
