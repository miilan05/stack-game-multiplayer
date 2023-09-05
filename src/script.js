import GameController from "./Game/GameController";
import domHandler from "./Game/utils/domHandler";

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
