export async function getTokens() {
    const response = await fetch("/api/tokens", {
        credentials: "include"
    });

    if (!response.ok) throw new Error("Failed to load tokens.");

    return response.json();
}

export async function createToken(name, image) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);

    const response = await fetch("/api/tokens", {
        method: "POST",
        credentials: "include",
        body: formData
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) throw new Error(data?.error || "Failed to create token.");

    return data;
}

export async function deleteToken(tokenId) {
    const response = await fetch(`/api/tokens/${tokenId}`, {
        method: "DELETE",
        credentials: "include"
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) throw new Error(data?.error || "Failed to delete token.");

    return data;
}
