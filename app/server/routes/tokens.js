const express = require("express");
const multer = require("multer");
const sharp = require("sharp");

module.exports = function(pool, authorize) {
    const router = express.Router();

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        fileFilter: (req, file, callback) => {
            const allowedTypes = [
                "image/png",
                "image/jpeg",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.mimetype)) {
                return callback(new Error("Invalid image type."));
            }

            callback(null, true);
        }
    });

    router.get("/", authorize, async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT
                    t.id,
                    t.name,
                    t.image_id,
                    t.created_at,
                    CONCAT('/api/tokens/', t.id, '/image') AS "imageUrl"
                FROM tokens t
                WHERE t.created_by = $1
                ORDER BY t.id DESC`,
                [req.user.id]
            );

            return res.json(result.rows);

        } catch (error) {
            console.error("TOKEN FETCH FAILED", error);

            return res.status(500).json({
                error: "Failed to load tokens."
            });
        }
    });
    router.get("/:id/image", authorize, async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT
                    i.mime_type,
                    i.data
                 FROM tokens t
                 JOIN images i
                    ON i.id = t.image_id
                 WHERE t.id = $1`,
                [req.params.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Token image not found."
                });
            }

            const image = result.rows[0];

            res.set("Content-Type", image.mime_type);
            res.set("Cache-Control", "private, max-age=3600");

            return res.send(image.data);
        } catch (error) {
            console.error("TOKEN IMAGE FETCH FAILED", error);

            return res.status(500).json({
                error: "Failed to load token image."
            });
        }
    });

    router.post("/", authorize, upload.single("image"),
        async (req, res) => {
            if (!req.file) {
                return res.status(400).json({
                    error: "Image is required."
                });
            }

            const name = req.body.name?.trim();

            if (!name) {
                return res.status(400).json({
                    error: "Token name is required."
                });
            }

            if (name.length > 100) {
                return res.status(400).json({
                    error: "Token name must be 100 characters or less."
                });
            }

            const client = await pool.connect();

            try {
                const compressedImage = await sharp(req.file.buffer)
                    .resize(512, 512, {
                        fit: "cover"
                    })
                    .webp({
                        quality: 85
                    })
                    .toBuffer();

                await client.query("BEGIN");

                const imageResult = await client.query(
                    `INSERT INTO images (
                        filename,
                        mime_type,
                        data,
                        created_by
                    )
                    VALUES ($1, $2, $3, $4)
                    RETURNING id`,
                    [
                        req.file.originalname,
                        "image/webp",
                        compressedImage,
                        req.user.id
                    ]
                );

                const imageId = imageResult.rows[0].id;

                const tokenResult = await client.query(
                    `INSERT INTO tokens (
                        image_id,
                        name,
                        created_by
                    )
                    VALUES ($1, $2, $3)
                    RETURNING
                        id,
                        image_id,
                        name,
                        created_at`,
                    [
                        imageId,
                        name,
                        req.user.id
                    ]
                );

                await client.query("COMMIT");

                return res.status(201).json({
                    ...tokenResult.rows[0],
                    imageUrl: `/api/tokens/${tokenResult.rows[0].id}/image`
                });

            } catch (error) {
                await client.query("ROLLBACK");

                console.error("TOKEN CREATE FAILED", error);

                return res.status(500).json({
                    error: "Failed to create token."
                });

            } finally {
                client.release();
            }
        }
    );

    router.delete("/:id", authorize, async (req, res) => {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const tokenResult = await client.query(
                `SELECT image_id
                 FROM tokens
                 WHERE id = $1
                 AND created_by = $2`,
                [req.params.id, req.user.id]
            );

            if (tokenResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    error: "Token not found."
                });
            }

            const imageId = tokenResult.rows[0].image_id;

            await client.query(
                `DELETE FROM tokens
                 WHERE id = $1
                 AND created_by = $2`,
                [req.params.id, req.user.id]
            );

            await client.query(
                `DELETE FROM images
                 WHERE id = $1`,
                [imageId]
            );

            await client.query("COMMIT");

            return res.sendStatus(204);
        } catch (error) {
            await client.query("ROLLBACK");

            console.error("TOKEN DELETE FAILED", error);

            return res.status(500).json({
                error: "Failed to delete token."
            });
        } finally {
            client.release();
        }
    });

    return router;
};
