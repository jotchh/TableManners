const express = require("express");

module.exports = function(sessionService, authorize, pool) {
    const router = express.Router();

    router.post("/", authorize, async (req, res) => {
        const { gameId } = req.body;

        if (!gameId) {
            return res.sendStatus(400);
        }

        try {
            const result = await pool.query(
                "SELECT id, state FROM games WHERE id = $1 AND master = $2",
                [gameId, req.user.id]
            );

            if (result.rowCount === 0) {
                return res.sendStatus(404);
            }

            const session = sessionService.createSession(gameId, req.user.id, result.rows[0].state || {});

            return res.status(201).json({
                code: session.code,
                gameId: session.gameId
            });
        } catch (error) {
            console.error("SESSION CREATE FAILED", error);
            return res.sendStatus(500);
        }
    });

    router.get("/:code", authorize, (req, res) => {
        const session = sessionService.getSession(
            req.params.code.toUpperCase()
        );

        if (!session) {
            return res.sendStatus(404);
        }

        return res.json({
            code: session.code,
            gameId: session.gameId,
            hostId: session.hostId,
            playerCount: session.clients.size
        });
    });

    router.delete("/:code", authorize, (req, res) => {
        const session = sessionService.getSession(
            req.params.code.toUpperCase()
        );

        if (!session) {
            return res.sendStatus(404);
        }

        if (session.hostId !== req.user.id) {
            return res.sendStatus(403);
        }

        sessionService.endSession(session.code);

        return res.sendStatus(204);
    });

    return router;
};
