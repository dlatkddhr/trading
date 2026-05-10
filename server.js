const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

let stockData = {
    S: 1500,
    A: 1000,
    J: 100,
    G: 500
};

let users = {};

setInterval(() => {

    stockData.S += Math.random() > 0.5 ? 50 : -50;
    stockData.A += Math.random() > 0.5 ? 50 : -50;
    stockData.J += Math.random() > 0.5 ? 25 : -25;
    stockData.G += Math.random() > 0.5 ? 75 : -75;

    if (stockData.S < 100) stockData.S = 100;
    if (stockData.A < 100) stockData.A = 100;
    if (stockData.J < 10) stockData.J = 10;
    if (stockData.G < 50) stockData.G = 50;

    io.emit("updateStocks", stockData);

}, 6000);

io.on("connection", (socket) => {

    console.log("유저 접속");

    users[socket.id] = {
        balance: 2500,
        holdings: {
            S: 0,
            A: 0,
            J: 0,
            G: 0
        }
    };

    socket.emit("updateStocks", stockData);

    socket.emit("userUpdate", users[socket.id]);

    socket.on("buy", ({ type, amount }) => {

        let user = users[socket.id];

        let cost = stockData[type] * amount;

        if (user.balance >= cost) {

            user.balance -= cost;
            user.holdings[type] += amount;

            socket.emit("userUpdate", user);
        }

    });

    socket.on("sell", ({ type, amount }) => {

        let user = users[socket.id];

        if (user.holdings[type] >= amount) {

            let gain = stockData[type] * amount;

            user.balance += gain;
            user.holdings[type] -= amount;

            socket.emit("userUpdate", user);
        }

    });

    socket.on("disconnect", () => {
        delete users[socket.id];
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("서버 실행중");
});
