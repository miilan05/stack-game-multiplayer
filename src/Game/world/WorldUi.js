import SharedContext from "../context/SharedContext";

export default class WorldUi {
    constructor(targetElement) {
        this.targetElement = targetElement;
        this.context = new SharedContext();
        // this.contextVariables = this.context.variables;
        // this.contextConstants = this.context.constants;
        this.htmlGetters = this.context.htmlGetters;
        this.worldUi = this.htmlGetters.ui();
        this.score = this.htmlGetters.score(this.targetElement);
        this.highscore = this.htmlGetters.highscore(this.targetElement);
    }

    ToggleText = bool => {
        this.ToggleElementVisibility(this.worldUi, bool);
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

    updateBackground = _options => {
        let color = "linear-gradient(180deg, ";
        for (let i = 0; i < 11; i++) {
            color += `hsl(${(_options.color - i * 3) % 360}, 100%, 80%) ${i * 10}%, `;
        }
        color = color.substring(0, color.length - 2) + ")";
        _options.game.targetElement.style.background = color;
    };
}
