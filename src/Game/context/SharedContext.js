const boundings = () => {
    return document.querySelectorAll(".game-instance")[0].getBoundingClientRect();
};

export default class SharedContext {
    constructor() {
        // Define constant variables
        this.constants = {
            DEFAULT_COLOR: 100, // default color
            MOVEMENT_SPEED_INCREASE: 0.02,
            STARTING_SHAPE: { x: 2, y: 2 },
            EASING_FUNCTIONS: [
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
            ]
        };

        this.htmlGetters = {
            ui: () => {
                return document.getElementById("ui");
            },
            score: target => {
                return target.querySelector("#score");
            },
            highscore: target => {
                return target.querySelector("#highscore");
            },
            gamePlayer: () => {
                return document.querySelectorAll(".game-instance")[0];
            },
            gameOpponent: () => {
                return document.querySelectorAll(".game-instance")[1];
            }
        };

        // Define pre-existing variables
        this.variables = {
            movementSpeed: 1000,
            needsUp: 0,
            width: boundings().width,
            height: boundings().height,
            pixelRatio: Math.min(Math.max(window.devicePixelRatio, 1), 2),
            started: false, //change this to states
            lost: false, //change this too to states
            currentShape: this.constants.STARTING_SHAPE,
            offset: 2.8, // camera z-axis offset from 0
            cubeHeight: 0.24,
            currentHeight: 0.24 * 2 + 0.02, // keep it in "cubeHeight * 2 + 0.02" format
            randomizeColor: true,
            colorIncrement: 3,
            easingFunction: this.constants.EASING_FUNCTIONS[0]
        };
    }

    // Add a new variable to the context
    addVariable(key, value) {
        this.variables[key] = value;
    }

    // Get the value of a variable by its key
    getVariable(key) {
        return this.variables[key];
    }

    // Update the value of an existing variable
    updateVariable(key, value) {
        if (this.variables.hasOwnProperty(key)) {
            this.variables[key] = value;
        } else {
            throw new Error(`Variable '${key}' does not exist in the context.`);
        }
    }
}
