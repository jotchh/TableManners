import { useState } from "react";
import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/measurementLayer.css";

export default function MeasurementLayer({ cellSize = 50, measurements = {}, onMeasurementMove, onMeasurementEnd }) {
    const { zoom, activeTool, measurementType } = useCanvas();
    const measurementActive = activeTool === "measure";
    const [measuring, setMeasuring] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [end, setEnd] = useState({ x: 0, y: 0 });

    const getGridPosition = (e) => {
        const content = e.currentTarget.closest(".canvas-content");
        const rect = content.getBoundingClientRect();

        return {
            x: Math.floor((e.clientX - rect.left) / zoom / cellSize),
            y: Math.floor((e.clientY - rect.top) / zoom / cellSize)
        };
    };

    const getFreePosition = (e) => {
        const content = e.currentTarget.closest(".canvas-content");
        const rect = content.getBoundingClientRect();

        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom
        };
    };

    const getPosition = (e) => {
        if (measurementType === "cone") {
            return getFreePosition(e);
        } else {
            return getGridPosition(e);
        }
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) {
            return;
        }

        e.stopPropagation();

        const position = getPosition(e);

        setStart(position);
        setEnd(position);
        setMeasuring(true);

        onMeasurementMove?.(position, position, measurementType);
    };

    const handleMouseMove = (e) => {
        if (!measuring){ 
            return;
        }
        const position = getPosition(e);
        setEnd(position);
        onMeasurementMove?.(start, position, measurementType);
    };

    const handleMouseUp = () => {
        if (!measuring){
            return
        };
        setMeasuring(false);
        onMeasurementEnd?.();
    };

    const renderMeasurement = (measurement, key) => {
        let type = "line";

        if (measurement.type) {
            type = measurement.type;
        }

        const measurementStart = measurement.start;
        const measurementEnd = measurement.end;

        let displayStartX;
        let displayStartY;
        let displayEndX;
        let displayEndY;

        if (type === "cone") {
            displayStartX = measurementStart.x;
            displayStartY = measurementStart.y;
            displayEndX = measurementEnd.x;
            displayEndY = measurementEnd.y;
        } else {
            displayStartX = measurementStart.x * cellSize + cellSize / 2;
            displayStartY = measurementStart.y * cellSize + cellSize / 2;
            displayEndX = measurementEnd.x * cellSize + cellSize / 2;
            displayEndY = measurementEnd.y * cellSize + cellSize / 2;
        }

        const dx = displayEndX - displayStartX;
        const dy = displayEndY - displayStartY;
        const lineLength = Math.hypot(dx, dy);
        const lineAngle = Math.atan2(dy, dx);

        let distancePixels;

        if (type === "cone") {
            distancePixels = Math.hypot(
                measurementEnd.x - measurementStart.x,
                measurementEnd.y - measurementStart.y
            );
        } else {
            distancePixels = Math.max(
                Math.abs(displayEndX - displayStartX),
                Math.abs(displayEndY - displayStartY)
            );
        }

        const distanceFeet = (distancePixels / cellSize) * 5;

        return (
            <div key={key} style={{ pointerEvents: "none" }}>
                {type === "cone" && (
                    <svg
                        className="measurement-cone"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "visible",
                            pointerEvents: "none"
                        }}
                    >
                        {(() => {
                            const angle = Math.atan2(
                                measurementEnd.y - measurementStart.y,
                                measurementEnd.x - measurementStart.x
                            );

                            const halfWidth = Math.hypot(
                                measurementEnd.x - measurementStart.x,
                                measurementEnd.y - measurementStart.y
                            ) / 2;

                            const perpendicularX = -Math.sin(angle);
                            const perpendicularY = Math.cos(angle);

                            const leftX = measurementEnd.x + perpendicularX * halfWidth;
                            const leftY = measurementEnd.y + perpendicularY * halfWidth;
                            const rightX = measurementEnd.x - perpendicularX * halfWidth;
                            const rightY = measurementEnd.y - perpendicularY * halfWidth;

                            return (
                                <polygon
                                    points={`${measurementStart.x},${measurementStart.y} ${leftX},${leftY} ${rightX},${rightY}`}
                                />
                            );
                        })()}
                    </svg>
                )}

                <div
                    className="measurement-line"
                    style={{
                        left: displayStartX,
                        top: displayStartY,
                        width: lineLength,
                        transform: `rotate(${lineAngle}rad)`
                    }}
                />

                <div
                    className="measurement-start"
                    style={{
                        left: displayStartX,
                        top: displayStartY
                    }}
                />

                <div
                    className="measurement-end"
                    style={{
                        left: displayEndX,
                        top: displayEndY
                    }}
                />

                <div
                    className="measurement-distance"
                    style={{
                        left: (displayStartX + displayEndX) / 2,
                        top: (displayStartY + displayEndY) / 2
                    }}
                >
                    {Math.round(distanceFeet)} ft
                </div>
            </div>
        );
    };

    let localMeasurement = null;

    if (measuring) {
        localMeasurement = {
            start,
            end,
            type: measurementType
        };
    }

    let pointerEvents = "none";

    if (measurementActive) {
        pointerEvents = "auto";
    }

    return (
        <div
            className="measurement-layer"
            style={{ pointerEvents }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {localMeasurement && renderMeasurement(localMeasurement, "local")}

            {Object.entries(measurements).map(([playerId, remote]) =>
                renderMeasurement(remote, playerId)
            )}
        </div>
    );
}
