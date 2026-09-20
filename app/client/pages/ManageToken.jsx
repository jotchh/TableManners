import { useEffect, useState } from "react";
import "../styles/manageTokens.css";
import Header from "../components/Header.jsx";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ManageTokens() {
    const [tokens, setTokens] = useState([]);
    const [name, setName] = useState("");
    const [image, setImage] = useState(null);
    const [error, setError] = useState("");

    const loadTokens = async () => {
        try {
            const response = await fetch("/api/tokens", {
                credentials: "include"
            });

            if (!response.ok) {
                setError("Failed to load tokens.");
                return;
            }

            const data = await response.json();

            setTokens(data);
        } catch (error) {
            console.error("TOKEN LOAD FAILED", error);

            setError("Failed to load tokens.");
        }
    };

    useEffect(() => {
        loadTokens();
    }, []);

    const handleCreateToken = async event => {
        event.preventDefault();

        if (!name.trim() || !image) {
            setError("Token name and image are required.");
            return;
        }

        if (image.size > MAX_FILE_SIZE) {
            setError("Image must be under 5 MB.");
            return;
        }

        setError("");

        const formData = new FormData();

        formData.append("name", name.trim());
        formData.append("image", image);

        try {
            const response = await fetch("/api/tokens", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                setError(
                    data?.error || "Failed to create token."
                );

                return;
            }

            setName("");
            setImage(null);

            event.target.reset();

            await loadTokens();

        } catch (error) {
            console.error("TOKEN CREATE FAILED", error);

            setError("Failed to create token.");
        }
    };

    const handleDeleteToken = async tokenId => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this token?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `/api/tokens/${tokenId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                setError(
                    data?.error || "Failed to delete token."
                );

                return;
            }

            setTokens(current =>
                current.filter(token => token.id !== tokenId)
            );

        } catch (error) {
            console.error("TOKEN DELETE FAILED", error);

            setError("Failed to delete token.");
        }
    };

    return (
        <div className="tokens-page">
            <Header />

            <main className="tokens-container">
                <h1>Token Library</h1>

                <form
                    className="token-create-form"
                    onSubmit={handleCreateToken}
                >
                    <label>
                        Token Name
                        <input
                            type="text"
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder="Goblin"
                            maxLength={100}
                        />
                    </label>

                    <label>
                        Token Image
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={event =>
                                setImage(event.target.files[0] || null)
                            }
                        />
                    </label>

                    <button type="submit">Create Token</button>

                    {error && (
                        <p className="tokens-error">{error}</p>
                    )}
                </form>

                <section className="token-library">
                    <h2>Your Tokens</h2>

                    {tokens.length === 0 ? (
                        <p className="tokens-empty">
                            You haven't created any tokens yet.
                        </p>
                    ) : (
                        <div className="token-grid">
                            {tokens.map(token => (
                                <div
                                    key={token.id}
                                    className="token-card"
                                >
                                    <img
                                        src={token.image_url || token.imageUrl}
                                        alt={token.name}
                                    />

                                    <div className="token-card-info">
                                        <h3>{token.name}</h3>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteToken(token.id)}
                                        >
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
