export default function ChatTypingIndicator() {
    return (
        <div className="px-4 pb-1 flex items-center gap-1.5 text-xs text-gray-400">
            <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
            </span>
            กำลังพิมพ์...
        </div>
    );
}
