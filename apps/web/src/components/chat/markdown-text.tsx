'use client';

import React from 'react';

interface MarkdownTextProps {
  content: string;
}

export function MarkdownText({ content }: MarkdownTextProps) {
  if (!content) return null;

  // Split content by double newlines into blocks or single newlines
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={lineIndex} className="h-1" />;
        }

        // Horizontal Rule
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={lineIndex} className="my-2 border-border/50" />;
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lineIndex} className="mt-2 text-xs font-bold text-foreground">
              {renderFormattedInline(trimmed.slice(4))}
            </h4>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lineIndex} className="mt-2.5 text-xs font-extrabold text-foreground">
              {renderFormattedInline(trimmed.slice(3))}
            </h3>
          );
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={lineIndex} className="mt-3 text-sm font-black text-foreground">
              {renderFormattedInline(trimmed.slice(2))}
            </h2>
          );
        }

        // Bullet Lists (* item or - item or 1. item)
        const listMatch = trimmed.match(/^([*-]|\d+\.)\s+(.*)$/);
        if (listMatch && listMatch[1] && listMatch[2]) {
          const prefix = listMatch[1];
          const text = listMatch[2];
          return (
            <div key={lineIndex} className="ml-2 flex items-start gap-1.5 py-0.5">
              <span className="shrink-0 font-semibold text-brand">
                {prefix.endsWith('.') ? prefix : '•'}
              </span>
              <span>{renderFormattedInline(text)}</span>
            </div>
          );
        }

        // Regular Paragraph
        return (
          <p key={lineIndex} className="m-0">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Helper to parse bold (**text**), inline code (`code`), and italics (*text*)
 */
function renderFormattedInline(text: string): React.ReactNode[] {
  // Regex to match **bold**, `code`, or *italic*
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    return token;
  });
}
