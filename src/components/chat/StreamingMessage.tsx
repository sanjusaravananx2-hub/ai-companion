"use client";

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  if (!content) return null;

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[75%]">
        <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 block font-medium">
          Buddy
        </span>
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm whitespace-pre-wrap break-words">
          {content}
          <span className="inline-block w-0.5 h-4 bg-gray-400 dark:bg-gray-500 ml-0.5 animate-pulse align-text-bottom" />
        </div>
      </div>
    </div>
  );
}
