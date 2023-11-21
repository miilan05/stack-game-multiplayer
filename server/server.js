const http = require("http");
const { Server } = require("socket.io");
const LinkedList = require("./linkedList");
const { log } = require("console");

const PORT = 3000;
const ROOM_ID_LENGTH = 6;
const CLIENT_WAITING_THRESHOLD = 2;
const CLIENT_ORIGIN = ["http://localhost:8080", "http://10.1.1.105:8080", "http://10.100.97.173:8080"];

let waitingClients = new LinkedList();
const customQueue = new Map();
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

    socket.on("joinRoom", handleJoinRoom);

    socket.on("joinCustomRoom", handleJoinCustomRoom);

    socket.on("disconnect", handleDisconnect);

    socket.on("cutAndPlaceFalse", handleCutAndPlace);

    socket.on("lost", handleLost);

    socket.on("rematchRequest", handleRematchRequest);
}

function handleCutAndPlace(data) {
    const roomId = getRoomIdByClient(this);
    // add check
    activeRooms[roomId].score[this.id]++
    
    console.log(activeRooms[roomId].score);

    this.to(roomId).emit("cutAndPlaceFalse", data);
}

function handleLost(data) {
    const roomId = getRoomIdByClient(this);

    if (activeRooms[roomId].status[this.id] == "lost") return;
    activeRooms[roomId].status[this.id] = "lost"
    if (activeRooms[roomId].status[getOtherPlayerId(roomId, this.id)] == "lost") {
        io.to(roomId).emit('both-lost')
    }

    this.to(getOtherPlayerId(roomId, this.id)).emit("lost", data);
}

function handleRematchRequest() {
    console.log(this.id + " requested a rematch");
    const roomId = getRoomIdByClient(this);
    const room = activeRooms[roomId];

    if (!room || room.status[this.id] !== "lost") return;

    const otherPlayerId = getOtherPlayerId(roomId, this.id);

    if (room.status[otherPlayerId] !== "lost" || room.rematchInitiator === this.id) return;
    io.to(otherPlayerId).emit("rematchRequest");

    const isRematchRequested = room.rematchRequest;

    if (!isRematchRequested) {
        room.rematchRequest = true;
        room.rematchInitiator = this.id;
    } else if (room.rematchInitiator === otherPlayerId) {
        initiateRoomRematch(roomId, this.id, otherPlayerId);
    }
}

function initiateRoomRematch(roomId, playerId1, playerId2) {
    io.to(roomId).emit("initiateRematch");

    const room = activeRooms[roomId];
    room.rematchInitiator = null;
    setPlayersStatus(room, playerId1, playerId2, "playing");
    room.rematchRequest = false;
}

function setPlayersStatus(room, playerId1, playerId2, status) {
    room.status[playerId1] = status;
    room.status[playerId2] = status;
}

function handleJoinRoom(color) {
    console.log(this.id, " room join request");

    if (waitingClients.includes(this.id) || Array.from(this.rooms).length > 1) {
        console.log(this.id, " already in the queue or room");
        return;
    }

    waitingClients.queue(this.id)
    userColors[this.id] = color;

    if (waitingClients.length >= CLIENT_WAITING_THRESHOLD) {
        const [player1, player2] = createRoom();
        const roomId = generateRoomId();
        player1.join(roomId);
        player2.join(roomId);

        let id1 = player1.id 
        let id2 = player2.id

        activeRooms[roomId] = {
            players: [id1, id2],
            score: [],
            status: [],
            rematchRequest: false,
            rematchInitiator: null
        };
        activeRooms[roomId].score[id1] = 0
        activeRooms[roomId].score[id2] = 0
        activeRooms[roomId].status[id1] = "playing"
        activeRooms[roomId].status[id2] = "playing"

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

function handleJoinCustomRoom({color, customRoomName}) {
    if (!customQueue[customRoomName]) customQueue[customRoomName] = [];
    if (customQueue[customRoomName].length < CLIENT_WAITING_THRESHOLD - 1) {
        customQueue[customRoomName].push(this);
        userColors[this.id] = color;
        console.log(`${this.id}  joined custom room: ${customRoomName}`);
    } else if (customQueue[customRoomName].length == CLIENT_WAITING_THRESHOLD - 1) {
        const player = customQueue[customRoomName][0];

        this.join(customRoomName);
        player.join(customRoomName);

        let id1 = this.id 
        let id2 = player.id

      activeRooms[roomId] = {
            players: [id1, id2],
            score: [],
            status: [],
            rematchRequest: false,
            rematchInitiator: null
        };
        activeRooms[roomId].score[id1] = 0
        activeRooms[roomId].score[id2] = 0
        activeRooms[roomId].status[id1] = "playing"
        activeRooms[roomId].status[id2] = "playing"

        // Notify both players that they have joined the custom room
        this.emit("roomAssigned", {
            roomId: customRoomName,
            opponentColor: userColors[player.id] // Set the opponent's color based on player1's color
        });

        io.to(player.id).emit("roomAssigned", {
            roomId: customRoomName,
            opponentColor: color // Set the opponent's color based on socket's color
        });

        delete customQueue[customRoomName];

        console.log(`${this.id}  joined custom room: ${customRoomName}`);
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

function createRoom() {
    const player1 = io.sockets.sockets.get(waitingClients.dequeue());
    const player2 = io.sockets.sockets.get(waitingClients.dequeue());
    return [player1, player2];
}

function removeFromWaitingQueue(clientId) {
    waitingClients.removeNode(clientId);
    for (const key in customQueue) {
        customQueue[key] = customQueue[key].filter(c => c.id !== client.Id);
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
