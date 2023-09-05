const { log } = require("console");
const http = require("http");
const { Server } = require("socket.io");

const PORT = 3000;
const ROOM_ID_LENGTH = 6;
const CLIENT_WAITING_THRESHOLD = 2; // how many clients in one room
const CLIENT_ORIGIN = ["http://localhost:8080", "http://10.1.1.105:8080"];

let waitingClients = [];
let activeRooms = {};
const userColors = {}; // Object to store user colors

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

io.on("connection", handleSocketConnection);

function handleSocketConnection(socket) {
    console.log("A user connected:", socket.id);

    socket.on("joinRoom", handleJoinRoom);

    socket.on("disconnect", handleDisconnect);

    socket.on("cutAndPlaceFalse", data => {
        socket.to(getRoomIdByClientId(socket.id)).emit("cutAndPlaceFalse", data);
    });

    socket.on("lost", () => {
        socket.to(getRoomIdByClientId(socket.id)).emit("lost");
    });
}

function handleJoinRoom(color) {
    console.log("joinRoom request:", this.id, color);

    if (isClientInWaitingQueue(this)) {
        console.log("Already in the waiting queue:", this.id);
        return;
    }

    if (isClientInActiveRoom(this)) {
        console.log("Already in an active room:", this.id);
        return;
    }

    addToWaitingQueue(this);
    userColors[this.id] = color; // Store user color

    if (waitingClients.length >= CLIENT_WAITING_THRESHOLD) {
        const [player1, player2] = createRoom();

        const roomId = generateRoomId();
        player1.join(roomId);
        player2.join(roomId);

        activeRooms[roomId] = [player1.id, player2.id];

        const player1Color = userColors[player1.id];
        const player2Color = userColors[player2.id];

        io.to(player1.id).emit("roomAssigned", {
            roomId,
            opponentColor: player2Color
        });
        io.to(player2.id).emit("roomAssigned", {
            roomId,
            opponentColor: player1Color
        });

        delete userColors[player1.id];
        delete userColors[player2.id];

        console.log(`Room created: ${roomId}`);
    }
}

function handleDisconnect() {
    console.log("A user disconnected:", this.id);

    if (isClientInActiveRoom(this)) {
        const roomId = getRoomIdByClientId(this.id);
        const otherPlayerId = getOtherPlayerId(roomId, this.id);

        io.to(otherPlayerId).emit("opponentDisconnected");
        delete activeRooms[roomId];

        console.log(`Room destroyed: ${roomId}`);
        this.leave(roomId);
    }

    removeFromWaitingQueue(this);
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, ROOM_ID_LENGTH);
}

function isClientInWaitingQueue(client) {
    return waitingClients.includes(client);
}

function isClientInActiveRoom(client) {
    for (const roomId in activeRooms) {
        if (activeRooms[roomId].includes(client.id)) {
            return true;
        }
    }
    return false;
}

function addToWaitingQueue(client) {
    waitingClients.push(client);
}

function createRoom() {
    const player1 = waitingClients.shift();
    const player2 = waitingClients.shift();
    return [player1, player2];
}

function removeFromWaitingQueue(client) {
    waitingClients = waitingClients.filter(c => c.id !== client.id);
}

function getRoomIdByClientId(clientId) {
    for (const roomId in activeRooms) {
        if (activeRooms[roomId].includes(clientId)) {
            return roomId;
        }
    }
    return null;
}

function getOtherPlayerId(roomId, clientId) {
    return activeRooms[roomId].find(id => id !== clientId);
}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
