import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        fetch("/auth/me", {
            credentials: "include"
        })
            .then(response => {
                if (response.ok) {
                    setAuthorized(true);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return null;
    }

    if (!authorized) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
