import Token from "./Token.jsx";

export default function TokenLayer({ tokens = [], cellSize = 50, onTokenMove, onTokenSelect, onTokenResize }) {
    return (
        <div className="token-layer">
            {tokens.map(token => (
                <Token
                    key={token.id}
                    {...token}
                    cellSize={cellSize}
                    onMove={onTokenMove}
                    onSelect={onTokenSelect}
                    onResize={onTokenResize}
                />
            ))}
        </div>
    );
}
