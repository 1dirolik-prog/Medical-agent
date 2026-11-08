import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check } from "lucide-react";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  showCopyButton?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = "",
  showCopyButton = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group ${className}`}>
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-xs flex items-center gap-1"
          title="Copy text"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <Copy size={14} />
          )}
        </button>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none prose-slate prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:leading-relaxed prose-li:my-0.5">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};
