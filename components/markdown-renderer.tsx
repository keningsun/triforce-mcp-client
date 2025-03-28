"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // 确保内容是有效的字符串
  const safeContent = useMemo(() => {
    if (content === null || content === undefined) return "";
    return String(content);
  }, [content]);

  // 使用 useMemo 缓存 ReactMarkdown 组件配置
  const markdownComponents = useMemo(
    () => ({
      // 标题样式
      h1: ({ node, ...props }: any) => (
        <h1 className="text-2xl font-bold my-4" {...props} />
      ),
      h2: ({ node, ...props }: any) => (
        <h2 className="text-xl font-bold my-3" {...props} />
      ),
      h3: ({ node, ...props }: any) => (
        <h3 className="text-lg font-bold my-2" {...props} />
      ),
      h4: ({ node, ...props }: any) => (
        <h4 className="text-base font-bold my-2" {...props} />
      ),

      // 段落和列表
      p: ({ node, ...props }: any) => <p className="my-2" {...props} />,
      ul: ({ node, ...props }: any) => (
        <ul className="list-disc pl-6 my-2" {...props} />
      ),
      ol: ({ node, ...props }: any) => (
        <ol className="list-decimal pl-6 my-2" {...props} />
      ),
      li: ({ node, ...props }: any) => <li className="my-1" {...props} />,

      // 强调
      strong: ({ node, ...props }: any) => (
        <strong className="font-bold" {...props} />
      ),
      em: ({ node, ...props }: any) => <em className="italic" {...props} />,

      // 链接
      a: ({ node, ...props }: any) => (
        <a
          className="text-[#1E6B68] hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),

      // 代码块
      code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            className="rounded-md my-2 overflow-auto"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        ) : (
          <code
            className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      },

      // 表格
      table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-gray-300" {...props} />
        </div>
      ),
      thead: ({ node, ...props }: any) => (
        <thead className="bg-gray-100" {...props} />
      ),
      tbody: ({ node, ...props }: any) => <tbody {...props} />,
      tr: ({ node, ...props }: any) => (
        <tr className="border-b border-gray-300" {...props} />
      ),
      th: ({ node, ...props }: any) => (
        <th
          className="border-r border-gray-300 px-4 py-2 text-left font-medium"
          {...props}
        />
      ),
      td: ({ node, ...props }: any) => (
        <td className="border-r border-gray-300 px-4 py-2" {...props} />
      ),

      // 引用
      blockquote: ({ node, ...props }: any) => (
        <blockquote
          className="border-l-4 border-[#1E6B68] pl-4 italic my-4 text-gray-700"
          {...props}
        />
      ),

      // 分割线
      hr: ({ node, ...props }: any) => (
        <hr className="my-4 border-gray-300" {...props} />
      ),
    }),
    []
  ); // 空依赖数组，只计算一次

  // 如果内容为空，则返回 null 避免渲染
  if (!safeContent.trim()) return null;

  return (
    <div className={cn("markdown-renderer", className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={markdownComponents}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
