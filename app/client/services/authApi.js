export async function login(username, password) {
    const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
    });

    const data = response.ok ? null : await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || "Unable to log in. Please try again.");

    return data;
}

export async function register(username, password) {
    const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) throw new Error(response.status === 400 ? "Please check your information and try again." : "Unable to create your account.");

    return response.json().catch(() => null);
}

export async function logout() {
    const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include"
    });

    if (!response.ok) throw new Error("Failed to log out.");
}

export async function getCurrentUser() {
    const response = await fetch("/auth/me", {
        credentials: "include"
    });

    if (!response.ok) throw new Error("Unable to get current user.");

    return response.json();
}
