import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => (
    <p className="my-1 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-1 list-disc space-y-0.5 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-0.5 pl-4">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 underline underline-offset-2 dark:text-blue-400"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-200/70 px-1 py-0.5 font-mono text-xs dark:bg-slate-700/70">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-1 overflow-x-auto rounded-md bg-slate-900 p-2 text-xs text-slate-100 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-1 overflow-x-auto">
      <table className="border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-300 px-2 py-1 text-left font-semibold dark:border-slate-600">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-300 px-2 py-1 dark:border-slate-600">
      {children}
    </td>
  ),
};

const ChatMarkdown = ({ content }: { content: string }) => (
  <Markdown remarkPlugins={[remarkGfm]} components={components}>
    {content}
  </Markdown>
);

export default ChatMarkdown;
