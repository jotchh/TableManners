import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/cursorLayer.css";

export default function CursorLayer({ cursors }) {
    const { zoom, pan } = useCanvas();

    return (
        <div className="cursor-layer">
            {Object.entries(cursors).map(([playerId, cursor]) => (
                <div
                    key={playerId}
                    className="remote-cursor"
                    style={{
                        left: cursor.x * zoom + pan.x,
                        top: cursor.y * zoom + pan.y,
                        "--cursor-color": cursor.color
                    }}
                >
                    <div className="remote-cursor-arrow" />
                    <span className="remote-cursor-name">
                        {cursor.username}
                    </span>
                </div>
            ))}
        </div>
    );
}
