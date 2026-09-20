import { useState } from "react";
import { useCanvas } from "../context/CanvasContext.jsx";
import "../styles/actionSidebar.css";
import TokenCreator from "./TokenCreator.jsx";

export default function ActionSidebar({ sessionCode, onTokenCreate }) {
    const { activeTool, setActiveTool, brushColor, setBrushColor, measurementType, setMeasurementType } = useCanvas();
    const [showTokenCreator, setShowTokenCreator] = useState(false);

    const handleTokenCreate = (token) => {
        onTokenCreate(token);
        setShowTokenCreator(false);
    };

    return (
        <aside className="sidebar">
            <button className={activeTool === "select" ? "active" : ""} onClick={() => setActiveTool("select")}>
                Select
            </button>

            <button className={activeTool === "draw" ? "active" : ""} onClick={() => setActiveTool("draw")}>
                Draw
            </button>

            {activeTool === "draw" && (
                <select value={brushColor} onChange={(e) => setBrushColor(e.target.value)}>
                    <option value="#000000">Black</option>
                    <option value="#ffffff">White</option>
                    <option value="#ff0000">Red</option>
                    <option value="#00ff00">Green</option>
                    <option value="#0000ff">Blue</option>
                    <option value="#ffff00">Yellow</option>
                    <option value="#ff00ff">Magenta</option>
                    <option value="#00ffff">Cyan</option>
                </select>
            )}

            <button className={activeTool === "measure" ? "active" : ""} onClick={() => setActiveTool("measure")}>
                Measure
            </button>

            {activeTool === "measure" && (
                <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value)}>
                    <option value="line">Distance</option>
                    <option value="cone">Cone</option>
                </select>
            )}

            <button onClick={() => setShowTokenCreator(true)}>
                Add Token
            </button>

            {showTokenCreator && <TokenCreator onCreate={handleTokenCreate} onClose={() => setShowTokenCreator(false)} />}

            <div className="session-code">
                <span>Session Code</span>
                <strong>{sessionCode}</strong>
            </div>
        </aside>
    );
}
