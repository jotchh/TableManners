import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/register.css";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                navigate("/login");
                return;
            }

            if (response.status === 400) {
                setError("Please check your information and try again.");
            } else {
                setError("Unable to create your account.");
            }
        } catch (error) {
            setError("Unable to connect to the server.");
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <Link to="/" className="register-logo">
                    TableManners
                </Link>

                <h2>Create Account</h2>

                {error && (
                    <p className="register-error">{error}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            minLength={3}
                            maxLength={25}
                            pattern="[a-zA-Z0-9_]+"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            maxLength={128}
                            required
                        />
                    </label>

                    <button type="submit">
                        Register
                    </button>
                </form>

                <p className="register-login">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    );
}

