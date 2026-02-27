"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] group relative`}>
        {!isUser && (
          <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 block font-medium">
            Buddy
          </span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap break-words ${
            isUser
              ? "bg-blue-500 text-white rounded-br-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
          }`}
        >
          {content}
        </div>
        {timestamp && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(timestamp + "Z").toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
