const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

// 소식 목록: { text, minChance, maxChance }
// minChance~maxChance 범위 안에 random이 들어오면 가격 상승, 아니면 하락
const NEWS = {
    S: [
        { text: "상록전자에서 초전도체 개발에 성공하였습니다", min: 0.90, max: 1.00 },
        { text: "상록전자에서 반도체를 개발하였습니다",        min: 0.70, max: 0.90 },
        { text: "상록전자에서 노조와 협상을 하였습니다",        min: 0.40, max: 0.60 },
        { text: "상록전자에서 만든 반도체에서 버그가 발생하였습니다", min: 0.00, max: 0.50 },
        { text: "상록전자에서 노조와 협상을 파괴하였습니다",    min: 0.00, max: 0.30 }
    ],
    A: [
        { text: "안산제약에서 탈모 치료제를 개발 성공했습니다",                          min: 0.90, max: 1.00 },
        { text: "안산제약에서 스프레이형 약을 개발 성공하였습니다",                      min: 0.70, max: 0.90 },
        { text: "안산제약에서 한타바이러스 백신개발에 성공하였습니다",                    min: 0.40, max: 0.60 },
        { text: "안산제약에서 1끼식사를 하나로 챙길 수 있는 종합영양제에서 부작용이 검출되었습니다", min: 0.00, max: 0.50 },
        { text: "안산제약에서 만든 탈모치료제의 부작용이 발견되었습니다",                  min: 0.00, max: 0.30 }
    ],
    J: [
        { text: "러시아의 대통령이 전쟁을 끝내겠다고 이번 정상회담에서 입장을 내세웠습니다", min: 0.90, max: 1.00 },
        { text: "미국에서 관세를 감소시켜서 시장이 안정세를 취했습니다",                  min: 0.70, max: 0.90 },
        { text: "주원금융에서 이자의 강도를 낮추었습니다",                               min: 0.40, max: 0.60 },
        { text: "북한에서 새로운 핵폭탄을 개발하였습니다",                               min: 0.00, max: 0.50 },
        { text: "주원금융의 보안이 취약해 해킹당했습니다",                                min: 0.00, max: 0.30 }
    ],
    G: [
        { text: "gta게임즈의 게임이 E스포츠 올림픽 종목으로 선정되었습니다",                min: 0.90, max: 1.00 },
        { text: "gta게임즈에서 초보자도 쉽게 사용할 수 있는 게임 엔진을 만들었습니다",      min: 0.70, max: 0.90 },
        { text: "gta게임즈에서 신작게임을 개발하였습니다",                                min: 0.40, max: 0.60 },
        { text: "gta게임즈의 신작게임이 개발되기 전에 유출되었습니다",                     min: 0.00, max: 0.50 },
        { text: "gta게임즈에서 만든 fps게임의 핵유저가 30% 이상이라는 논란이 있습니다",     min: 0.00, max: 0.30 }
    ]
};

let stockData = {
    S: { price: 1500, history: [1500], news: "" },
    A: { price: 1000, history: [1000], news: "" },
    J: { price: 100,  history: [100],  news: "" },
    G: { price: 500,  history: [500],  news: "" }
};

const users = {};

// 소식을 무작위로 뽑고, max 확률로 상승 / 나머지는 하락
// 예) 90~100% → 90% 확률 상승 / 0~30% → 30% 확률 상승
function pickNews(type) {
    const list = NEWS[type];
    const item = list[Math.floor(Math.random() * list.length)];
    const up   = Math.random() < item.max;
    return { text: item.text, up };
}

function updateStock(type, change, minPrice) {
    const stock  = stockData[type];
    const result = pickNews(type);

    stock.news   = result.text;
    stock.price += result.up ? change : -change;
    if (stock.price < minPrice) stock.price = minPrice;

    stock.history.push(stock.price);
    if (stock.history.length > 15) stock.history.shift();
}

setInterval(() => {
    updateStock("S", 100, 100);
    updateStock("A", 75,  100);
    updateStock("J", 25,  10);
    updateStock("G", 50,  50);
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
