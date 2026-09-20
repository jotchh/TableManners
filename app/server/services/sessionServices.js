const WebSocket = require("ws");

const sessions = new Map();

function generateSessionCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
}

function createSession(gameId, hostId, state = {}) {
    let code;

    do {
        code = generateSessionCode();
    } while (sessions.has(code));

    const session = {
        code,
        gameId,
        hostId,
        clients: new Set(),
        state: {
            tokens: Array.isArray(state.tokens) ? [...state.tokens] : [],
            drawings: Array.isArray(state.drawings) ? [...state.drawings] : []
        },
        revision: 0
    };

    sessions.set(code, session);
    return session;
}

function getSession(code) {
    return sessions.get(code);
}

function joinSession(code, ws) {
    const session = sessions.get(code);

    if (!session) return false;

    session.clients.add(ws);
    ws.sessionCode = code;

    return true;
}

function leaveSession(ws) {
    const code = ws.sessionCode;
    if (!code) return;

    const session = sessions.get(code);
    if (!session) return;

    session.clients.delete(ws);
    delete ws.sessionCode;

    if (session.clients.size === 0) {
        sessions.delete(code);
    }
}

function broadcast(code, message, exclude = null) {
    const session = sessions.get(code);
    if (!session) return;

    const data = JSON.stringify(message);

    for (const client of session.clients) {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

function broadcastState(session, ackPlayerId, ackSequence) {
    const message = {
        type: "state-update",
        revision: session.revision,
        ackPlayerId,
        ackSequence,
        state: session.state
    };

    broadcast(session.code, message);
}

function handleMessage(ws, message) {
    let data;

    try {
        data = JSON.parse(message);
    } catch {
        ws.send(JSON.stringify({
            type: "error",
            message: "Invalid message."
        }));
        return;
    }

    if (data.type === "join-session") {
        const code = data.code?.toUpperCase();
        const joined = joinSession(code, ws);

        if (!joined) {
            ws.send(JSON.stringify({
                type: "error",
                message: "Session not found."
            }));
            return;
        }

        const session = sessions.get(code);

        ws.send(JSON.stringify({
            type: "session-joined",
            code,
            playerId: ws.playerId,
            username: ws.username,
            color: ws.color
        }));

        ws.send(JSON.stringify({
            type: "game-state",
            revision: session.revision,
            state: session.state
        }));

        broadcast(code, {
            type: "player-joined",
            playerId: ws.playerId,
            username: ws.username,
            color: ws.color
        }, ws);

        return;
    }

    if (!ws.sessionCode) return;

    const session = sessions.get(ws.sessionCode);
    if (!session) return;

    if (data.type === "token-created") {
        const exists = session.state.tokens.some(
            token => token.id === data.token?.id
        );

        if (exists) return;

        session.state.tokens = [
            ...session.state.tokens,
            data.token
        ];

        session.revision++;

        broadcastState(
            session,
            ws.playerId,
            data.sequence
        );

        return;
    }

    if (data.type === "token-moved") {
        const tokenExists = session.state.tokens.some(
            token => token.id === data.tokenId
        );

        if (!tokenExists) return;

        session.state.tokens = session.state.tokens.map(token => {
            if (token.id !== data.tokenId) return token;

            return {
                ...token,
                x: data.x,
                y: data.y
            };
        });

        session.revision++;

        broadcast(ws.sessionCode, {
            type: "token-moved",
            tokenId: data.tokenId,
            x: data.x,
            y: data.y,
            dragging: data.dragging,
            startX: data.startX,
            startY: data.startY
        }, ws);

        return;
    }

    if (data.type === "token-resized") {
        const tokenExists = session.state.tokens.some(
            token => token.id === data.tokenId
        );

        if (!tokenExists) return;

        session.state.tokens = session.state.tokens.map(token => {
            if (token.id !== data.tokenId) return token;

            return {
                ...token,
                size: data.size
            };
        });

        session.revision++;

        broadcastState(
            session,
            ws.playerId,
            data.sequence
        );

        return;
    }

    if (data.type === "token-deleted") {
        session.state.tokens = session.state.tokens.filter(
            token => token.id !== data.tokenId
        );

        session.revision++;

        broadcastState(
            session,
            ws.playerId,
            data.sequence
        );

        return;
    }

    if (data.type === "drawing-created") {
        const exists = session.state.drawings.some(
            drawing => drawing.id === data.drawing?.id
        );

        if (exists) return;

        session.state.drawings = [
            ...session.state.drawings,
            data.drawing
        ];

        session.revision++;

        broadcastState(
            session,
            ws.playerId,
            data.sequence
        );

        return;
    }

    if (data.type === "drawing-moved") {
        const drawingExists = session.state.drawings.some(
            drawing => drawing.id === data.drawingId
        );

        if (!drawingExists) return;

        session.state.drawings = session.state.drawings.map(drawing => {
            if (drawing.id !== data.drawingId) return drawing;

            return {
                ...drawing,
                points: data.points
            };
        });

        session.revision++;

        broadcastState(
            session,
            ws.playerId,
            data.sequence
        );

        return;
    }

    if (data.type === "drawing-deleted") {
        session.state.drawings = session.state.drawings.filter(
            drawing => drawing.id !== data.drawingId
        );

        session.revision++;

        broadcastState(
            session,
            ws.playerId,
            data.sequence
        );

        return;
    }

    if (data.type === "cursor-moved") {
        broadcast(ws.sessionCode, {
            type: "cursor-moved",
            playerId: ws.playerId,
            username: ws.username,
            color: ws.color,
            x: data.x,
            y: data.y
        }, ws);

        return;
    }

    if (data.type === "chat-message") {
        const message = data.message?.trim();

        if (!message) return;

        broadcast(ws.sessionCode, {
            type: "chat-message",
            playerId: ws.playerId,
            username: ws.username,
            message
        });

        return;
    }

    if (data.type === "measurement-moved") {
        broadcast(ws.sessionCode, {
            type: "measurement-moved",
            playerId: ws.playerId,
            username: ws.username,
            color: ws.color,
            start: data.start,
            end: data.end,
            measurementType: data.measurementType
        }, ws);

        return;
    }

    if (data.type === "measurement-ended") {
        broadcast(ws.sessionCode, {
            type: "measurement-ended",
            playerId: ws.playerId
        }, ws);

        return;
    }
}

function endSession(code) {
    const session = sessions.get(code);

    if (!session) return false;

    for (const client of session.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "session-ended"
            }));
        }

        client.close();
        delete client.sessionCode;
    }

    session.clients.clear();
    sessions.delete(code);

    return true;
}


function handleDisconnect(ws) {
    const code = ws.sessionCode;

    if (!code) return;

    const session = sessions.get(code);

    if (!session) return;

    if (ws.playerId === session.hostId) {
        endSession(code);
        return;
    }
    
    const playerId = ws.playerId;
    const username = ws.username;

    leaveSession(ws);

    broadcast(code, {
        type: "player-left",
        playerId,
        username
    });
}

module.exports = {
    createSession,
    getSession,
    joinSession,
    leaveSession,
    endSession,
    broadcast,
    handleMessage,
    handleDisconnect
};
