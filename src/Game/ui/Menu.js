export default class Menu {
    constructor(gameClass) {
        this.gameClass = gameClass;

        this.menuWrapper = document.getElementById("menu-wrapper");
        this.profileImg = document.getElementById("profile-img");
        this.menuBtn = document.getElementsByClassName("menu-button")[0];
        this.loginBtn = document.getElementById("loginBtn");
        this.registerBtn = document.getElementById("registerBtn");
        this.resetStatsBtn = document.getElementById("resetStatsBtn");
        this.deleteAccountBtn = document.getElementById("deleteAccountBtn");
        this.musicVolumeSlider = document.getElementById("musicVolumeSlider");
        this.effectsVolumeSlider = document.getElementById("effectsVolumeSlider");
        // this.zoomSlider = document.getElementById("zoomSlider");
    }

    addEventListeners() {
        this.menuBtn.addEventListener("click", () => this.handleMenuBtn());
        this.profileImg.addEventListener("click", () => this.handleProfileImg());
        this.loginBtn.addEventListener("click", () => this.handleLoginBtn());
        this.registerBtn.addEventListener("click", () => this.handleRegisterBtn());
        this.resetStatsBtn.addEventListener("click", () => this.handleResetStatsBtn());
        this.deleteAccountBtn.addEventListener("click", () => this.handleDeleteAccountBtn());
        this.musicVolumeSlider.addEventListener("input", e => this.handleMusicVolumeSlider(e));
        this.effectsVolumeSlider.addEventListener("input", e => this.handleEffectsVolumeSlider(e));
        // this.zoomSlider.addEventListener("input", () => this.handleZoomSlider());
    }

    handleEffectsVolumeSlider(e) {
        this.gameClass.world.setClickAudio(e.target.value / 100);
    }

    handleMenuBtn() {
        this.menuBtn.classList.toggle("change");
        this.menuWrapper.classList.toggle("no-display");
    }
}
