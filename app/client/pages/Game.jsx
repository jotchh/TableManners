import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas.jsx";
import BattleMap from "../components/BattleMap.jsx";
import TokenLayer from "../components/TokenLayer.jsx";
import MessageSidebar from "../components/MessageSidebar.jsx";
import MeasurementLayer from "../components/MeasurementLayer.jsx";
import CursorLayer from "../components/CursorLayer.jsx";
import ActionSidebar from "../components/ActionSidebar.jsx";
import { CanvasProvider } from "../context/CanvasContext.jsx";
import useGameSession from "../hooks/useGameSession.js";
import { saveGame } from "../services/gameApi.js";
import "../styles/game.css";

export default function Game() {
    const { gameId } = useParams();
    const [searchParams] = useSearchParams();
    const sessionCode = searchParams.get("session");
    const navigate = useNavigate();

    const {
        tokens,
        setTokens,
        mapSize,
        cursors,
        measurements,
        messages,
        send,
        sendChatMessage
    } = useGameSession(sessionCode, () => navigate("/"));

    const [selectedObject, setSelectedObject] = useState(null);
    const [tokenMovements, setTokenMovements] = useState({});

    const handleTokenMove = (id, x, y, dragging, startX, startY) => {
        setTokens(current =>
            current.map(token =>
                token.id === id ? { ...token, x, y } : token
            )
        );

        setTokenMovements(current => ({
            ...current,
            [id]: { dragging, startX, startY }
        }));

        if (!dragging) {
            setTokenMovements(current => {
                const next = { ...current };
                delete next[id];
                return next;
            });
        }

        send({
            type: "token-moved",
            tokenId: id,
            x,
            y,
            dragging,
            startX,
            startY
        });
    };

    const handleTokenDelete = id => {
        setTokens(current =>
            current.filter(token => token.id !== id)
        );

        setTokenMovements(current => {
            const next = { ...current };
            delete next[id];
            return next;
        });

        setSelectedObject(null);

        send({
            type: "token-deleted",
            tokenId: id
        });
    };

    const handleTokenSelect = id => {
        setSelectedObject({ type: "token", id });
    };

    const handleTokenResize = (id, size) => {
        setTokens(current =>
            current.map(token =>
                token.id === id ? { ...token, size } : token
            )
        );

        send({
            type: "token-resized",
            tokenId: id,
            size
        });
    };

    const handleCanvasClick = () => {
        setSelectedObject(null);
    };

    const handleTokenCreate = async data => {
        let libraryToken;

        if (data.type === "library") {
            libraryToken = data.token;
        } else if (data.type === "new") {
            try {
                const formData = new FormData();
                formData.append("name", data.name);
                formData.append("image", data.image);

                const response = await fetch("/api/tokens", {
                    method: "POST",
                    credentials: "include",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Failed to upload token.");
                }

                libraryToken = await response.json();
            } catch (error) {
                console.error("TOKEN UPLOAD FAILED:", error);
                return;
            }
        } else {
            return;
        }

        const newToken = {
            id: crypto.randomUUID(),
            tokenId: libraryToken.id,
            name: libraryToken.name,
            image: libraryToken.imageUrl,
            x: 1,
            y: 1,
            size: 1
        };

        setTokens(current => [...current, newToken]);

        send({
            type: "token-created",
            token: newToken
        });
    };

    const handleCursorMove = (x, y) => {
        send({
            type: "cursor-moved",
            x,
            y
        });
    };

    const handleMeasurementMove = (start, end, measurementType) => {
        send({
            type: "measurement-moved",
            start,
            end,
            measurementType
        });
    };

    const handleMeasurementEnd = () => {
        send({
            type: "measurement-ended"
        });
    };

    const handleMapResize = (rows, columns) => {
        rows = Math.max(1, Math.min(100, rows));
        columns = Math.max(1, Math.min(100, columns));

        send({
            type: "map-resized",
            rows,
            columns
        });
    };

    const handleSave = async () => {
        try {
            await saveGame(gameId, {
                map: mapSize,
                tokens
            });

            send({
                type: "system-message",
                message: "Game has been saved."
            });
        } catch (error) {
            sendChatMessage(
                `SAVE GAME FAILED: ${error.message}`
            );
        }
    };

    useEffect(() => {
        const handleKeyDown = event => {
            if (
                event.key !== "Delete" &&
                event.key !== "Backspace"
            ) {
                return;
            }

            if (selectedObject?.type === "token") {
                handleTokenDelete(selectedObject.id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedObject]);

    return (
        <CanvasProvider>
            <div className="game">
                <div className="tabletop">
                    <ActionSidebar
                        sessionCode={sessionCode}
                        rows={mapSize.rows}
                        columns={mapSize.columns}
                        onMapResize={handleMapResize}
                        onTokenCreate={handleTokenCreate}
                    />

                    <div className="canvas-container">
                        <Canvas
                            onClick={handleCanvasClick}
                            onCursorMove={handleCursorMove}
                            overlay={
                                <CursorLayer
                                    cursors={cursors}
                                />
                            }
                        >
                            <BattleMap
                                rows={mapSize.rows}
                                columns={mapSize.columns}
                                cellSize={50}
                            />

                            <TokenLayer
                                tokens={tokens.map(token => ({
                                    ...token,
                                    selected:
                                        selectedObject?.type === "token" &&
                                        selectedObject.id === token.id,
                                    movement:
                                        tokenMovements[token.id]
                                }))}
                                cellSize={50}
                                onTokenMove={handleTokenMove}
                                onTokenSelect={handleTokenSelect}
                                onTokenResize={handleTokenResize}
                            />

                            <MeasurementLayer
                                cellSize={50}
                                measurements={measurements}
                                onMeasurementMove={
                                    handleMeasurementMove
                                }
                                onMeasurementEnd={
                                    handleMeasurementEnd
                                }
                            />
                        </Canvas>

                        <div className="game-controls">
                            <button onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>

                    <MessageSidebar
                        messages={messages}
                        onSendMessage={sendChatMessage}
                    />
                </div>
            </div>
        </CanvasProvider>
    );
}
