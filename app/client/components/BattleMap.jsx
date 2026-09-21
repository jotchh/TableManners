import "../styles/battleMap.css";

export default function BattleMap({ rows = 20, columns = 20, cellSize = 50 }) {
    const cells = [];

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            cells.push(
                <div
                    className="battlemap-cell"
                    key={`${column}-${row}`}
                />
            );
        }
    }

    return (
        <div
            className="battlemap"
            style={{
                width: columns * cellSize,
                height: rows * cellSize,
                gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`
            }}
        >
            {cells}
        </div>
    );
}
