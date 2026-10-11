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

  // Helper to format inline markdown (bold, italic, inline code)
  const formatInlineText = (text: string): React.ReactNode => {
    // Regex splits on `code` or **bold** or *italic*
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
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

      // Headers
      if (trimmed.startsWith('# ')) {
        flushList(i);
        elements.push(
          <h1 key={`h1-${i}`} className="font-display font-bold text-sm text-black mt-3 mb-1 border-b border-black/10 pb-1">
            {formatInlineText(trimmed.slice(2))}
          </h1>
        );
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushList(i);
        elements.push(
          <h2 key={`h2-${i}`} className="font-display font-bold text-xs text-black mt-2.5 mb-1 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson" />
            <span>{formatInlineText(trimmed.slice(3))}</span>
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith('### ')) {
        flushList(i);
        elements.push(
          <h3 key={`h3-${i}`} className="font-mono font-bold text-[11px] text-crimson uppercase tracking-wider mt-2 mb-0.5">
            {formatInlineText(trimmed.slice(4))}
          </h3>
        );
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
