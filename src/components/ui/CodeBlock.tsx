import React from 'react';
import { codeToHtml } from 'shiki';

type CodeBlockProps = {
  code: string;
  lang?: string;
  theme?: string;
};

export async function CodeBlock({ code, lang = 'tsx', theme = 'github-dark' }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme,
  });

  return (
    <div className="codeblock" dangerouslySetInnerHTML={{ __html: html }} data-theme={theme} />
  );
}
