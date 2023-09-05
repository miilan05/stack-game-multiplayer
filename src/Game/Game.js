import * as THREE from "three";
import Sizes from "./ui/Sizes";
import Camera from "./core/Camera";
import Renderer from "./core/Renderer";
import World from "./world/World";
import Config from "./config/Config";
import Ui from "./ui/Ui";
import TYPES from "./config/types";
import WorldOpponent from "./world/WorldOpponent";

export default class Game {
    constructor(_options = {}) {
        // Set the target DOM element for the game
        this.targetElement = _options.targetElement;
        this.type = _options.type;
        this.color = _options.color;
        // Initialize game components
        this.setConfig();
        this.setScene();
        this.setCamera();
        this.setRenderer();
        this.setWorld(); // Call the setWorld method
        // Set up sizes and listen for resize events
        this.sizes = new Sizes();
        this.sizes.on("resize", () => {
            this.resize();
        });

        // Set up the game menu and its event listeners
        this.menu = new Ui({ targetElement: this.targetElement });
        if (this.type != TYPES.MULTIPLAYER_OPPONENT) this.menu.addEventListeners();
        // this.menu.resize();
        // Start the game loop
        this.update();
    }

    // Set game configuration
    setConfig() {
        this.config = new Config().config;
    }

    // Handle window resize events
    resize() {
        const boundings = this.targetElement.getBoundingClientRect();
        this.config.width = boundings.width;
        this.config.height = boundings.height;
        this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2);

        if (this.camera) this.camera.resize();
        if (this.renderer) this.renderer.resize();

        // this.menu.resize();
    }

    // Create a new THREE.js scene
    setScene() {
        this.scene = new THREE.Scene();
    }

    // Create a new camera instance
    setCamera() {
        this.camera = new Camera({ game: this });
    }

    // Create a new renderer instance and append it to the target element
    setRenderer() {
        this.renderer = new Renderer({
            game: this
        });
        this.targetElement.appendChild(this.renderer.instance.domElement);
    }

    // Set the world - Default implementation
    setWorld() {
        if (this.type === TYPES.MULTIPLAYER_PLAYER || this.type === TYPES.SINGLEPLAYER) {
            this.world = new World({
                game: this,
                targetElement: this.targetElement,
                type: this.type
            });
        } else if (this.type === TYPES.MULTIPLAYER_OPPONENT) {
            this.world = new WorldOpponent({
                game: this,
                targetElement: this.targetElement,
                type: this.type,
                color: this.color
            });
        } else {
            console.log("incorrect type at setWorld");
        }
    }

    // Main game loop
    update() {
        // Update game components
        this.camera.update();
        if (this.renderer) this.renderer.update();
        if (this.world) this.world.update();

        // Request the next animation frame
        window.requestAnimationFrame(() => {
            this.update();
        });
    }
}
