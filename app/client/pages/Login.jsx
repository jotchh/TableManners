import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    password
                })
            });

            if (response.ok) {
                navigate("/dashboard");
                return;
            }

            const data = await response.json();

            setError(data.error || "Unable to log in. Please try again.");
        } catch (error) {
            console.error("LOGIN FAILED", error);
            setError("Unable to connect to the server.");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <Link to="/" className="login-logo">
                    TableManners
                </Link>

                <h2>Log In</h2>

                {error && (
                    <p className="login-error">{error}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    <button type="submit">
                        Log In
                    </button>
                </form>

                <p className="login-register">
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
