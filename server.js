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

setInterval(() => {

    stockData.S += Math.random() > 0.5 ? 50 : -50;
    stockData.A += Math.random() > 0.5 ? 50 : -50;
    stockData.J += Math.random() > 0.5 ? 25 : -25;
    stockData.G += Math.random() > 0.5 ? 75 : -75;

    io.emit("updateStocks", stockData);

}, 6000);

io.on("connection", (socket) => {

    console.log("유저 접속");

    socket.emit("updateStocks", stockData);

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("서버 실행중");
});
