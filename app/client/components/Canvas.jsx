import { useRef, useState } from "react";
import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/canvas.css";

export default function Canvas({ children, overlay, onClick, onCursorMove }) {
    const canvasRef = useRef(null);
    const { zoom, setZoom, pan, setPan } = useCanvas();
    const [panning, setPanning] = useState(false);

    const panStart = useRef({
        x: 0,
        y: 0,
        panX: 0,
        panY: 0
    });

    const spaceDown = useRef(false);
    const lastCursorUpdate = useRef(0);

    const handleWheel = (e) => {
        e.preventDefault();

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

        const newZoom = Math.min(2.5, Math.max(0.25, zoom * zoomFactor));

        if (newZoom === zoom) return;

        const scale = newZoom / zoom;

        setPan({
            x: mouseX - (mouseX - pan.x) * scale,
            y: mouseY - (mouseY - pan.y) * scale
        });

        setZoom(newZoom);
    };

    const handleMouseDown = (e) => {
        const shouldPan =
            e.button === 2 ||
            e.button === 1 ||
            (e.button === 0 && spaceDown.current);

        if (!shouldPan) return;

        e.preventDefault();
        setPanning(true);

        panStart.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y
        };
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();

        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        const now = performance.now();

        if (onCursorMove && now - lastCursorUpdate.current >= 40) {
            lastCursorUpdate.current = now;
            onCursorMove(x, y);
        }

        if (!panning) return;

        setPan({
            x: panStart.current.panX + (e.clientX - panStart.current.x),
            y: panStart.current.panY + (e.clientY - panStart.current.y)
        });
    };

    const handleMouseUp = () => {
        setPanning(false);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    const handleKeyDown = (e) => {
        if (e.code === "Space") {
            spaceDown.current = true;
        }
    };

    const handleKeyUp = (e) => {
        if (e.code === "Space") {
            spaceDown.current = false;
            setPanning(false);
        }
    };

    return (
        <div
            ref={canvasRef}
            className={`canvas ${panning ? "panning" : ""}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClick={onClick}
            tabIndex={0}
        >
            <div
                className="canvas-content"
                style={{
                    transform: `
                        translate(${pan.x}px, ${pan.y}px)
                        scale(${zoom})
                    `
                }}
            >
                {children}
            </div>

            {overlay}
        </div>
    );
}
