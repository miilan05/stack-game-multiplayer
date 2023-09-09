const http = require("http");
const { Server } = require("socket.io");

const PORT = 3000;
const ROOM_ID_LENGTH = 6;
const CLIENT_WAITING_THRESHOLD = 2;
const CLIENT_ORIGIN = ["http://localhost:8080", "http://10.1.1.105:8080"];

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

let waitingClients = [];
const customWaitingClients = {};
const activeRooms = {};
const userColors = {};

io.on("connection", handleSocketConnection);

function handleSocketConnection(socket) {
    console.log(socket.id, " connected");

    socket.on("joinRoom", color => {
        handleJoinRoom(socket, color);
    });

    socket.on("joinCustomRoom", ({ color, room }) => {
        handleJoinCustomRoom(socket, color, room);
    });

    socket.on("disconnect", handleDisconnect);

    socket.on("cutAndPlaceFalse", data => {
        const roomId = getRoomIdByClientId(socket.id);
        socket.to(roomId).emit("cutAndPlaceFalse", data);
    });

    socket.on("lost", () => {
        const roomId = getRoomIdByClientId(socket.id);
        socket.to(roomId).emit("lost");
    });
}

function handleJoinRoom(socket, color) {
    console.log(socket.id, " room join request");

    if (isClientInWaitingQueue(socket) || isClientInActiveRoom(socket)) {
        console.log(socket.id, " already in the queue or room");
        return;
    }

    addToWaitingQueue(socket);
    userColors[socket.id] = color;

    if (waitingClients.length >= CLIENT_WAITING_THRESHOLD) {
        const [player1, player2] = createRoom();

        const roomId = generateRoomId();
        player1.join(roomId);
        player2.join(roomId);

        activeRooms[roomId] = [player1.id, player2.id];

        const player1Color = userColors[player1.id];
        const player2Color = userColors[player2.id];

        [player1, player2].forEach(player => {
            io.to(player.id).emit("roomAssigned", {
                roomId,
                opponentColor: player.id === player1.id ? player2Color : player1Color
            });
            delete userColors[player.id];
        });

        console.log(`${roomId} created`);
    }
}

function handleJoinCustomRoom(socket, color, customRoomName) {
    if (!customWaitingClients[customRoomName]) customWaitingClients[customRoomName] = [];
    if (customWaitingClients[customRoomName].length < CLIENT_WAITING_THRESHOLD - 1) {
        customWaitingClients[customRoomName].push(socket);
        userColors[socket.id] = color;
        console.log(`${socket.id}  joined custom room: ${customRoomName}`);
    } else if (customWaitingClients[customRoomName].length == CLIENT_WAITING_THRESHOLD - 1) {
        const player = customWaitingClients[customRoomName][0];

        socket.join(customRoomName);
        player.join(customRoomName);

        activeRooms[customRoomName] = [player.id, socket.id];

        // Notify both players that they have joined the custom room
        socket.emit("roomAssigned", {
            roomId: customRoomName,
            opponentColor: userColors[player.id] // Set the opponent's color based on player1's color
        });

        io.to(player.id).emit("roomAssigned", {
            roomId: customRoomName,
            opponentColor: color // Set the opponent's color based on socket's color
        });

        delete customWaitingClients[customRoomName];

        console.log(`${socket.id}  joined custom room: ${customRoomName}`);
        console.log(`${customRoomName} is now full`);
    } else {
        // console.log("Room already full");
        // send room full message
    }
}

function handleDisconnect() {
    console.log(this.id, " disconnected");
    if (isClientInActiveRoom(this)) {
        const roomId = getRoomIdByClientId(this.id);
        const otherPlayerId = getOtherPlayerId(roomId, this.id);

        io.to(otherPlayerId).emit("opponentDisconnected");
        delete activeRooms[roomId];

        console.log(`${roomId} destroyed`);
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
    for (const key in customWaitingClients) {
        customWaitingClients[key] = customWaitingClients[key].filter(c => c.id !== client.id);
    }
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
