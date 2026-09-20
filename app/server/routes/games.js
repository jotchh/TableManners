const express = require("express");

module.exports = function(pool, authorize) {
    const router = express.Router();

    router.post("/", authorize, async (req, res) => {
        const { name } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.sendStatus(400);
        }

        try {
            const result = await pool.query(
                "INSERT INTO games (name, master, state) VALUES ($1, $2, $3) RETURNING id",
                [name.trim(), req.user.id, {}]
            );

            return res.status(201).json({
                id: result.rows[0].id
            });
        } catch (error) {
            console.error("GAME CREATE FAILED", error);
            return res.sendStatus(500);
        }
    });

    router.get("/owned", authorize, async (req, res) => {
        const search = req.query.search?.trim() || "";

        try {
            const result = await pool.query(
                `SELECT id, name, state
                 FROM games
                 WHERE master = $1
                 AND name ILIKE $2
                 ORDER BY id DESC`,
                [req.user.id, `%${search}%`]
            );

            return res.json(result.rows);
        } catch (error) {
            console.error("GAME SEARCH FAILED", error);
            return res.sendStatus(500);
        }
    });

    router.get("/:id", authorize, async (req, res) => {
        const { id } = req.params;
        const { session: sessionCode } = req.query;

        try {
            if (!sessionCode) {
                const result = await pool.query(
                    `SELECT id, name, state
                    FROM games
                    WHERE id = $1
                    AND master = $2`,
                    [id, req.user.id]
                );

                if (result.rows.length === 0) {
                    return res.sendStatus(404);
                }

                return res.json(result.rows[0]);
            }

            const session = sessionService.getSession(
                sessionCode.toUpperCase()
            );

            if (!session) {
                return res.sendStatus(404);
            }

            if (session.gameId !== Number(id)) {
                return res.sendStatus(403);
            }

            if (!session.clients.has(req.user.id)) {
                return res.sendStatus(403);
            }

            const result = await pool.query(
                `SELECT id, name, state
                FROM games
                WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.sendStatus(404);
            }

            return res.json(result.rows[0]);
        } catch (error) {
            console.error("GAME LOAD FAILED", error);
            return res.sendStatus(500);
        }
    });
    
   router.put("/:id", authorize, async (req, res) => {
        const gameId = req.params.id;
        const { state } = req.body;

        if (!state || typeof state !== "object") {
            return res.status(400).json({
                error: "Valid game state is required."
            });
        }

        try {
            const result = await pool.query(
                `SELECT id, master
                FROM games
                WHERE id = $1`,
                [gameId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Game does not exist."
                });
            }

            if (result.rows[0].master !== req.user.id) {
                return res.status(403).json({
                    error: "You are not the game master."
                });
            }

            const savedGame = await pool.query(
                `UPDATE games
                SET state = $1
                WHERE id = $2
                RETURNING id, name, state`,
                [state, gameId]
            );

            return res.json(savedGame.rows[0]);
        } catch (error) {
            console.error("GAME SAVE FAILED", error);
            return res.status(500).json({
                error: "Failed to save game."
            });
        }
    });

    router.delete("/:id", authorize, async (req, res) => {
        const gameId = req.params.id;

        try {
            const result = await pool.query(
                `DELETE FROM games
                WHERE id = $1
                AND master = $2
                RETURNING id`,
                [gameId, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Game not found."
                });
            }

            return res.sendStatus(204);
        } catch (error) {
            console.error("GAME DELETE FAILED", error);
            return res.status(500).json({
                error: "Failed to delete game."
            });
        }
    });
    
    return router;
};
