import { useEffect, useState } from "react";
import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/drawingLayer.css";

export default function DrawingLayer({ drawings, setDrawings, selectedId, onSelect, onDrawingCreate, onDrawingMove, onDrawingDelete }) {
    const { zoom, activeTool, brushColor } = useCanvas();
    const [drawing, setDrawing] = useState(null);
    const [transform, setTransform] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeTool !== "select" || !selectedId) return;
            if (e.key !== "Delete" && e.key !== "Backspace") return;

            if (onDrawingDelete) {
                onDrawingDelete(selectedId);
            } else {
                setDrawings(drawings.filter(drawing => drawing.id !== selectedId));
            }

            onSelect(null);
            setTransform(null);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeTool, selectedId, drawings, setDrawings, onSelect, onDrawingDelete]);

    const getPosition = (e) => {
        const content = e.currentTarget.closest(".canvas-content");
        const rect = content.getBoundingClientRect();

        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        };
    };

    const getBounds = (drawing) => {
        if (!drawing.points.length) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        const xs = drawing.points.map(p => p.x);
        const ys = drawing.points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const width = maxX - minX;
        const height = maxY - minY;
        const size = Math.max(width, height, 10);

        return { x: minX, y: minY, width: size, height: size };
    };

    const handleMouseDown = (e) => {
        if (activeTool !== "draw" || e.button !== 0) return;

        e.stopPropagation();

        const newDrawing = {
            id: crypto.randomUUID(),
            points: [getPosition(e)],
            color: brushColor
        };

        setDrawing(newDrawing);
        onDrawingCreate?.(newDrawing);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;

        const updatedDrawing = {
            ...drawing,
            points: [...drawing.points, getPosition(e)]
        };

        setDrawing(updatedDrawing);
        onDrawingMove?.(updatedDrawing.id, updatedDrawing.points);
    };

    const handleMouseUp = () => {
        if (!drawing) return;

        setDrawings(currentDrawings => {
            const exists = currentDrawings.some(
                current => current.id === drawing.id
            );

            if (exists) return currentDrawings;

            return [...currentDrawings, drawing];
        });

        setDrawing(null);
    };

    const handleSelectMouseDown = (e, drawing) => {
        if (activeTool !== "select" || e.button !== 0) return;

        e.stopPropagation();

        const position = getPosition(e);
        onSelect(drawing.id);

        setTransform({
            type: "move",
            id: drawing.id,
            startX: position.x,
            startY: position.y,
            originalPoints: drawing.points.map(p => ({ ...p }))
        });
    };

    const handleResizeMouseDown = (e, drawing, direction) => {
        if (activeTool !== "select" || e.button !== 0) return;

        e.stopPropagation();

        const bounds = getBounds(drawing);
        onSelect(drawing.id);

        setTransform({
            type: "resize",
            id: drawing.id,
            direction,
            bounds,
            originalPoints: drawing.points.map(p => ({ ...p }))
        });
    };

    const handleTransformMove = (e) => {
        if (!transform) return;

        const position = getPosition(e);
        let updatedPoints = null;

        if (transform.type === "move") {
            const dx = position.x - transform.startX;
            const dy = position.y - transform.startY;

            updatedPoints = transform.originalPoints.map(point => ({
                x: point.x + dx,
                y: point.y + dy
            }));
        }

        if (transform.type === "resize") {
            const { bounds, direction, originalPoints } = transform;

            let left = bounds.x;
            let top = bounds.y;
            let right = bounds.x + bounds.width;
            let bottom = bounds.y + bounds.height;

            if (direction.includes("e")) {
                right = Math.max(position.x, left + 1);
            }

            if (direction.includes("w")) {
                left = Math.min(position.x, right - 1);
            }

            if (direction.includes("s")) {
                bottom = Math.max(position.y, top + 1);
            }

            if (direction.includes("n")) {
                top = Math.min(position.y, bottom - 1);
            }

            const oldWidth = bounds.width || 1;
            const oldHeight = bounds.height || 1;
            const newWidth = right - left;
            const newHeight = bottom - top;
            const scaleX = newWidth / oldWidth;
            const scaleY = newHeight / oldHeight;

            updatedPoints = originalPoints.map(point => ({
                x: left + (point.x - bounds.x) * scaleX,
                y: top + (point.y - bounds.y) * scaleY
            }));
        }

        if (!updatedPoints) return;

        setDrawings(currentDrawings =>
            currentDrawings.map(drawing =>
                drawing.id === transform.id
                    ? { ...drawing, points: updatedPoints }
                    : drawing
            )
        );

        onDrawingMove?.(transform.id, updatedPoints);
    };

    const handleTransformUp = () => {
        setTransform(null);
    };

    const handleClick = () => {
        if (activeTool === "select") {
            onSelect(null);
        }
    };

    let allDrawings = drawings;

    if (drawing) {
        allDrawings = [...drawings, drawing];
    }

    return (
        <div
            className="drawing-layer"
            style={{
                pointerEvents:
                    activeTool === "draw" || activeTool === "select"
                        ? "auto"
                        : "none"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={
                transform
                    ? handleTransformMove
                    : handleMouseMove
            }
            onMouseUp={
                transform
                    ? handleTransformUp
                    : handleMouseUp
            }
            onClick={handleClick}
        >
            <svg>
                {allDrawings.map(drawing => (
                    <polyline
                        key={drawing.id}
                        points={drawing.points.map(point => `${point.x},${point.y}`).join(" ")}
                        stroke={drawing.color || "#000000"}
                    />
                ))}
            </svg>

            {activeTool === "select" && drawings.map(drawing => {
                const bounds = getBounds(drawing);
                const selected = selectedId === drawing.id;

                return (
                    <div
                        key={drawing.id}
                        className={`drawing-hitbox ${selected ? "selected" : ""}`}
                        style={{
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height
                        }}
                        onMouseDown={e => handleSelectMouseDown(e, drawing)}
                        onClick={e => e.stopPropagation()}
                    >
                        {selected && (
                            <>
                                <div className="resize-handle nw" onMouseDown={e => handleResizeMouseDown(e, drawing, "nw")} />
                                <div className="resize-handle n" onMouseDown={e => handleResizeMouseDown(e, drawing, "n")} />
                                <div className="resize-handle ne" onMouseDown={e => handleResizeMouseDown(e, drawing, "ne")} />
                                <div className="resize-handle w" onMouseDown={e => handleResizeMouseDown(e, drawing, "w")} />
                                <div className="resize-handle e" onMouseDown={e => handleResizeMouseDown(e, drawing, "e")} />
                                <div className="resize-handle sw" onMouseDown={e => handleResizeMouseDown(e, drawing, "sw")} />
                                <div className="resize-handle s" onMouseDown={e => handleResizeMouseDown(e, drawing, "s")} />
                                <div className="resize-handle se" onMouseDown={e => handleResizeMouseDown(e, drawing, "se")} />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
