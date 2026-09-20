import { useState, useRef } from "react";
import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/token.css";

export default function Token({id, tokenId, name, image, x = 0, y = 0, size = 1, cellSize = 50, selected = false, movement, onMove, onSelect, onResize}) {
    let { zoom, activeTool } = useCanvas();
    let tokenSize = size * cellSize;

    let [dragging, setDragging] = useState(false);
    let [imageError, setImageError] = useState(false);
    let [resizing, setResizing] = useState(false);
    let [dragPosition, setDragPosition] = useState({
        x: x * cellSize,
        y: y * cellSize
    });

    let dragStart = useRef({
        mouseX: 0,
        mouseY: 0,
        tokenX: 0,
        tokenY: 0,
        size: 1
    });

    let remoteDragging = movement?.dragging || false;
    let dragStartX = movement?.startX;
    let dragStartY = movement?.startY;
    let isDragging = dragging || remoteDragging;

    let handleMouseDown = (e) => {
        if (e.button !== 0) return;
        if (activeTool !== "select") return;

        e.preventDefault();
        e.stopPropagation();

        onSelect?.(id);
        setDragging(true);

        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            tokenX: x * cellSize,
            tokenY: y * cellSize
        };

        setDragPosition({
            x: x * cellSize,
            y: y * cellSize
        });

        let handleMouseMove = (e) => {
            let dx = (e.clientX - dragStart.current.mouseX) / zoom;
            let dy = (e.clientY - dragStart.current.mouseY) / zoom;

            let newX = dragStart.current.tokenX + dx;
            let newY = dragStart.current.tokenY + dy;

            setDragPosition({
                x: newX,
                y: newY
            });

            onMove?.(
                id,
                newX / cellSize,
                newY / cellSize,
                true,
                dragStart.current.tokenX / cellSize,
                dragStart.current.tokenY / cellSize
            );
        };

        let handleMouseUp = (e) => {
            let dx = (e.clientX - dragStart.current.mouseX) / zoom;
            let dy = (e.clientY - dragStart.current.mouseY) / zoom;

            let gridX = Math.round(
                (dragStart.current.tokenX + dx) / cellSize
            );

            let gridY = Math.round(
                (dragStart.current.tokenY + dy) / cellSize
            );

            setDragPosition({
                x: gridX * cellSize,
                y: gridY * cellSize
            });

            setDragging(false);

            onMove?.(
                id,
                gridX,
                gridY,
                false,
                dragStart.current.tokenX / cellSize,
                dragStart.current.tokenY / cellSize
            );

            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    let handleResizeMouseDown = (e) => {
        if (e.button !== 0) return;
        if (activeTool !== "select") return;

        e.preventDefault();
        e.stopPropagation();

        onSelect?.(id);
        setResizing(true);

        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            size
        };

        let handleMouseMove = (e) => {
            let dx = (e.clientX - dragStart.current.mouseX) / zoom;
            let dy = (e.clientY - dragStart.current.mouseY) / zoom;

            let distance = Math.max(dx, dy);

            let newSize = Math.max(
                0.5,
                dragStart.current.size + distance / cellSize
            );

            onResize?.(id, newSize);
        };

        let handleMouseUp = () => {
            setResizing(false);

            document.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            document.removeEventListener(
                "mouseup",
                handleMouseUp
            );
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    let measurementStartX;
    let measurementStartY;
    let measurementEndX;
    let measurementEndY;

    if (dragging) {
        measurementStartX = dragStart.current.tokenX;
        measurementStartY = dragStart.current.tokenY;
        measurementEndX = dragPosition.x;
        measurementEndY = dragPosition.y;
    } else if (remoteDragging) {
        measurementStartX = (dragStartX ?? x) * cellSize;
        measurementStartY = (dragStartY ?? y) * cellSize;
        measurementEndX = x * cellSize;
        measurementEndY = y * cellSize;
    } else {
        measurementStartX = x * cellSize;
        measurementStartY = y * cellSize;
        measurementEndX = x * cellSize;
        measurementEndY = y * cellSize;
    }

    let startX = measurementStartX + tokenSize / 2;
    let startY = measurementStartY + tokenSize / 2;
    let endX = measurementEndX + tokenSize / 2;
    let endY = measurementEndY + tokenSize / 2;

    let gridDx = Math.abs(
        Math.round(
            (measurementEndX - measurementStartX) / cellSize
        )
    );

    let gridDy = Math.abs(
        Math.round(
            (measurementEndY - measurementStartY) / cellSize
        )
    );

    let distance = Math.max(gridDx, gridDy) * 5;

    let lineLength = Math.hypot(
        endX - startX,
        endY - startY
    );

    let angle =
        Math.atan2(
            endY - startY,
            endX - startX
        ) * 180 / Math.PI;

    return (
        <>
            {isDragging && (
                <>
                    <div
                        className="token-measurement-line"
                        style={{
                            left: startX,
                            top: startY,
                            width: lineLength,
                            transform: `rotate(${angle}deg)`
                        }}
                    >
                        <div className="token-measurement-arrow" />
                    </div>

                    <div
                        className="token-measurement-distance"
                        style={{
                            left: (startX + endX) / 2,
                            top: (startY + endY) / 2
                        }}
                    >
                        {distance} ft
                    </div>
                </>
            )}

            <div
                className={`token ${selected ? "selected" : ""}`}
                style={{
                    width: tokenSize,
                    height: tokenSize,
                    left: dragging
                        ? dragPosition.x
                        : x * cellSize,
                    top: dragging
                        ? dragPosition.y
                        : y * cellSize
                }}
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
            >
                {image && !imageError ? (
                    <img
                        src={image}
                        draggable={false}
                        onError={() => setImageError(true)}
                    />
                ) : null}

                {selected && (
                    <div
                        className="token-resize-handle"
                        onMouseDown={handleResizeMouseDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                )}
            </div>
        </>
    );
}
