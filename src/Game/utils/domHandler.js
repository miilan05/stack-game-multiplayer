export default class domHandler {
    static addUiToPlayer(playerInstance) {
        playerInstance.innerHTML +=
            '<div class="score-wrapper"><p id="score">0</p><div id="highscore"><img src="./images/crown.png"><p>64</p></div></div><div id="ui"><h1>STACK</h1><p class="loading">WAITING FOR OPPONENT</p></div>';
    }

    static addUiToOpponent(opponentInstance) {
        opponentInstance.innerHTML +=
            '<div class="score-wrapper"><p id="score">0</p><div id="highscore"><img src="./images/crown.png"><p>64</p></div></div>';
    }

    static addWaitingToOpponent(opponentInstance) {
        opponentInstance.innerHTML += '<img id="search-svg" src="./images/dvd-logo.svg">';
    }

    static removeWaitingFromOpponent(opponentInstance) {
        opponentInstance.querySelector("img").remove();
    }

    static removePhoneScreen() {
        document.getElementById("phone").remove();
    }

    static showPhoneScreen() {
        document.body.innerHTML += '<h1 id="phone">Click to load game</h1>';
    }

    static rematchRecieved(btn) {
        btn.innerHTML = "Accept Rematch";
    }

    static rematchInitiated(btn) {
        btn.innerHTML = "Rematch";
        document.getElementById("button-wrapper2").style.display = "none";
    }
    static bothLost() {
        document.getElementById("button-wrapper2").style.display = "block";
    }

    static opponentDisconnected(btn) {
        btn.disabled = true;
    }
}
