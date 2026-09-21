
import { createContext, useContext, useState } from "react";

export const CanvasContext = createContext(null);

export function CanvasProvider({ children }) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 100, y: 100 });
    const [activeTool, setActiveTool] = useState("select");
    const [activeAoE, setActiveAoE] = useState("circle");
    const [measurementType, setMeasurementType] = useState("line");

    return (
        <CanvasContext.Provider
            value={{
                zoom, setZoom,
                pan, setPan,
                activeTool, setActiveTool,
                activeAoE, setActiveAoE,
                measurementType, setMeasurementType
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
}

export function useCanvas() {
    const context = useContext(CanvasContext);

    if (!context) {
        throw new Error("useCanvas must be used inside a CanvasProvider");
    }

    return context;
}
