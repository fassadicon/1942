// Modules
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const querystring = require("querystring");

// Initializations
const app = express();

// Sets
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// Uses
app.use(
    session({
        secret: "secret_ni_Frans",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(bodyParser.urlencoded({ extended: false }));
// Public
app.use(express.static(__dirname + "/public"));

// Port
const server = app.listen(1337);

// Sockets
var players = [];
var bullets = [];
var score = 100;
let enemies = [
    { x: 50, y: 50, type: 1 },
    { x: 150, y: 50, type: 1 },
    { x: 250, y: 50, type: 1 },
    { x: 350, y: 50, type: 1 },
    { x: 450, y: 50, type: 1 },
    { x: 550, y: 50, type: 1 },
    { x: 650, y: 50, type: 1 },
];
const io = require("socket.io")(server);
io.on("connection", (socket) => {
    console.log("new player connected");

    socket.on("connected", () => {
        players.push({
            id: socket.id,
            x: Math.floor(Math.random() * 500),
            y: 500,
        });
        io.emit("player_connected", { players: players, enemies: enemies });
    });
    socket.on("update_position", (data) => {
        for (var i in data) {
            for (let j in players) {
                if (i == j) {
                    players[j].y = data[i].y;
                    players[j].x = data[i].x;
                }
            }
        }
        io.emit("updated_position", { players: players });
    });
    socket.on("update_enemies", (data) => {
        // client
        for (var i in data) {
            for (let j in enemies) {
                if (i == j) {
                    enemies[j].y = data[i].y + 5;
                    enemies[j].x = data[i].x;
                    if (enemies[j].y > 520) {
                        if (enemies[j].type > 7) {
                            enemies[j].type = 1;
                        } else {
                            enemies[j].type++;
                        }
                        enemies[j].y = 1;
                        enemies[j].x = Math.floor(Math.random() * 500);
                    }
                }
            }
        }
        io.emit("updated_enemies", { enemies: enemies });
    });
    socket.on("fire", (data) => {
        io.emit("fired", { x: data.x, y: data.y });
    });

    socket.on("scored", () => {
        score += 100;
        io.emit("update_score", { score: score });
    });
    socket.on("crashed", () => {
        score -= 500;
        io.emit("update_score", { score: score });
    });

    socket.on("disconnect", () => {
        for (player of players) {
            if (player.id == socket.id) {
                players.splice(players.indexOf(player), 1);
            }
        }
        console.log("Updated Players:", players);
    });
});

// Routes
app.get("/", function (request, response) {
    response.render("index");
});
