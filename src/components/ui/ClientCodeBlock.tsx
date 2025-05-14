'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type ClientCodeBlockProps = {
  code: string;
  language?: string;
};

export function ClientCodeBlock({ code, language = 'tsx' }: ClientCodeBlockProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={atomDark}
      customStyle={{
        borderRadius: '0.5rem',
        fontSize: '0.95em',
        margin: '1.5em 0',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
