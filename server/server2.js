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
        socket.to(getRoomIdByClientId(socket.id)).emit("cutAndPlaceFalse", data);
    });

    socket.on("lost", data => {
        socket.to(getRoomIdByClientId(socket.id)).emit("lost", data);
    });

    socket.on("rematchRequest", handleRematchRequest);
}

function handleDisconnect() {}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
