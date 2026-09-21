import { useState } from "react";
import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/actionSidebar.css";
import TokenCreator from "./TokenCreator.jsx";
import MapControls from "./MapControls.jsx";

export default function ActionSidebar({
    sessionCode,
    rows,
    columns,
    onMapResize,
    onTokenCreate
}) {
    const {
        activeTool,
        setActiveTool,
        measurementType,
        setMeasurementType
    } = useCanvas();

    const [showTokenCreator, setShowTokenCreator] = useState(false);
    const [showMapControls, setShowMapControls] = useState(false);

    const handleTokenCreate = token => {
        onTokenCreate(token);
        setShowTokenCreator(false);
    };

    return (
        <>
            <aside className="sidebar">
                <button
                    className={activeTool === "select" ? "active" : ""}
                    onClick={() => setActiveTool("select")}
                >
                    Select
                </button>

                <button
                    className={activeTool === "measure" ? "active" : ""}
                    onClick={() => setActiveTool("measure")}
                >
                    Measure
                </button>

                {activeTool === "measure" && (
                    <select
                        value={measurementType}
                        onChange={event => setMeasurementType(event.target.value)}
                    >
                        <option value="line">Distance</option>
                        <option value="cone">Cone</option>
                    </select>
                )}

                <button onClick={() => setShowTokenCreator(true)}>
                    Add Token
                </button>

                <button onClick={() => setShowMapControls(true)}>
                    Map Controls
                </button>

                <div className="session-code">
                    <span>Session Code</span>
                    <strong>{sessionCode}</strong>
                </div>
            </aside>

            {showMapControls && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowMapControls(false)}
                >
                    <div
                        className="map-controls-modal"
                        onClick={event => event.stopPropagation()}
                    >
                        <MapControls
                            rows={rows}
                            columns={columns}
                            onResize={onMapResize}
                        />

                        <button
                            className="modal-close"
                            onClick={() => setShowMapControls(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showTokenCreator && (
                <TokenCreator
                    onCreate={handleTokenCreate}
                    onClose={() => setShowTokenCreator(false)}
                />
            )}
        </>
    );
}
