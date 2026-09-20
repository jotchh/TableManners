import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/createGame.css";

export default function CreateGame() {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Enter a game name.");
            return;
        }

        setCreating(true);

        try {
            const gameResponse = await fetch("/api/games", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    name: name.trim()
                })
            });

            if (!gameResponse.ok) {
                throw new Error();
            }

            const game = await gameResponse.json();

            const sessionResponse = await fetch("/api/sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    gameId: game.id
                })
            });

            if (!sessionResponse.ok) {
                throw new Error();
            }

            const session = await sessionResponse.json();

            window.location.href = `/games/${game.id}?session=${session.code}`;
        } catch (error) {
            console.error("CREATE GAME FAILED:", error);
            setError("Unable to create game.");
            setCreating(false);
        }
    };

    return (
        <div className="create-game-page">
            <div className="create-game-card">
                <h1>Create Game</h1>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="game-name">
                        Game Name
                    </label>

                    <input
                        id="game-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="My Campaign"
                        maxLength={255}
                    />

                    {error && (
                        <p className="create-game-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={creating}
                    >
                        {creating ? "Creating..." : "Create Game"}
                    </button>
                </form>
            </div>
        </div>
    );
}
