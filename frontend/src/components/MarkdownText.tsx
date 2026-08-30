import { isValidElement, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface MarkdownTextProps {
  content: string;
}

/** Flattens a React subtree back into plain text, for the copy button. */
function toText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(toText).join('');
  if (isValidElement(node)) {
    return toText((node.props as { children?: ReactNode }).children);
  }
  return '';
}

function CodeBlock({ className, children }: { className?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className || '')?.[1] ?? '';
  const codeString = toText(children).replace(/\n$/, '');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; failing silently is fine here.
    }
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-line bg-code">
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-3.5 py-1.5 code-font text-[11px] text-slate-400">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] text-slate-400 transition hover:bg-white/10 hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-lime-300" />
              <span className="text-lime-300">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-font overflow-x-auto p-4 text-[13px] leading-6 text-slate-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownText({ content }: MarkdownTextProps) {
  return (
    <div className="text-sm leading-7 text-slate-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          /*
           * Fenced code is handled here rather than in `code`.
           *
           * react-markdown emits <pre><code>, so rendering the block chrome from
           * the `code` override nested a <div> and a second <pre> inside the
           * original <pre> — which is invalid markup and inherited `pre`
           * whitespace. Taking over `pre` and reading the inner <code> keeps a
           * single, correctly nested block.
           */
          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children;
            if (isValidElement(child)) {
              const props = child.props as { className?: string; children?: ReactNode };
              return <CodeBlock className={props.className}>{props.children}</CodeBlock>;
            }
            return <CodeBlock>{children}</CodeBlock>;
          },
          // Only inline code reaches this point now.
          code: ({ children }) => (
            <code className="code-font rounded-md border border-line bg-white/[0.08] px-1.5 py-0.5 text-[13px] font-normal text-lime-300">
              {children}
            </code>
          ),
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 text-xl font-bold tracking-tight text-white first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2.5 mt-5 text-lg font-semibold tracking-tight text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold tracking-tight text-white first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1.5 mt-3 text-sm font-semibold text-white first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="my-2.5 leading-7">{children}</p>,
          ul: ({ children }) => <ul className="my-2.5 ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2.5 ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-lime-300/40 pl-4 italic text-slate-400">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-lime-300 underline underline-offset-2 transition hover:text-lime-200"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
          hr: () => <hr className="my-4 border-line" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-line">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/[0.03] font-medium text-slate-300">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/5 bg-transparent">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-white/[0.02]">{children}</tr>,
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-slate-200">{children}</th>
          ),
          td: ({ children }) => <td className="px-3.5 py-2 text-slate-300">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
