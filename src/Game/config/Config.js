// FIX THIS MESS
export default class Config {
    constructor() {
        const boundings = document.querySelectorAll(".game-instance")[0].getBoundingClientRect();
        this.config = {};
        this.config.movementSpeed = 1000;
        this.config.movementSpeedIncrease = 0.02;
        this.config.needsUp = 0;
        this.config.width = boundings.width;
        this.config.height = boundings.height || window.innerHeight;
        this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2);
        this.config.started = false;
        this.config.color = 100; // hsl value
        this.config.lost = false;
        this.config.startingtShape = { x: 2, y: 2 }; // current and starting shape
        this.config.offset = 2.8; // camera z offset from 0
        this.config.cubeHeight = 0.24;
        this.config.currentHeight = this.config.cubeHeight * 2 + 0.02; // the height at which cubes are placed
        this.config.randomizeColor = true; // if set to false change .color to the prefered value
        this.config.colorIncrement = 3; // color incrementation after every click
        this.config.easingFunctions = [
            ["Linear", "None"],
            ["Quadratic", "In"],
            ["Quadratic", "Out"],
            ["Quadratic", "InOut"],
            ["Cubic", "In"],
            ["Cubic", "Out"],
            ["Cubic", "InOut"],
            ["Quartic", "In"],
            ["Quartic", "Out"],
            ["Quartic", "InOut"],
            ["Quintic", "In"],
            ["Quintic", "Out"],
            ["Quintic", "InOut"],
            ["Sinusoidal", "In"],
            ["Sinusoidal", "Out"],
            ["Sinusoidal", "InOut"],
            ["Exponential", "In"],
            ["Exponential", "Out"],
            ["Exponential", "InOut"],
            ["Circular", "In"],
            ["Circular", "Out"],
            ["Circular", "InOut"],
            ["Elastic", "In"],
            ["Elastic", "Out"],
            ["Elastic", "InOut"],
            ["Back", "In"],
            ["Back", "Out"],
            ["Back", "InOut"],
            ["Bounce", "In"],
            ["Bounce", "Out"],
            ["Bounce", "InOut"]
        ];
        this.config.easingFunction = ["Linear", "None"];
        this.config.ui = "#ui";
        this.config.score = "#score";
        this.config.highscore = "#highscore";
    }
}
