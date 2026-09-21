import { useEffect, useRef, useState } from "react";

export default function useGameSession(sessionCode, onSessionEnded) {
    const socketRef = useRef(null);
    const playerIdRef = useRef(null);
    const onSessionEndedRef = useRef(onSessionEnded);

    const [tokens, setTokens] = useState([]);
    const [mapSize, setMapSize] = useState({ rows: 20, columns: 20 });
    const [cursors, setCursors] = useState({});
    const [measurements, setMeasurements] = useState({});
    const [messages, setMessages] = useState([]);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        onSessionEndedRef.current = onSessionEnded;
    }, [onSessionEnded]);

    const send = message => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
            return false;
        }

        socketRef.current.send(JSON.stringify(message));
        return true;
    };

    const addSystemMessage = message => {
        setMessages(current => [
            ...current,
            {
                id: crypto.randomUUID(),
                type: "system",
                message
            }
        ]);
    };

    const handleMessage = message => {
        switch (message.type) {
            case "session-joined":
                playerIdRef.current = message.playerId;
                break;

            case "game-state":
            case "state-update":
                setRevision(message.revision);
                setTokens(message.state?.tokens || []);
                setMapSize(
                    message.state?.map || {
                        rows: 20,
                        columns: 20
                    }
                );
                break;

            case "token-created":
                setTokens(current =>
                    current.some(
                        token => token.id === message.token?.id
                    )
                        ? current
                        : [...current, message.token]
                );
                break;

            case "token-moved":
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
                break;

            case "token-resized":
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
                break;

            case "token-deleted":
                setTokens(current =>
                    current.filter(
                        token => token.id !== message.tokenId
                    )
                );
                break;

            case "cursor-moved":
                if (message.playerId === playerIdRef.current) {
                    break;
                }

                setCursors(current => ({
                    ...current,
                    [message.playerId]: {
                        x: message.x,
                        y: message.y,
                        username: message.username,
                        color: message.color
                    }
                }));
                break;

            case "measurement-moved":
                if (message.playerId === playerIdRef.current) {
                    break;
                }

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
                break;

            case "measurement-ended":
                setMeasurements(current => {
                    const next = { ...current };
                    delete next[message.playerId];
                    return next;
                });
                break;

            case "player-left":
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

                addSystemMessage(
                    `${message.username} left the game.`
                );
                break;

            case "player-joined":
                addSystemMessage(
                    `${message.username} joined the game.`
                );
                break;

            case "chat-message":
                setMessages(current => [
                    ...current,
                    {
                        id: crypto.randomUUID(),
                        type: "chat",
                        username: message.username,
                        message: message.message
                    }
                ]);
                break;

            case "system-message":
                setMessages(current => [
                    ...current,
                    {
                        id: crypto.randomUUID(),
                        type: "system",
                        message: message.message
                    }
                ]);
                break;

            case "session-ended":
                onSessionEndedRef.current();
                break;

            default:
                break;
        }
    };

    useEffect(() => {
        if (!sessionCode) return;

        const protocol =
            window.location.protocol === "https:"
                ? "wss:"
                : "ws:";

        const socket = new WebSocket(
            `${protocol}//${window.location.host}`
        );

        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(
                JSON.stringify({
                    type: "join-session",
                    code: sessionCode
                })
            );
        };

        socket.onmessage = event => {
            try {
                handleMessage(JSON.parse(event.data));
            } catch (error) {
                console.error(
                    "INVALID WEBSOCKET MESSAGE:",
                    error
                );
            }
        };

        socket.onclose = () => {
            console.log("Disconnected from session.");
        };

        socket.onerror = error => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socket.close();
            socketRef.current = null;
            playerIdRef.current = null;
        };
    }, [sessionCode]);

    const sendChatMessage = message => {
        const trimmedMessage = message.trim();

        if (!trimmedMessage) return;

        send({
            type: "chat-message",
            message: trimmedMessage
        });
    };

    return {
        tokens,
        setTokens,
        mapSize,
        cursors,
        measurements,
        messages,
        revision,
        send,
        sendChatMessage
    };
}
