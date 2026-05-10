const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

let stocks = {
    S: {
        price: 1500,
        history: [1500]
    },
    A: {
        price: 1000,
        history: [1000]
    },
    J: {
        price: 100,
        history: [100]
    },
    G: {
        price: 500,
        history: [500]
    }
};

let users = {};

function randomChange(price, amount) {
    return Math.max(1, price + (Math.random() > 0.5 ? amount : -amount));
}

setInterval(() => {

    stocks.S.price = randomChange(stocks.S.price, 50);
    stocks.A.price = randomChange(stocks.A.price, 50);
    stocks.J.price = randomChange(stocks.J.price, 25);
    stocks.G.price = randomChange(stocks.G.price, 75);

    stocks.S.history.push(stocks.S.price);
    stocks.A.history.push(stocks.A.price);
    stocks.J.history.push(stocks.J.price);
    stocks.G.history.push(stocks.G.price);

    if (stocks.S.history.length > 30) stocks.S.history.shift();
    if (stocks.A.history.length > 30) stocks.A.history.shift();
    if (stocks.J.history.length > 30) stocks.J.history.shift();
    if (stocks.G.history.length > 30) stocks.G.history.shift();

    io.emit("stockUpdate", stocks);

}, 3000);

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

    socket.emit("init", {
        stocks,
        user: users[socket.id]
    });

    socket.on("buy", ({ type, amount }) => {

        let user = users[socket.id];

        let cost = stocks[type].price * amount;

        if (user.balance >= cost) {

            user.balance -= cost;
            user.holdings[type] += amount;

            socket.emit("userUpdate", user);

            socket.emit("tradeResult", {
                ok: true,
                side: "buy",
                type,
                amount
            });
        }
    });

    socket.on("sell", ({ type, amount }) => {

        let user = users[socket.id];

        if (user.holdings[type] >= amount) {

            let gain = stocks[type].price * amount;

            user.balance += gain;
            user.holdings[type] -= amount;

            socket.emit("userUpdate", user);

            socket.emit("tradeResult", {
                ok: true,
                side: "sell",
                type,
                amount
            });
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
