const io = require("socket.io-client");

export default class SocketClient {
    static instance;

    static socketInstance; // Store the socket instance as a static property

    constructor() {
        if (SocketClient.socketInstance) {
            // If the socket instance already exists, use it
            this.socket = SocketClient.socketInstance;
        } else {
            // Otherwise, create a new connection and store it
            this.connect();
            SocketClient.socketInstance = this.socket;
        }
    }

    connect() {
        this.socket = io("http://10.1.1.105:3000", {
            withCredentials: true,
            extraHeaders: {
                "my-custom-header": "abcd"
            }
        });

        // Listen for server disconnection
        this.socket.on("disconnect", () => {
            console.log("Disconnected from the server");
        });
    }

    sendMessage(type, message) {
        this.socket.emit(`${type}`, message);
    }
}
