import { useEffect, useState } from "react";
import "../styles/tokenCreator.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function TokenCreator({ onCreate, onClose }) {
    const [mode, setMode] = useState("new");

    const [name, setName] = useState("");
    const [image, setImage] = useState(null);

    const [tokens, setTokens] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadTokens = async () => {
            try {
                const response = await fetch("/api/tokens", {
                    credentials: "include"
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                setTokens(data);
            } catch (error) {
                console.error("TOKEN LIBRARY LOAD FAILED", error);
            }
        };

        loadTokens();
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!name.trim() || !image) {
            setError("Name and image are required.");
            return;
        }

        if (image.size > MAX_FILE_SIZE) {
            setError("Image must be under 5 MB.");
            return;
        }

        setError("");

        onCreate({
            type: "new",
            name: name.trim(),
            image
        });
    };

    const handleLibraryToken = (token) => {
        setLoading(true);
        setError("");

        onCreate({
            type: "library",
            token
        });
    };

    return (
        <div className="token-overlay" onClick={onClose}>
            <div
                className="token-creator"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="token-creator-header">
                    <h3>Add Token</h3>

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="token-creator-tabs">
                    <button
                        type="button"
                        className={
                            mode === "new"
                                ? "active"
                                : ""
                        }
                        onClick={() => {
                            setMode("new");
                            setError("");
                        }}
                    >
                        New Token
                    </button>

                    <button
                        type="button"
                        className={
                            mode === "library"
                                ? "active"
                                : ""
                        }
                        onClick={() => {
                            setMode("library");
                            setError("");
                        }}
                    >
                        From Library
                    </button>
                </div>

                {mode === "new" ? (
                    <form onSubmit={handleSubmit}>
                        <label>
                            Name

                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Goblin"
                                maxLength={100}
                            />
                        </label>

                        <label>
                            Image

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(event) =>
                                    setImage(
                                        event.target.files[0] || null
                                    )
                                }
                            />
                        </label>

                        {error && (
                            <p className="token-creator-error">
                                {error}
                            </p>
                        )}

                        <button type="submit">
                            Create Token
                        </button>
                    </form>
                ) : (
                    <div className="token-library-select">
                        {tokens.length === 0 ? (
                            <p className="token-library-empty">
                                You haven't created any tokens yet.
                            </p>
                        ) : (
                            <>
                                <p className="token-library-label">
                                    Select a token
                                </p>

                                <div className="token-library-grid">
                                    {tokens.map(token => (
                                        <button
                                            type="button"
                                            key={token.id}
                                            className="token-library-item"
                                            onClick={() =>
                                                handleLibraryToken(token)
                                            }
                                            disabled={loading}
                                        >
                                            <img
                                                src={token.imageUrl}
                                                alt={token.name}
                                            />

                                            <span>
                                                {token.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="token-creator-error">
                                {error}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
