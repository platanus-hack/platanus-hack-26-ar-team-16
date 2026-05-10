import { useMemo } from 'react';
import { compileSpecStream } from '@json-render/core';
import type { Spec } from '@json-render/core';

const PATCH_REGEX = /^\s*\{"op"\s*:/;

export function parseMessageParts(content: string): {
  textParts: string[];
  jsonlLines: string[];
} {
  const lines = content.split('\n');
  const textParts: string[] = [];
  const jsonlLines: string[] = [];
  let textBuffer = '';

  for (const line of lines) {
    if (PATCH_REGEX.test(line)) {
      if (textBuffer.trim()) {
        textParts.push(textBuffer.trim());
        textBuffer = '';
      }
      jsonlLines.push(line);
    } else {
      textBuffer += line + '\n';
    }
  }

  if (textBuffer.trim()) {
    textParts.push(textBuffer.trim());
  }

  return { textParts, jsonlLines };
}

export function useSpecFromMessage(content: string): {
  text: string;
  spec: Spec | null;
} {
  return useMemo(() => {
    const { textParts, jsonlLines } = parseMessageParts(content);
    const text = textParts.join('\n\n');

    if (jsonlLines.length === 0) {
      return { text, spec: null };
    }

    try {
      const result = compileSpecStream(jsonlLines.join('\n'));
      if (result && 'root' in result && 'elements' in result) {
        return { text, spec: result as unknown as Spec };
      }
      return { text, spec: null };
    } catch {
      return { text, spec: null };
    }
  }, [content]);
}
