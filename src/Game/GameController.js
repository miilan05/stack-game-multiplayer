import Game from "./Game";
import TYPES from "./config/types";
import SocketClient from "./client/SocketClient";
import dvdCollisionEngine from "./utils/dvdCollisionEngine";
import domHandler from "./utils/domHandler";

export default class GameController {
    constructor(gameWrapper) {
        this.gameWrapper = gameWrapper;

        const gamePlayerElement = document.createElement("div");
        const gameOpponentElement = document.createElement("div");

        gamePlayerElement.classList.add("game-instance");
        gameOpponentElement.classList.add("game-instance");

        gameWrapper.appendChild(gamePlayerElement);
        gameWrapper.appendChild(gameOpponentElement);
    }
    createGame() {
        const playerInstance = this.gameWrapper.getElementsByClassName("game-instance")[0];
        const opponentInstance = this.gameWrapper.getElementsByClassName("game-instance")[1];

        domHandler.addUiToPlayer(playerInstance);
        domHandler.addWaitingToOpponent(opponentInstance);

        this.dvd = new dvdCollisionEngine(opponentInstance.querySelector("img"), opponentInstance, 45, 300);
        opponentInstance.style.background += "rgb(17, 17, 17)";

        const urlParams = new URLSearchParams(window.location.search);
        const customRoom = urlParams.get("room");

        if (customRoom) {
            this.connect(customRoom);
            this.gamePlayer = new Game({
                targetElement: playerInstance,
                type: TYPES.MULTIPLAYER_PLAYER
            });
        } else {
            this.gamePlayer = new Game({
                targetElement: playerInstance,
                type: TYPES.MULTIPLAYER_PLAYER
            });
            this.connect();
            this.joinRoom();
        }

        this.client.socket.on("roomAssigned", e => {
            domHandler.addUiToOpponent(opponentInstance);
            domHandler.removeWaitingFromOpponent(opponentInstance);
            playerInstance.querySelector("#ui p").textContent = "TAP TO START";
            playerInstance.querySelector("#ui p").classList.remove("loading");

            this.gamePlayer.world.addEventListeners();

            this.gameOpponent = new Game({
                targetElement: opponentInstance,
                type: TYPES.MULTIPLAYER_OPPONENT,
                color: e.opponentColor
            });
        });
        this.client.socket.on("opponentDisconnected", this.destroyGame);
    }

    // handle disconnection
    destroyGame() {
        console.log("opponentDisconnected");
    }

    joinRoom() {
        this.client.sendMessage("joinRoom", this.gamePlayer.world.color);
    }
    leaveRoom() {
        this.client.sendMessage("leaveRoom");
    }
    connect(customRoom) {
        this.client = new SocketClient(customRoom);
    }
}
