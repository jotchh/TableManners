import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { getCurrentUser } from "../services/authApi.js";
import { createSession, deleteGame, getOwnedGames, getSession } from "../services/gameApi.js";
import "../styles/dashboard.css";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [games, setGames] = useState([]);
    const [sessionCode, setSessionCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const userData = await getCurrentUser();
                const gamesData = await getOwnedGames();

                setUser(userData);
                setGames(gamesData);
            } catch {
                navigate("/login");
            }
        };

        loadDashboard();
    }, [navigate]);

    const handleJoinGame = async () => {
        const code = sessionCode.trim().toUpperCase();
        if (!code) return;

        setJoinError("");

        try {
            const session = await getSession(code);
            navigate(`/games/${session.gameId}?session=${session.code}`);
        } catch {
            setJoinError("Session not found.");
        }
    };

    const handleOpenGame = async gameId => {
        try {
            const session = await createSession(gameId);
            navigate(`/games/${gameId}?session=${session.code}`);
        } catch (error) {
            console.error("OPEN GAME FAILED:", error);
        }
    };

    const handleDeleteGame = async gameId => {
        if (!window.confirm("Are you sure you want to delete this game?")) return;

        try {
            await deleteGame(gameId);
            setGames(currentGames => currentGames.filter(game => game.id !== gameId));
        } catch (error) {
            console.error("DELETE GAME FAILED:", error);
        }
    };

    if (!user) return null;

    return (
        <div className="dashboard-page">
            <Header />

            <main className="dashboard-content">
                <div className="dashboard-title">
                    <h1>Welcome, {user.username}</h1>
                    <p>Manage your games and start playing.</p>
                </div>

                <div className="dashboard-actions">
                    <Link to="/games/create" className="dashboard-create">Create Game</Link>

                    <div className="dashboard-join">
                        <input
                            value={sessionCode}
                            onChange={e => setSessionCode(e.target.value)}
                            placeholder="Session Code"
                            maxLength={6}
                        />
                        <button onClick={handleJoinGame}>Join Game</button>
                        {joinError && <p>{joinError}</p>}
                    </div>
                </div>

                <section className="dashboard-games">
                    <h2>Your Games</h2>

                    {games.length === 0 ? (
                        <div className="dashboard-empty">
                            <p>You haven't created any games yet.</p>
                            <Link to="/games/create">Create your first game</Link>
                        </div>
                    ) : (
                        <div className="dashboard-game-list">
                            {games.map(game => (
                                <div key={game.id} className="dashboard-game">
                                    <div>
                                        <h3>{game.name}</h3>
                                    </div>

                                    <div className="dashboard-actions">
                                        <button className="dashboard-game-button" onClick={() => handleOpenGame(game.id)}>
                                            Open
                                        </button>
                                        <button className="dashboard-game-button" onClick={() => handleDeleteGame(game.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
