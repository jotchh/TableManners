import { useRef, useState } from "react";
import "../styles/messageSidebar.css";

export default function MessageSidebar({messages, onSendMessage
}) {
    const [input, setInput] = useState("");
    const [width, setWidth] = useState(300);

    const resizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(300);

    const handleSubmit = (e) => {
        e.preventDefault();

        const message = input.trim();

        if (!message) return;

        onSendMessage?.(message);
        setInput("");
    };

    const handleResizeStart = (e) => {
        e.preventDefault();

        resizing.current = true;
        startX.current = e.clientX;
        startWidth.current = width;

        const handleResize = (e) => {
            const difference = e.clientX - startX.current;

            // Sidebar is on the right, so moving left makes it wider
            const newWidth = startWidth.current - difference;

            setWidth(Math.min(600, Math.max(220, newWidth)));
        };

        const handleResizeEnd = () => {
            resizing.current = false;

            document.removeEventListener("mousemove", handleResize);
            document.removeEventListener("mouseup", handleResizeEnd);
        };

        document.addEventListener("mousemove", handleResize);
        document.addEventListener("mouseup", handleResizeEnd);
    };

    return (
        <aside
            className="message-sidebar"
            style={{ width: `${width}px` }}
        >
            <div
                className="message-sidebar-resize"
                onMouseDown={handleResizeStart}
            />

            <div className="message-sidebar-header">
                <h2>Messages</h2>
            </div>

            <div className="message-list">
                {messages.length === 0 ? (
                    <p className="message-empty">
                        No messages yet.
                    </p>
                ) : (
                    messages.map(message => (
                        <div
                            key={message.id}
                            className={`message ${message.type}`}
                        >
                            {message.type === "chat" ? (
                                <>
                                    <div className="message-author">
                                        {message.username}
                                    </div>
                                    <div className="message-text">
                                        {message.message}
                                    </div>
                                </>
                            ) : (
                                <div className="message-text">
                                    {message.message}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <form
                className="message-input"
                onSubmit={handleSubmit}
            >
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Send a message..."
                    maxLength={500}
                />

                <button type="submit">
                    Send
                </button>
            </form>
        </aside>
    );
}
