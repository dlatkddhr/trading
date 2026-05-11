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

function updateStock(type, change, minPrice) {

    stockData[type].price += Math.random() > 0.5
        ? change
        : -change;

    if (stockData[type].price < minPrice) {
        stockData[type].price = minPrice;
    }

    stockData[type].history.push(
        stockData[type].price
    );

    if (stockData[type].history.length > 30) {
        stockData[type].history.shift();
    }
}

setInterval(() => {

    updateStock("S", 50, 100);
    updateStock("A", 50, 100);
    updateStock("J", 25, 10);
    updateStock("G", 75, 50);

    io.emit("stockUpdate", stockData);

    console.log("주식 변동");

}, 60000);

// 테스트용
// }, 5000);

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

        const user = users[socket.id];

        if (!user) return;

        const price =
            stockData[type].price * amount;

        if (
            amount > 0 &&
            user.balance >= price
        ) {

            user.balance -= price;

            user.holdings[type] += amount;

            socket.emit(
                "userUpdate",
                user
            );

            socket.emit("tradeResult", {
                ok: true,
                side: "buy",
                type,
                amount
            });

            console.log(
                `${type} ${amount}개 매수`
            );
        }

        else {

            socket.emit("tradeResult", {
                ok: false
            });
        }
    });

    socket.on("sell", ({ type, amount }) => {

        const user = users[socket.id];

        if (!user) return;

        if (
            amount > 0 &&
            user.holdings[type] >= amount
        ) {

            const gain =
                stockData[type].price * amount;

            user.balance += gain;

            user.holdings[type] -= amount;

            socket.emit(
                "userUpdate",
                user
            );

            socket.emit("tradeResult", {
                ok: true,
                side: "sell",
                type,
                amount
            });

            console.log(
                `${type} ${amount}개 매도`
            );
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
