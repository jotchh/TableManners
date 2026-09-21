import "../styles/mapControls.css";

export default function MapControls({
    rows,
    columns,
    onResize,
}) {
    return (
        <div className="map-controls">
            <h2>Map Controls</h2>

            <div className="map-control-group">
                <span>Rows: {rows}</span>
                <button
                    onClick={() => onResize(rows - 1, columns)}
                    disabled={rows <= 1}
                >
                    −
                </button>
                <button
                    onClick={() => onResize(rows + 1, columns)}
                    disabled={rows >= 100}
                >
                    +
                </button>
            </div>

            <div className="map-control-group">
                <span>Columns: {columns}</span>
                <button
                    onClick={() => onResize(rows, columns - 1)}
                    disabled={columns <= 1}
                >
                    −
                </button>
                <button
                    onClick={() => onResize(rows, columns + 1)}
                    disabled={columns >= 100}
                >
                    +
                </button>
            </div>
        </div>
    );
}
