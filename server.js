const socket = io();

let Balance = 2500;
let U = 0;

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

let select = {
    S: 0,
    A: 0,
    J: 0,
    G: 0
};

let holdings = {
    S: 0,
    A: 0,
    J: 0,
    G: 0
};

const stockName = {
    S: "상록전자",
    A: "안산제약",
    J: "주원금융",
    G: "gta게임즈"
};

const Scanvas = document.getElementById("Schart");
const Acanvas = document.getElementById("Achart");
const Jcanvas = document.getElementById("Jchart");
const Gcanvas = document.getElementById("Gchart");

const Sctx = Scanvas.getContext("2d");
const Actx = Acanvas.getContext("2d");
const Jctx = Jcanvas.getContext("2d");
const Gctx = Gcanvas.getContext("2d");

function drawChart(ctx, canvas, history) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!history || history.length < 2) return;

    let min = Math.min(...history);
    let max = Math.max(...history);

    if (min === max) {
        min -= 1;
        max += 1;
    }

    const padding = 20;

    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    ctx.beginPath();

    for (let i = 0; i < history.length; i++) {

        const x =
            padding +
            (i / (history.length - 1)) * graphWidth;

        const y =
            padding +
            graphHeight -
            ((history[i] - min) / (max - min)) * graphHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        }

        else {
            ctx.lineTo(x, y);
        }
    }

    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawAll() {

    drawChart(
        Sctx,
        Scanvas,
        stocks.S.history
    );

    drawChart(
        Actx,
        Acanvas,
        stocks.A.history
    );

    drawChart(
        Jctx,
        Jcanvas,
        stocks.J.history
    );

    drawChart(
        Gctx,
        Gcanvas,
        stocks.G.history
    );
}

function updateUI() {

    if (
        !stocks.S ||
        !stocks.A ||
        !stocks.J ||
        !stocks.G
    ) return;

    document.querySelector(".balance").textContent =
        "잔액:" + Balance;

    document.getElementById("S").textContent =
        `${stockName.S} (${stocks.S.price})`;

    document.getElementById("A").textContent =
        `${stockName.A} (${stocks.A.price})`;

    document.getElementById("J").textContent =
        `${stockName.J} (${stocks.J.price})`;

    document.getElementById("G").textContent =
        `${stockName.G} (${stocks.G.price})`;

    document.querySelector(".Squantity").textContent =
        select.S;

    document.querySelector(".Aquantity").textContent =
        select.A;

    document.querySelector(".Jquantity").textContent =
        select.J;

    document.querySelector(".Gquantity").textContent =
        select.G;

    document.getElementById("SHT").textContent =
        "×" + holdings.S;

    document.getElementById("AHT").textContent =
        "×" + holdings.A;

    document.getElementById("JHT").textContent =
        "×" + holdings.J;

    document.getElementById("GHT").textContent =
        "×" + holdings.G;

    if (U === 1) {
        drawAll();
    }
}

socket.on("init", (data) => {

    stocks = data.stocks;

    Balance = data.user.balance;

    holdings = data.user.holdings;

    updateUI();
});

socket.on("stockUpdate", (serverStocks) => {

    if (!serverStocks.S) return;

    stocks = serverStocks;

    updateUI();
});

socket.on("userUpdate", (user) => {

    Balance = user.balance;

    holdings = user.holdings;

    updateUI();
});

socket.on("tradeResult", (result) => {

    if (result.ok) {

        if (result.side === "buy") {
            select[result.type] = 0;
        }

        if (result.side === "sell") {

            select[result.type] -= result.amount;

            if (select[result.type] < 0) {
                select[result.type] = 0;
            }
        }

        updateUI();
    }
});

function buyStock(type) {

    const amount = select[type];

    if (amount <= 0) return;

    socket.emit("buy", {
        type,
        amount
    });
}

function sellStock(type) {

    const amount = Math.min(
        select[type],
        holdings[type]
    );

    if (amount <= 0) return;

    socket.emit("sell", {
        type,
        amount
    });
}

function setupControls(type) {

    document.getElementById(type + "buy").onclick =
        () => buyStock(type);

    document.getElementById(type + "sell").onclick =
        () => sellStock(type);

    document.querySelectorAll(`.${type}plus`)
        .forEach(btn => {

            btn.onclick = () => {

                select[type] += Number(
                    btn.dataset.value
                );

                if (select[type] > 500) {
                    select[type] = 500;
                }

                updateUI();
            };
        });

    document.querySelectorAll(`.${type}minus`)
        .forEach(btn => {

            btn.onclick = () => {

                select[type] -= Number(
                    btn.dataset.value
                );

                if (select[type] < 0) {
                    select[type] = 0;
                }

                updateUI();
            };
        });
}

["S", "A", "J", "G"]
    .forEach(setupControls);

document.getElementById("graphBtn")
    .addEventListener("click", function () {

        U = 1;

        drawAll();
    });

document.getElementById("infoBtn")
    .addEventListener("click", function () {

        U = 0;

        Sctx.clearRect(
            0,
            0,
            Scanvas.width,
            Scanvas.height
        );

        Actx.clearRect(
            0,
            0,
            Acanvas.width,
            Acanvas.height
        );

        Jctx.clearRect(
            0,
            0,
            Jcanvas.width,
            Jcanvas.height
        );

        Gctx.clearRect(
            0,
            0,
            Gcanvas.width,
            Gcanvas.height
        );
    });

updateUI();
