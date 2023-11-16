import GameController from "./Game/GameController";
import domHandler from "./Game/utils/domHandler";

// change server.js so that it saves player scores on lost and when both lost it sends a signal to both of them
// that triggers a function that will run some animation to show who of them won the round, the signal also needs
// to restart the game for both of them.
// after all rounds are finished send a signal that the game ended that will run some animations to show them who won
// and update the data to the database

let gameController;

if (screen.orientation.type == "portrait-primary" || screen.orientation.type == "portrait-secondary") {
    domHandler.showPhoneScreen();
    document.addEventListener(
        "click",
        () => {
            var doc = window.document;
            var docEl = doc.documentElement;

            var requestFullScreen =
                docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

            if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
                requestFullScreen.call(docEl);
            } else {
                cancelFullScreen.call(doc);
            }
            screen.orientation.lock("landscape");
            gameController = new GameController(document.querySelector("#game-wrapper"));
            gameController.createGame();
            domHandler.removePhoneScreen();
        },
        { once: true }
    );
} else {
    gameController = new GameController(document.querySelector("#game-wrapper"));
    gameController.createGame();
}
