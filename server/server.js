const http = require("http");
const { Server } = require("socket.io");
const LinkedList = require("./linkedList");

const PORT = 3000;
const ROOM_ID_LENGTH = 6;
const CLIENT_WAITING_THRESHOLD = 2;
const CLIENT_ORIGIN = ["http://localhost:8080", "http://10.1.1.105:8080", "http://10.100.96.207:8080"];

let waitingClients = new LinkedList();
const customQueue = {};
const activeRooms = new Map();
const userColors = {};

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
    console.log(socket.id, " connected");

    socket.on("joinRoom", color => {
        handleJoinRoom(socket, color);
    });

    socket.on("joinCustomRoom", ({ color, room }) => {
        handleJoinCustomRoom(socket, color, room);
    });

    socket.on("disconnect", handleDisconnect);

    socket.on("cutAndPlaceFalse", data => {
        const roomId = getRoomIdByClient(socket);

        socket.to(roomId).emit("cutAndPlaceFalse", data);
    });

    socket.on("lost", data => {
        const roomId = getRoomIdByClient(socket);
        let status = activeRooms[roomId].status;

        if (status === "playing") status = "one-lost";
        else if (status === "one-lost") status = "both-lost";
        activeRooms[roomId].status = status;

        socket.to(getOtherPlayerId(roomId, socket.id)).emit("lost", data);
    });

    socket.on("rematchRequest", handleRematchRequest);
}

function handleRematchRequest() {
    console.log(this.id + " requested a rematch");
    roomId = getRoomIdByClient(this);
    let otherPlayerId = getOtherPlayerId(roomId, this.id);

    if (activeRooms[roomId].status != "both-lost") return;
    io.to(otherPlayerId).emit("rematchRequest");
    if (activeRooms[roomId].rematchRequest === false) {
        activeRooms[roomId].rematchRequest = true;
        activeRooms[roomId].rematchInitiator = this.id;
    } else if (activeRooms[roomId].rematchInitiator === otherPlayerId) {
        io.to(roomId).emit("initiateRematch");
    }
}

function handleJoinRoom(socket, color) {
    console.log(socket.id, " room join request");

    if (waitingClients.includes(socket.id) || Array.from(socket.rooms).length > 1) {
        console.log(socket.id, " already in the queue or room");
        return;
    }

    addToWaitingQueue(socket.id);
    userColors[socket.id] = color;

    if (waitingClients.length >= CLIENT_WAITING_THRESHOLD) {
        const [player1, player2] = createRoom();
        const roomId = generateRoomId();
        player1.join(roomId);
        player2.join(roomId);

        activeRooms[roomId] = {
            players: [player1.id, player2.id],
            score: [(player1Score = 0), (player2Score = 0)],
            status: "playing",
            rematchRequest: false,
            rematchInitiator: null
        };

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
    if (!customQueue[customRoomName]) customQueue[customRoomName] = [];
    if (customQueue[customRoomName].length < CLIENT_WAITING_THRESHOLD - 1) {
        customQueue[customRoomName].push(socket);
        userColors[socket.id] = color;
        console.log(`${socket.id}  joined custom room: ${customRoomName}`);
    } else if (customQueue[customRoomName].length == CLIENT_WAITING_THRESHOLD - 1) {
        const player = customQueue[customRoomName][0];

        socket.join(customRoomName);
        player.join(customRoomName);

        activeRooms[customRoomName] = {
            players: [player.id, socket.id],
            score: [(player1Score = 0), (player2Score = 0)],
            status: "playing",
            rematchRequest: false,
            rematchInitiator: null
        };

        // Notify both players that they have joined the custom room
        socket.emit("roomAssigned", {
            roomId: customRoomName,
            opponentColor: userColors[player.id] // Set the opponent's color based on player1's color
        });

        io.to(player.id).emit("roomAssigned", {
            roomId: customRoomName,
            opponentColor: color // Set the opponent's color based on socket's color
        });

        delete customQueue[customRoomName];

        console.log(`${socket.id}  joined custom room: ${customRoomName}`);
        console.log(`${customRoomName} is now full`);
    } else {
        // console.log("Room already full");
        // send room full message
    }
}

function handleDisconnect() {
    console.log(this.id, " disconnected");
    for (const room in activeRooms) {
        if (activeRooms[room].players.includes(this.id)) {
            io.to(getOtherPlayerId(room, this.id)).emit("opponentDisconnected");
            delete activeRooms[room];
            console.log(`${room} destroyed`);
            this.leave(room);
        }
    }
    removeFromWaitingQueue(this.id);
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, ROOM_ID_LENGTH);
}

function addToWaitingQueue(clientId) {
    waitingClients.queue(clientId);
}

function createRoom() {
    const player1 = io.sockets.sockets.get(waitingClients.dequeue());
    const player2 = io.sockets.sockets.get(waitingClients.dequeue());
    return [player1, player2];
}

function removeFromWaitingQueue(clientId) {
    waitingClients.removeNode(clientId);
    for (const key in customQueue) {
        customQueue[key] = customQueue[key].filter(c => c.id !== client.id);
    }
}

function getRoomIdByClient(client) {
    return Array.from(client.rooms)[1];
}

function getOtherPlayerId(roomId, clientId) {
    return activeRooms[roomId].players.find(id => id !== clientId);
}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
