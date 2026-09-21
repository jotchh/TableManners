import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authApi.js";
import "../styles/login.css";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");

        try {
            await login(username, password);
            navigate("/dashboard");
        } catch (error) {
            console.error("LOGIN FAILED:", error);
            setError(error.message);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <Link to="/" className="login-logo">TableManners</Link>

                <h2>Log In</h2>

                {error && <p className="login-error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    <button type="submit">Log In</button>
                </form>

                <p className="login-register">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
