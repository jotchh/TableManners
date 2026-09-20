const express = require("express");
const bcrypt = require("bcrypt");

module.exports = function(pool, tokenStorage, makeToken, cookieOptions) {
    const router = express.Router();

    function validString(username) {
        return /^[a-zA-Z0-9_]+$/.test(username)
    }

    function validateLogin(body) {
        if (!body || typeof body !== "object") {
            return false;
        }

        const { username, password } = body;
        return (typeof username === "string" && typeof password === "string" && username.length > 0 && password.length > 0);
    }

    function validateRegister(body) {
        if (!body || typeof body !== "object") {
            return false;
        }
        
        const { username, password } = body;
        
        if (typeof username !== "string" ||  typeof password !== "string") {
            return false;
        }

        const cleanUsername = username.trim();

        return (cleanUsername.length >= 3 && cleanUsername.length <= 25 && validString(cleanUsername) && validString(password) && password.length >= 8 && password.length <= 128);
    }

    router.post("/register", async (req, res) => {
        if (!validateRegister(req.body)) {
            return res.sendStatus(400);
        }

        const { username, password } = req.body;

        let hash;

        try {
            hash = await bcrypt.hash(password, 10);
        } catch (error) {
            console.error("HASH FAILED", error);
            return res.sendStatus(500);
        }

        try {
            await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2)", [username, hash]);
        } catch (error) {
            console.error("INSERT FAILED", error);
            return res.sendStatus(500);
        }

        return res.status(200).redirect('/login.html');
    });

    router.post("/login", async (req, res) => {
        if (!validateLogin(req.body)) {
            return res.status(400).json({
                error: "Username and password are required."
            });
        }
        const { username, password } = req.body;
        let result;
        try {
            result = await pool.query(
                "SELECT id, username, password_hash FROM users WHERE username = $1",
                [username]
            );
        } catch (error) {
            console.error("SELECT FAILED", error);

            return res.status(500).json({
                error: "Unable to log in. Please try again later."
            });
        }

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Incorrect username or password."
            });
        }
        const user = result.rows[0];
        let verifyResult;
        try {
            verifyResult = await bcrypt.compare(
                password,
                user.password_hash
            );
        } catch (error) {
            console.error("VERIFY FAILED", error);
            return res.status(500).json({
                error: "Unable to log in. Please try again later."
            });
        }

        if (!verifyResult) {
            return res.status(401).json({
                error: "Incorrect username or password."
            });
        }

        const token = makeToken();
        tokenStorage[token] = {
            id: user.id,
            username: user.username
        };

        res.cookie("token", token, cookieOptions);
        return res.sendStatus(200);
    });

    router.post("/logout", (req, res) => {
        const { token } = req.cookies;

        if (token === undefined) {
            return res.sendStatus(400);
        }

        if (!Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
            return res.sendStatus(400);
        }

        delete tokenStorage[token];
        res.clearCookie("token", cookieOptions);

        return res.status(200).redirect("/index.html");
    });

    router.get("/me", (req, res) => {
        const { token } = req.cookies;

        if (!token || !Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
            return res.sendStatus(401);
        }

        return res.json(tokenStorage[token]);
    });

    return router;
};
