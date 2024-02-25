const io = require("socket.io-client");

// singleton pattern
export default class SocketClient {
    static instance;

    static socketInstance;

    constructor(customRoom) {
        if (SocketClient.socketInstance) {
            this.socket = SocketClient.socketInstance;
        } else {
            this.connect(customRoom);
            SocketClient.socketInstance = this.socket;
        }
    }

    connect() {
        this.socket = io("http://10.1.1.105:0000", {
            // this.socket = io("http://10.100.97.173:3000", {
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
