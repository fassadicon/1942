const socket = io();
let player_id = 0;
let connected = 0;
let audio = new Audio("/sounds/explode.mp3");

class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    display() {
        for (var i in playersGroup) {
            let id = parseInt(i) + 1;
            let heroID = "#hero" + id;
            $(heroID).css("left", playersGroup[i].x);
            $(heroID).css("top", playersGroup[i].y);
        }
    }
}

class Enemy {
    constructor(enemies) {
        this.enemies = enemies;
        // this.score = 0;
    }
    display() {
        let output = "";
        for (let i in this.enemies) {
            output += `<div class='enemy${this.enemies[i].type}' style='top:${this.enemies[i].y}px; left:${this.enemies[i].x}px;'></div>`;
        }
        $("#enemies").html(output);
        return this;
    }
    move() {
        socket.emit('update_enemies', enemies);
    }
    bulletCollision() {
        let output = "";
        for (let i in bullets) {
            for (let j in this.enemies) {
                if (
                    Math.abs(bullets[i].x - this.enemies[j].x) < 15 &&
                    Math.abs(bullets[i].y - this.enemies[j].y) < 15
                ) {
                    output += `<div class="explosion" style="top: ${bullets[i].y}px; left: ${bullets[i].x}px;"></div>`;
                    $("#enemies").html(output);
                    audio.play();
                    socket.emit("scored");
                    this.enemies[j] = this.enemies[this.enemies.length - 1];
                    this.enemies.pop();
                    this.enemies.push({
                        x: Math.floor(Math.random() * 700),
                        y: 0,
                        type: Math.floor(Math.random() * 8),
                    });
                    bullets[i] = bullets[bullets.length - 1];
                    bullets.pop();
                }
            }
        }
        socket.emit('update_enemies', enemies);
    }
    heroCollision() {
        let output = "";
        let crashed = 0;
            for (let j in this.enemies) {
                if (
                    Math.abs(playersGroup[player_id].x - this.enemies[j].x) < 15 &&
                    Math.abs(playersGroup[player_id].y - this.enemies[j].y) < 15
                ) {
                    output += `<div class="explosion" style="top: ${playersGroup[player_id].y}px; left: ${playersGroup[player_id].x}px;"></div>`;
                    $("#enemies").html(output);
                    crashed = 1;
                    audio.play();
                    this.enemies[j] = this.enemies[this.enemies.length - 1];
                    this.enemies.pop();
                    this.enemies.push({
                        x: Math.floor(Math.random() * 700),
                        y: 0,
                        type: Math.floor(Math.random() * 8),
                    });
                }
            }
        if (crashed == 1) {
            socket.emit("crashed");
        }
        socket.emit('update_enemies', enemies);
    }
    
}

class Bullet {
    display() {
        let output = "";
        for (let i in bullets) {
            output += `<div class='bullet' style='top:${bullets[i].y}px; left:${bullets[i].x}px;'></div>`;
        }
        $("#bullets").html(output);
        return this;
    }
    move() {
        for (let i in bullets) {
            bullets[i].y -= 10;
            if (bullets[i].y < 0) {
                bullets[i] = bullets[bullets.length - 1];
                bullets.pop();
            }
        }
        return this;
    }
}
let playersGroup = [];
let enemies = [];
let enemiesGroup = new Enemy(enemies);
let bullet = [];
let bullets = [];


function gameLoop() {
    
    for (player of playersGroup) {
        player.display();
    }
    enemiesGroup.display();
    enemiesGroup.move();
    enemiesGroup.bulletCollision();
    enemiesGroup.heroCollision();
    bullet.display();
    bullet.move();
}

setInterval(gameLoop, 50);

$(document).ready(() => {
    socket.on("update_score", (data) => {
        $("#score").text(data.score);
    });
    socket.emit('connected');
    socket.on("player_connected", data => {
        console.log(data.players);
        for (player of data.players) {
            let hero = new Hero(player.x, player.y);
            playersGroup.push(hero);
        }
        enemies.splice(0, enemies.length);
        for (enemy of data.enemies) {
            enemies.push(enemy);
        }
        bullet = new Bullet();
        if (connected == 0) {
            player_id = playersGroup.length - 1;
            connected = 1;
        }
    });
   
    socket.on('updated_position', data => {
        for (var i in data.players) {
            playersGroup[i].x = data.players[i].x;
            playersGroup[i].y = data.players[i].y;
            playersGroup[i].display();
        }
    });

    socket.on('updated_enemies', data => {
        for (var i in data.enemies) {
            enemies[i].x = data.enemies[i].x;
            enemies[i].y = data.enemies[i].y;
            enemies[i].type = data.enemies[i].type;
        }
    });



    socket.on('fired', data => {
        bullets.push({ x: data.x, y: data.y - 15 });
    })

    document.onkeydown = function (e) {
        if (e.keyCode == 38) {
            // key move hero up
            playersGroup[player_id].y -= 10;
        } else if (e.keyCode == 40) {
            // key move hero down
            playersGroup[player_id].y += 10;
        } else if (e.keyCode == 39) {
            // key move hero right
            playersGroup[player_id].x += 10;
        } else if (e.keyCode == 37) {
            // key move hero left
            playersGroup[player_id].x -= 10;
        } else if (e.keyCode == 32) {
            socket.emit('fire', { x: playersGroup[player_id].x + 5, y: playersGroup[player_id].y - 15 });
        }
        socket.emit('update_position', playersGroup);
        for (player of playersGroup) {
            player.display();
        }
    };
});
