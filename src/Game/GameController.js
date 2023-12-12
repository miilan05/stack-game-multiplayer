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
        this.rematchBtn = document.getElementById("rematch-button");
        this.rematchBtn.onclick = () => this.handleRematchButton();
        this.otherPlayerBtn = document.getElementById("other-player-button");
        this.otherPlayerBtn.onclick = () => this.handleOtherPlayerButton();
        this.addedEventListeners = false;

        this.zoomSlider = document.getElementById("zoomSlider");
        this.zoomSlider.addEventListener("input", () => this.handleZoomSlider());
    }

    createGame() {
        const playerInstance = this.gameWrapper.getElementsByClassName("game-instance")[0];
        let opponentInstance = this.gameWrapper.getElementsByClassName("game-instance")[1];

        domHandler.addUiToPlayer(playerInstance);
        domHandler.addWaitingToOpponent(opponentInstance);

        this.dvd = new dvdCollisionEngine(opponentInstance.querySelector("img"), opponentInstance, 45, 300);
        opponentInstance.style.background += "rgb(17, 17, 17)";

        const urlParams = new URLSearchParams(window.location.search);
        const customRoom = urlParams.get("room");

        if (customRoom) {
            this.gamePlayer = new Game({
                targetElement: playerInstance,
                type: TYPES.MULTIPLAYER_PLAYER
            });
            this.connect();
            this.joinCustomRoom(customRoom);
        } else {
            this.gamePlayer = new Game({
                targetElement: playerInstance,
                type: TYPES.MULTIPLAYER_PLAYER
            });
            this.connect();
            this.joinRoom();
        }

        this.client.socket.on("roomAssigned", e => {
            opponentInstance = this.gameWrapper.getElementsByClassName("game-instance")[1];
            domHandler.addUiToOpponent(opponentInstance);
            domHandler.removeWaitingFromOpponent(opponentInstance);
            playerInstance.querySelector("#ui p").textContent = "TAP TO START";
            playerInstance.querySelector("#ui p").classList.remove("loading");
            this.rematchBtn.disabled = false;
            this.gamePlayer.world.state = "INIT";

            if (!this.addedEventListeners) {
                this.gamePlayer.world.addEventListeners();
                this.addedEventListeners = true;
            }
            this.gameOpponent = new Game({
                targetElement: opponentInstance,
                type: TYPES.MULTIPLAYER_OPPONENT,
                color: e.opponentColor
            });
        });
        this.client.socket.on("opponentDisconnected", () => this.handleOpponentDisconnection());
        this.client.socket.on("rematchRequest", () => domHandler.rematchRecieved(this.rematchBtn));
        this.client.socket.on("initiateRematch", () => {
            this.gamePlayer.world.restart();
            this.gameOpponent.world.restart();
            this.gameOpponent.world.start();
            this.gamePlayer.world.menu.ToggleText(true);
            this.gameOpponent.world.menu.ToggleScore(true);
            domHandler.rematchInitiated(this.rematchBtn);
        });
        this.client.socket.on("both-lost", () => {
            if (this.gameOpponent.world.lost) domHandler.bothLost();
            else this.gameOpponent.world.bothLost = true;
        });
    }

    handleOpponentDisconnection() {
        this.rematchBtn.disabled = true;
        this.gameOpponent.world.lost = true;
        if (this.gamePlayer.world.lost) domHandler.bothLost();
    }

    joinRoom() {
        this.client.sendMessage("joinRoom", this.gamePlayer.world.color);
    }

    joinCustomRoom(room) {
        this.client.sendMessage("joinCustomRoom", { color: this.gamePlayer.world.color, customRoomName: room });
    }

    leaveRoom() {
        this.client.sendMessage("leaveRoom");
    }

    connect(customRoom) {
        this.client = new SocketClient(customRoom);
    }

    handleRematchButton() {
        this.client.sendMessage("rematchRequest");
    }

    handleOtherPlayerButton() {
        const color = this.gamePlayer.world.color;
        this.gameWrapper.removeChild(this.gameWrapper.getElementsByClassName("game-instance")[1]);
        delete this.gameOpponent;

        const gameOpponentElement = document.createElement("div");
        gameOpponentElement.classList.add("game-instance");
        this.gameWrapper.appendChild(gameOpponentElement);

        const opponentInstance = this.gameWrapper.getElementsByClassName("game-instance")[1];
        opponentInstance.style.background += "rgb(17, 17, 17)";
        domHandler.addWaitingToOpponent(opponentInstance);
        this.dvd = new dvdCollisionEngine(opponentInstance.querySelector("img"), opponentInstance, 45, 300);

        this.gamePlayer.world.restart();
        this.gamePlayer.world.state = "LOST";
        this.gamePlayer.world.menu.ToggleText(true);

        this.gameWrapper.getElementsByClassName("game-instance")[0].querySelector("#ui p").textContent = "WAITING FOR OPPONENT";
        this.gameWrapper.getElementsByClassName("game-instance")[0].querySelector("#ui p").classList.remove("loading");

        domHandler.rematchInitiated(this.rematchBtn);

        this.client.sendMessage("findOtherPlayerReq", color);
    }

    handleZoomSlider() {
        this.gamePlayer.camera.widthDivider = 260 * (this.zoomSlider.value / 100);
        this.gamePlayer.camera.heightDivider = 260 * (this.zoomSlider.value / 100);

        this.gameOpponent.camera.widthDivider = 230 * (this.zoomSlider.value / 100);
        this.gameOpponent.camera.heightDivider = 230 * (this.zoomSlider.value / 100);

        this.gamePlayer.camera.resize();
        this.gameOpponent.camera.resize();
    }
}
