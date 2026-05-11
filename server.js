const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

let stockData = {
    S: { price: 1500, history: [1500] },
    A: { price: 1000, history: [1000] },
    J: { price: 100,  history: [100]  },
    G: { price: 500,  history: [500]  }
};

const users = {}; // socket.id → { balance, holdings }

function updateStock(stock, change, minPrice) {
    stock.price += Math.random() > 0.5 ? change : -change;
    if (stock.price < minPrice) stock.price = minPrice;
    stock.history.push(stock.price);
    if (stock.history.length > 15) stock.history.shift();
}

setInterval(() => {
    updateStock(stockData.S, 50,  100);
    updateStock(stockData.A, 50,  100);
    updateStock(stockData.J, 25,  10);
    updateStock(stockData.G, 75,  50);
    io.emit("stockUpdate", stockData);
}, 60000); // 1분

io.on("connection", (socket) => {
    console.log("유저 접속:", socket.id);

    users[socket.id] = {
        balance: 2500,
        holdings: { S: 0, A: 0, J: 0, G: 0 }
    };

    socket.emit("init", {
        stocks: stockData,
        user: users[socket.id]
    });

    socket.on("buy", ({ type, amount }) => {
        const user = users[socket.id];
        if (!user || !stockData[type] || amount <= 0) return;

        const cost = stockData[type].price * amount;
        if (user.balance < cost) {
            socket.emit("tradeResult", { ok: false, msg: "잔액이 부족합니다." });
            return;
        }

        user.balance -= cost;
        user.holdings[type] += amount;

        socket.emit("userUpdate", user);
        socket.emit("tradeResult", { ok: true, side: "buy", type, amount });
    });

    socket.on("sell", ({ type, amount }) => {
        const user = users[socket.id];
        if (!user || !stockData[type] || amount <= 0) return;

        if (user.holdings[type] < amount) {
            socket.emit("tradeResult", { ok: false, msg: "보유 주식이 부족합니다." });
            return;
        }

        user.balance += stockData[type].price * amount;
        user.holdings[type] -= amount;

        socket.emit("userUpdate", user);
        socket.emit("tradeResult", { ok: true, side: "sell", type, amount });
    });

    socket.on("disconnect", () => {
        console.log("유저 퇴장:", socket.id);
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행중 → http://localhost:${PORT}`));
