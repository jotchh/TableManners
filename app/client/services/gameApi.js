export async function getOwnedGames() {
    const response = await fetch("/api/games/owned", {
        credentials: "include"
    });

    if (!response.ok) throw new Error("Failed to get games.");

    return response.json();
}

export async function getSession(code) {
    const response = await fetch(`/api/sessions/${code}`, {
        credentials: "include"
    });

    if (!response.ok) throw new Error("Session not found.");

    return response.json();
}

export async function createSession(gameId) {
    const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameId })
    });

    if (!response.ok) throw new Error("Failed to create session.");

    return response.json();
}

export async function deleteGame(gameId) {
    const response = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
        credentials: "include"
    });

    if (!response.ok) throw new Error("Failed to delete game.");
}

export async function saveGame(gameId, state) {
    const response = await fetch(`/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ state })
    });

    if (!response.ok) throw new Error("Failed to save game.");

    return response.json();
}
