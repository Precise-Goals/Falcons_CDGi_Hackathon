import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Helper to safely split table cells taking into account inline code and escaped pipes
  const splitCells = (line: string): string[] => {
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);

    const cells: string[] = [];
    let current = '';
    let inCode = false;

    for (let idx = 0; idx < s.length; idx++) {
      const char = s[idx];
      if (char === '`') {
        inCode = !inCode;
        current += char;
      } else if (char === '\\' && idx + 1 < s.length && s[idx + 1] === '|') {
        current += '|';
        idx++; // skip escaped pipe
      } else if (char === '|' && !inCode) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  // Helper to format inline markdown (bold, italic, inline code, links)
  const formatInlineText = (text: string): React.ReactNode => {
    // Regex splits on `code` or **bold** or *italic* or [label](url)
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-black/5 text-crimson font-mono text-[10px] font-bold border border-black/5"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-black">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-black/80">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('[') && token.endsWith(')')) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          parts.push(
            <a
              key={match.index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-crimson underline underline-offset-2 hover:text-crimson/80 font-medium transition-colors"
            >
              {label}
            </a>
          );
        } else {
          parts.push(token);
        }
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Split into structural blocks (code blocks vs text blocks)
  const renderBlocks = () => {
    const rawLines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeBlockCount = 0;

    let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;

    const flushList = (key: string | number) => {
      if (!listBuffer) return;
      if (listBuffer.type === 'ul') {
        elements.push(
          <ul key={`ul-${key}`} className="my-2 space-y-1.5 pl-1">
            {listBuffer.items.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed text-black/85">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson mt-1.5 shrink-0" />
                <span>{formatInlineText(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="my-2 space-y-1.5 pl-1">
            {listBuffer.items.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs leading-relaxed text-black/85">
                <span className="font-mono text-crimson font-bold text-[11px] shrink-0">{idx + 1}.</span>
                <span>{formatInlineText(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      listBuffer = null;
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      // Code block start / end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          flushList(i);
          inCodeBlock = true;
          codeLanguage = line.trim().replace(/^```/, '').trim() || 'typescript';
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const codeString = codeBuffer.join('\n');
          const currentIdx = codeBlockCount++;
          elements.push(
            <div
              key={`code-${currentIdx}`}
              className="my-3 rounded-2xl overflow-hidden border border-black/15 bg-[#0D0D0D] shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#171717] border-b border-white/10 text-[10px] font-mono text-white/60">
                <div className="flex items-center space-x-1.5">
                  <Terminal className="w-3 h-3 text-crimson" />
                  <span className="uppercase font-bold tracking-wider">{codeLanguage}</span>
                </div>
                <button
                  onClick={() => handleCopy(codeString, currentIdx)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition text-[10px]"
                >
                  {copiedCodeIdx === currentIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        flushList(i);
        continue;
      }

      // Markdown Table parsing (starts with pipe and followed by delimiter row, tolerating blank lines)
      if (line.includes('|')) {
        let nextIdx = i + 1;
        while (nextIdx < rawLines.length && !rawLines[nextIdx].trim()) {
          nextIdx++;
        }

        if (
          nextIdx < rawLines.length &&
          /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(rawLines[nextIdx].trim())
        ) {
          flushList(i);

          const headerCells = splitCells(line);
          const delimiterCells = splitCells(rawLines[nextIdx]);

          const alignments = delimiterCells.map((d) => {
            const td = d.trim();
            if (td.startsWith(':') && td.endsWith(':')) return 'center';
            if (td.endsWith(':')) return 'right';
            return 'left';
          });

          const dataRows: string[][] = [];
          let j = nextIdx + 1;
          let lastTableRowIdx = nextIdx;

          while (j < rawLines.length) {
            const rowTrimmed = rawLines[j].trim();
            if (!rowTrimmed) {
              // Look ahead past blank lines to see if another table row follows
              let lookAhead = j + 1;
              while (lookAhead < rawLines.length && !rawLines[lookAhead].trim()) {
                lookAhead++;
              }
              if (
                lookAhead < rawLines.length &&
                lookAhead < rawLines.length &&
                rawLines[lookAhead].includes('|') &&
                !rawLines[lookAhead].trim().startsWith('```') &&
                !rawLines[lookAhead].trim().startsWith('#')
              ) {
                j = lookAhead;
                dataRows.push(splitCells(rawLines[j]));
                lastTableRowIdx = j;
                j++;
                continue;
              } else {
                break;
              }
            }

            if (
              rowTrimmed.includes('|') &&
              !rowTrimmed.startsWith('```') &&
              !rowTrimmed.startsWith('#')
            ) {
              dataRows.push(splitCells(rowTrimmed));
              lastTableRowIdx = j;
              j++;
            } else {
              break;
            }
          }

          const tableKeyIdx = i;
          i = lastTableRowIdx;

          elements.push(
            <div
              key={`table-${tableKeyIdx}`}
              className="my-3 overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm"
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#FAF9F5] border-b border-black/10 text-black/75 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    {headerCells.map((h, colIdx) => (
                      <th
                        key={colIdx}
                        className={`px-3.5 py-2.5 font-bold border-r border-black/5 last:border-r-0 ${
                          alignments[colIdx] === 'center'
                            ? 'text-center'
                            : alignments[colIdx] === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {formatInlineText(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-black/5 last:border-b-0 hover:bg-crimson/[0.02] transition-colors even:bg-black/[0.015]"
                    >
                      {headerCells.map((_, colIdx) => {
                        const cellVal = row[colIdx] || '';
                        return (
                          <td
                            key={colIdx}
                            className={`px-3.5 py-2 font-sans text-xs text-black/85 border-r border-black/5 last:border-r-0 leading-relaxed ${
                              alignments[colIdx] === 'center'
                                ? 'text-center'
                                : alignments[colIdx] === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            {formatInlineText(cellVal)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Horizontal Rule
      if (/^([-*_]){3,}$/.test(trimmed)) {
        flushList(i);
        elements.push(
          <hr key={`hr-${i}`} className="my-2.5 border-t border-black/10" />
        );
        continue;
      }

      // Headers (H1 to H6)
      const headerMatch =
        trimmed.match(/^(#{1,6})\s+(.*)$/) ||
        (trimmed.startsWith('##') ? trimmed.match(/^(#{2,6})([A-Za-z0-9_].*)$/) : null);

      if (headerMatch) {
        flushList(i);
        const level = headerMatch[1].length;
        const headingText = headerMatch[2].trim();

        if (level === 1) {
          elements.push(
            <h1 key={`h1-${i}`} className="font-display font-bold text-sm text-black mt-3 mb-1 border-b border-black/10 pb-1">
              {formatInlineText(headingText)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${i}`} className="font-display font-bold text-xs text-black mt-2.5 mb-1 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
              <span>{formatInlineText(headingText)}</span>
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={`h3-${i}`} className="font-mono font-bold text-[11px] text-crimson uppercase tracking-wider mt-2 mb-0.5">
              {formatInlineText(headingText)}
            </h3>
          );
        } else if (level === 4) {
          elements.push(
            <h4 key={`h4-${i}`} className="font-mono font-bold text-[11px] text-black/90 uppercase tracking-wide mt-2 mb-0.5 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-sm bg-black/40" />
              <span>{formatInlineText(headingText)}</span>
            </h4>
          );
        } else if (level === 5) {
          elements.push(
            <h5 key={`h5-${i}`} className="font-mono font-semibold text-[10px] text-black/80 uppercase tracking-wider mt-1.5 mb-0.5">
              {formatInlineText(headingText)}
            </h5>
          );
        } else {
          elements.push(
            <h6 key={`h6-${i}`} className="font-mono font-medium text-[10px] text-black/70 tracking-wide mt-1 mb-0.5">
              {formatInlineText(headingText)}
            </h6>
          );
        }
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushList(i);
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-2 border-l-2 border-crimson pl-3 py-1 bg-crimson/5 rounded-r-xl text-black/75 italic text-xs leading-relaxed"
          >
            {formatInlineText(trimmed.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.slice(2);
        if (!listBuffer || listBuffer.type !== 'ul') {
          flushList(i);
          listBuffer = { type: 'ul', items: [itemText] };
        } else {
          listBuffer.items.push(itemText);
        }
        continue;
      }

      // Numbered lists (1. , 2. )
      const numMatch = trimmed.match(/^([0-9]+)\.\s+(.*)$/);
      if (numMatch) {
        const itemText = numMatch[2];
        if (!listBuffer || listBuffer.type !== 'ol') {
          flushList(i);
          listBuffer = { type: 'ol', items: [itemText] };
        } else {
          listBuffer.items.push(itemText);
        }
        continue;
      }

      // Normal paragraph
      flushList(i);
      elements.push(
        <p key={`p-${i}`} className="my-1.5 text-xs text-black/85 leading-relaxed">
          {formatInlineText(line)}
        </p>
      );
    }

    flushList('end');
    return elements;
  };

  return <div className="space-y-1">{renderBlocks()}</div>;
}
