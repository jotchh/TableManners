import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function Header() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await fetch("/auth/me", {
                    credentials: "include"
                });

                if (!response.ok) return;

                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error("AUTH CHECK FAILED", error);
            }
        };

        loadUser();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch("/auth/logout", {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) {
                console.error("LOGOUT FAILED");
                return;
            }

            setUser(null);
            navigate("/login");
        } catch (error) {
            console.error("LOGOUT FAILED", error);
        }
    };

    return (
        <header className="site-header">
            <Link to="/dashboard" className="site-logo">
                TableManners
            </Link>

            <nav>
                {user ? (
                    <>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/tokens">Token Manager</Link>

                        <span className="header-account">
                            {user.username}
                        </span>

                        <button
                            className="header-logout"
                            onClick={handleLogout}
                        >
                            Log Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Log In</Link>
                        <Link
                            to="/register"
                            className="header-register"
                        >
                            Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
