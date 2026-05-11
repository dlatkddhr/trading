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

function updateStock(stock, change, minPrice) {

    stock.price += Math.random() > 0.5 ? change : -change;

    if (stock.price < minPrice) {
        stock.price = minPrice;
    }

    stock.history.push(stock.price);

    if (stock.history.length > 30) {
        stock.history.shift();
    }
}
function buyStock(type) {
    let amount = select[type];

    if (amount > 0) {
        socket.emit("buy", {
            type,
            amount
        });
    }
}

function sellStock(type) {
    let amount = Math.min(select[type], holdings[type]);

    if (amount > 0) {
        socket.emit("sell", {
            type,
            amount
        });
    }
}
setInterval(() => {

    updateStock(stockData.S, 50, 100);
    updateStock(stockData.A, 50, 100);
    updateStock(stockData.J, 25, 10);
    updateStock(stockData.G, 75, 50);

    console.log("주가 변동");

    io.emit("updateStocks", stockData);

}, 3000); // 테스트용 3초

io.on("connection", (socket) => {

    console.log("유저 접속");

    socket.emit("updateStocks", stockData);

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("서버 실행중");
});
