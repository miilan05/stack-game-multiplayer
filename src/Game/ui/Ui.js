import EventEmitter from "../utils/EventEmmiter";
import SharedContext from "../context/SharedContext";

export default class Ui extends EventEmitter {
    constructor(_options) {
        super();

        this.context = new SharedContext();
        // this.contextVariables = this.context.variables;
        // this.contextConstants = this.context.constants;
        this.htmlGetters = this.context.htmlGetters;
        this.ui = this.htmlGetters.ui();
        this.score = this.htmlGetters.score(_options.targetElement);
        this.highscore = this.htmlGetters.highscore(_options.targetElement);

        this.menuWrapper = document.getElementById("menu-wrapper");
        this.profileImg = document.getElementById("profile-img");
        this.menuBtn = document.getElementsByClassName("menu-button")[0];
        this.loginBtn = document.getElementById("loginBtn");
        this.registerBtn = document.getElementById("registerBtn");
        this.resetStatsBtn = document.getElementById("resetStatsBtn");
        this.deleteAccountBtn = document.getElementById("deleteAccountBtn");
        this.musicVolumeSlider = document.getElementById("musicVolumeSlider");
        this.effectsVolumeSlider = document.getElementById("effectsVolumeSlider");
        this.zoomSlider = document.getElementById("zoomSlider");

        this.opened = true;
    }

    ToggleText = bool => {
        this.ToggleElementVisibility(this.ui, bool);
    };

    ToggleScore = bool => {
        this.ToggleElementVisibility(this.score, bool);
    };

    ToggleHighScore = bool => {
        this.ToggleElementVisibility(this.highscore, bool);
    };

    ToggleElementVisibility = (e, bool) => {
        if (bool) {
            e.style.visibility = "visible";
        } else {
            e.style.visibility = "hidden";
        }
    };

    addEventListeners() {
        this.menuBtn.addEventListener("click", () => this.handleMenuBtn());
        this.profileImg.addEventListener("click", () => this.handleProfileImg());
        this.loginBtn.addEventListener("click", () => this.handleLoginBtn());
        this.registerBtn.addEventListener("click", () => this.handleRegisterBtn());
        this.resetStatsBtn.addEventListener("click", () => this.handleResetStatsBtn());
        this.deleteAccountBtn.addEventListener("click", () => this.handleDeleteAccountBtn());
        this.musicVolumeSlider.addEventListener("input", () => this.handleMusicVolumeSlider());
        this.effectsVolumeSlider.addEventListener("input", () => this.handleEffectsVolumeSlider());
        this.zoomSlider.addEventListener("input", () => this.handleZoomSlider());
    }

    handleMenuBtn() {
        this.menuBtn.classList.toggle("change");
        this.menuWrapper.classList.toggle("no-display");
    }

    updateBackground = _options => {
        let color = "linear-gradient(180deg, ";
        for (let i = 0; i < 11; i++) {
            color += `hsl(${(_options.color - i * 3) % 360}, 100%, 80%) ${i * 10}%, `;
        }
        color = color.substring(0, color.length - 2) + ")";
        _options.game.targetElement.style.background = color;
    };
}
