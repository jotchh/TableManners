import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas.jsx";
import BattleMap from "../components/BattleMap.jsx";
import TokenLayer from "../components/TokenLayer.jsx";
import DrawingLayer from "../components/DrawingLayer.jsx";
import MessageSidebar from "../components/MessageSidebar.jsx";
import MeasurementLayer from "../components/MeasurementLayer.jsx";
import CursorLayer from "../components/CursorLayer.jsx";
import ActionSidebar from "../components/ActionSidebar.jsx";
import { CanvasProvider } from "../context/CanvasContext.jsx";
import "../styles/game.css";

export default function Game() {
    const [tokens, setTokens] = useState([]);
    const [tokenMovements, setTokenMovements] = useState({});
    const [selectedObject, setSelectedObject] = useState(null);
    const [drawings, setDrawings] = useState([]);
    const [cursors, setCursors] = useState({});
    const [measurements, setMeasurements] = useState({});
    const [revision, setRevision] = useState(0);
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();

    const { gameId } = useParams();
    const [searchParams] = useSearchParams();
    const sessionCode = searchParams.get("session");

    const socketRef = useRef(null);
    const playerIdRef = useRef(null);

    useEffect(() => {
        if (!sessionCode) return;

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const socket = new WebSocket(`${protocol}//${window.location.host}`);

        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "join-session",
                code: sessionCode
            }));
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "session-joined") {
                playerIdRef.current = message.playerId;
            }

            if (message.type === "game-state") {
                setRevision(message.revision);
                setTokens(message.state?.tokens || []);
                setDrawings(message.state?.drawings || []);
            }

            if (message.type === "state-update") {
                setTokens(message.state?.tokens || []);
                setDrawings(message.state?.drawings || []);
            }

            if (message.type === "token-created") {
                setTokens(current => [
                    ...current,
                    message.token
                ]);
            }

            if (message.type === "token-moved") {
                setTokens(current =>
                    current.map(token =>
                        token.id === message.tokenId
                            ? {
                                ...token,
                                x: message.x,
                                y: message.y
                            }
                            : token
                    )
                );

                if (message.dragging) {
                    setTokenMovements(current => ({
                        ...current,
                        [message.tokenId]: {
                            dragging: true,
                            startX: message.startX,
                            startY: message.startY
                        }
                    }));
                } else {
                    setTokenMovements(current => {
                        const next = { ...current };
                        delete next[message.tokenId];
                        return next;
                    });
                }
            }

            if (message.type === "token-resized") {
                setTokens(current =>
                    current.map(token =>
                        token.id === message.tokenId
                            ? {
                                ...token,
                                size: message.size
                            }
                            : token
                    )
                );
            }

            if (message.type === "token-deleted") {
                setTokens(current =>
                    current.filter(token =>
                        token.id !== message.tokenId
                    )
                );

                setTokenMovements(current => {
                    const next = { ...current };
                    delete next[message.tokenId];
                    return next;
                });
            }

            if (message.type === "drawing-created") {
                setDrawings(current => [
                    ...current,
                    message.drawing
                ]);
            }

            if (message.type === "drawing-moved") {
                setDrawings(current =>
                    current.map(drawing =>
                        drawing.id === message.drawingId
                            ? {
                                ...drawing,
                                points: message.points
                            }
                            : drawing
                    )
                );
            }

            if (message.type === "drawing-deleted") {
                setDrawings(current =>
                    current.filter(drawing =>
                        drawing.id !== message.drawingId
                    )
                );
            }

            if (message.type === "cursor-moved") {
                if (message.playerId === playerIdRef.current) return;

                setCursors(current => ({
                    ...current,
                    [message.playerId]: {
                        x: message.x,
                        y: message.y,
                        username: message.username,
                        color: message.color
                    }
                }));
            }

            if (message.type === "measurement-moved") {
                if (message.playerId === playerIdRef.current) return;

                setMeasurements(current => ({
                    ...current,
                    [message.playerId]: {
                        start: message.start,
                        end: message.end,
                        type: message.measurementType,
                        username: message.username,
                        color: message.color
                    }
                }));
            }

            if (message.type === "measurement-ended") {
                setMeasurements(current => {
                    const next = { ...current };
                    delete next[message.playerId];
                    return next;
                });
            }

            if (message.type === "player-left") {
                setMeasurements(current => {
                    const next = { ...current };
                    delete next[message.playerId];
                    return next;
                });

                setCursors(current => {
                    const next = { ...current };
                    delete next[message.playerId];
                    return next;
                });

                addSystemMessage(`${message.username} left the game.`);
            }

            if (message.type === "player-joined") {
                addSystemMessage(`${message.username} joined the game.`);
            }

            if (message.type === "chat-message") {
                setMessages(current => [
                    ...current,
                    {
                        id: crypto.randomUUID(),
                        type: "chat",
                        username: message.username,
                        message: message.message
                    }
                ]);
            }

            if (message.type === "session-ended") {
                navigate("/");
                return;
            }
        }

        socket.onclose = () => {
            console.log("Disconnected from session.");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socket.close();
            socketRef.current = null;
            playerIdRef.current = null;
        };
    }, [sessionCode]);

    const handleTokenMove = (id, x, y, dragging, startX, startY) => {
        setTokens(currentTokens =>
            currentTokens.map(token =>
                token.id === id
                    ? { ...token, x, y }
                    : token
            )
        );

        setTokenMovements(current => ({
            ...current,
            [id]: {
                dragging,
                startX,
                startY
            }
        }));

        if (!dragging) {
            setTokenMovements(current => {
                const next = { ...current };
                delete next[id];
                return next;
            });
        }

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "token-moved",
                tokenId: id,
                x,
                y,
                dragging,
                startX,
                startY
            }));
        }
    };

    const handleTokenDelete = (id) => {
        setTokens(currentTokens =>
            currentTokens.filter(token => token.id !== id)
        );

        setTokenMovements(current => {
            const next = { ...current };
            delete next[id];
            return next;
        });

        setSelectedObject(null);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "token-deleted",
                tokenId: id
            }));
        }
    };

    const handleMeasurementMove = (start, end, measurementType) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "measurement-moved",
                start,
                end,
                measurementType
            }));
        }
    };

    const handleMeasurementEnd = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "measurement-ended"
            }));
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== "Delete" && e.key !== "Backspace") return;
            if (selectedObject?.type !== "token") return;

            handleTokenDelete(selectedObject.id);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedObject]);

    const handleTokenSelect = (id) => {
        setSelectedObject({
            type: "token",
            id
        });
    };

    const handleTokenResize = (id, size) => {
        setTokens(currentTokens =>
            currentTokens.map(token =>
                token.id === id
                    ? { ...token, size }
                    : token
            )
        );

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "token-resized",
                tokenId: id,
                size
            }));
        }
    };

    const handleDrawingSelect = (id) => {
        setSelectedObject(
            id
                ? { type: "drawing", id }
                : null
        );
    };

    const handleDrawingCreate = (drawing) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "drawing-created",
                drawing
            }));
        }
    };

    const handleDrawingMove = (id, points) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "drawing-moved",
                drawingId: id,
                points
            }));
        }
    };

    const handleDrawingDelete = (id) => {
        setDrawings(currentDrawings =>
            currentDrawings.filter(drawing => drawing.id !== id)
        );

        setSelectedObject(null);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "drawing-deleted",
                drawingId: id
            }));
        }
    };

    const handleCanvasClick = () => {
        setSelectedObject(null);
    };

    const handleTokenCreate = async (data) => {
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

        setTokens(currentTokens => [...currentTokens, newToken]);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "token-created",
                token: newToken
            }));
        }
    };

    const handleCursorMove = (x, y) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "cursor-moved",
                x,
                y
            }));
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/games/${gameId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    state: {
                        tokens,
                        drawings
                    }
                })
            });

            if (!response.ok) {
                throw new Error("Failed to save game.");
            }

            addSystemMessage("Game saved.");
        } catch (error) {
            console.error("SAVE GAME FAILED:", error);
            addSystemMessage("Failed to save game.");
        }
    };

    const addSystemMessage = (message) => {
        setMessages(current => [
            ...current,
            {
                id: crypto.randomUUID(),
                type: "system",
                message
            }
        ]);
    };

    const handleSendMessage = (message) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type: "chat-message",
                message
            }));
        }
    };

    return (
        <CanvasProvider>
            <div className="game">
                <div className="tabletop">
                    <ActionSidebar
                        sessionCode={sessionCode}
                        onTokenCreate={handleTokenCreate}
                    />

                    <div className="canvas-container">
                        <Canvas
                            onClick={handleCanvasClick}
                            onCursorMove={handleCursorMove}
                            overlay={<CursorLayer cursors={cursors} />}
                        >
                            <BattleMap
                                rows={20}
                                columns={20}
                                cellSize={50}
                            />

                            <DrawingLayer
                                drawings={drawings}
                                setDrawings={setDrawings}
                                selectedId={
                                    selectedObject?.type === "drawing"
                                        ? selectedObject.id
                                        : null
                                }
                                onSelect={handleDrawingSelect}
                                onDrawingCreate={handleDrawingCreate}
                                onDrawingMove={handleDrawingMove}
                                onDrawingDelete={handleDrawingDelete}
                            />

                            <TokenLayer
                                tokens={tokens.map(token => ({
                                    ...token,
                                    selected:
                                        selectedObject?.type === "token" &&
                                        selectedObject.id === token.id,
                                    movement: tokenMovements[token.id]
                                }))}
                                cellSize={50}
                                onTokenMove={handleTokenMove}
                                onTokenSelect={handleTokenSelect}
                                onTokenResize={handleTokenResize}
                            />

                            <MeasurementLayer
                                cellSize={50}
                                measurements={measurements}
                                onMeasurementMove={handleMeasurementMove}
                                onMeasurementEnd={handleMeasurementEnd}
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
                        onSendMessage={handleSendMessage}
                    />
                </div>
            </div>
        </CanvasProvider>
    );
}
