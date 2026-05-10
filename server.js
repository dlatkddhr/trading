const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

let stockData = {
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

setInterval(() => {

    stockData.S.price += Math.random() > 0.5 ? 50 : -50;
    stockData.A.price += Math.random() > 0.5 ? 50 : -50;
    stockData.J.price += Math.random() > 0.5 ? 25 : -25;
    stockData.G.price += Math.random() > 0.5 ? 75 : -75;

    if (stockData.S.price < 100)
        stockData.S.price = 100;

    if (stockData.A.price < 100)
        stockData.A.price = 100;

    if (stockData.J.price < 10)
        stockData.J.price = 10;

    if (stockData.G.price < 50)
        stockData.G.price = 50;

    stockData.S.history.push(stockData.S.price);
    stockData.A.history.push(stockData.A.price);
    stockData.J.history.push(stockData.J.price);
    stockData.G.history.push(stockData.G.price);

    if (stockData.S.history.length > 30)
        stockData.S.history.shift();

    if (stockData.A.history.length > 30)
        stockData.A.history.shift();

    if (stockData.J.history.length > 30)
        stockData.J.history.shift();

    if (stockData.G.history.length > 30)
        stockData.G.history.shift();

    io.emit("stockUpdate", stockData);

}, 60000);

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
        stocks: stockData,
        user: users[socket.id]
    });

    socket.on("buy", ({ type, amount }) => {

        let user = users[socket.id];

        let cost = stockData[type].price * amount;

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

        else {

            socket.emit("tradeResult", {
                ok: false
            });
        }
    });

    socket.on("sell", ({ type, amount }) => {

        let user = users[socket.id];

        if (user.holdings[type] >= amount) {

            let gain = stockData[type].price * amount;

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

        else {

            socket.emit("tradeResult", {
                ok: false
            });
        }
    });

    socket.on("disconnect", () => {

        console.log("유저 퇴장");

        delete users[socket.id];
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("서버 실행중");
});
