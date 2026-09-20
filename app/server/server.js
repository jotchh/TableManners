const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/session"); 
const sessionService = require("./services/sessionServices");
const gameRoutes = require("./routes/games");
const tokenRoutes = require("./routes/tokens")
const distPath = path.join(__dirname, "../dist");

let port = 3000;
let host;
let databaseConfig;

if (process.env.NODE_ENV == "production") {
	host = "0.0.0.0";
	databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
	host = "localhost";
	let { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;
	databaseConfig = { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT };
}


let app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(distPath));
const tokenStorage = {};

let pool = new Pool(databaseConfig);
pool.connect().then(() => {
    console.log("Connected to db");
});

function getCookie(cookies, name) {
    if (!cookies) return null;

    const match = cookies.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
}

function getPlayerColor(playerId) {
    let hash = 0;

    for (let i = 0; i < playerId.length; i++) {
        hash = (hash * 31 + playerId.charCodeAt(i)) | 0;
    }

    return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
}

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, request) => {
    const token = getCookie(request.headers.cookie, "token");
    const user = tokenStorage[token];

    if (!user) {
        ws.close(1008, "Unauthorized");
        return;
    }

    ws.playerId = user.id;
    ws.username = user.username;
    ws.color = getPlayerColor(String(ws.playerId));

    console.log(`WebSocket client connected: ${ws.username}`);

    ws.on("message", (message) => {
        sessionService.handleMessage(ws, message.toString());
    });

    ws.on("close", () => {
        sessionService.handleDisconnect(ws);
        console.log(`WebSocket client disconnected: ${ws.username}`);
    });
});

function makeToken(){
    return crypto.randomBytes(32).toString("hex");
}

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

function authorize(req, res, next) {
    const { token } = req.cookies;

    if (token === undefined || !Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
        return res.sendStatus(403);
    }

    req.user = tokenStorage[token];
    next();
}

app.use("/auth", authRoutes(pool, tokenStorage, makeToken, cookieOptions));
app.use("/api/sessions", sessionRoutes(sessionService, authorize, pool));
app.use("/api/games", gameRoutes(pool, authorize));
app.use("/api/tokens", tokenRoutes(pool, authorize));

app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

server.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`)
});
