import * as THREE from "three";

export default class Camera {
    constructor(_options) {
        // setup
        this.game = _options.game;
        this.scene = this.game.scene;
        this.config = this.game.contextVariables;

        this.widthDivider = 230;
        this.heightDivider = 260;

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.widthDivider -= 100;
            this.heightDivider -= 100;
        }
        this.setInstance();
    }

    // Sets camera instance
    setInstance = () => {
        this.instance = new THREE.OrthographicCamera(
            this.config.width / -this.widthDivider,
            this.config.width / this.widthDivider,
            this.config.height / this.heightDivider,
            this.config.height / -this.heightDivider,
            0,
            10
        );
        this.instance.position.set(2, 4, 2);
        this.instance.lookAt(0, 3.3, 0);
        this.instance.updateProjectionMatrix();

        this.scene.add(this.instance);
    };

    // Resizes camera instance
    resize = () => {
        this.instance.aspect = this.config.width / this.config.height;
        this.instance.updateProjectionMatrix();

        this.instance.left = this.config.width / -this.widthDivider;
        this.instance.right = this.config.width / this.widthDivider;
        this.instance.top = this.config.height / this.heightDivider;
        this.instance.bottom = this.config.height / -this.heightDivider;
    };

    // Updates camera instance
    update = () => {
        this.instance.position.set(2, this.config.offset, 2);
        this.instance.lookAt(0, this.instance.position.y - 2.2, 0);
    };
}
