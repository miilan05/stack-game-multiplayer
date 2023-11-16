import EventEmitter from "../utils/EventEmmiter";

export default class Sizes extends EventEmitter {
    constructor() {
        super();
        this.trigger("resize");
        this.trigger("resize");

        // setup
        this.fullScreenButton = document.getElementById("window-fullscreen");
        this.menu = document.getElementById("menu-wrapper");
        this.menuButton = document.getElementsByClassName("menu-button");

        //Resize event
        window.addEventListener("resize", () => {
            this.resizeMenu();
            this.trigger("resize");
            this.trigger("resize");
        });
        this.resizeMenu(window.innerHeight);
    }

    toggleFullScreen = () => {
        var doc = window.document;
        var docEl = doc.documentElement;

        var requestFullScreen =
            docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
            this.fullScreenButton.textContent = "Close Fullscreen";
        } else {
            cancelFullScreen.call(doc);
            this.fullScreenButton.textContent = "Open Fullscreen";
        }
    };

    resizeMenu = () => {
        let zoomPerc = 100 - (900 - window.innerHeight) * 0.08;

        this.menu.style.zoom = zoomPerc + "%";
        this.menuButton[0].style.top = (42 * zoomPerc) / 100 + "px";
        this.menuButton[0].style.right = (42 * zoomPerc) / 100 + "px";
    };
}
