import * as THREE from "three";
import * as CANNON from "cannon-es";
import * as TWEEN from "@tweenjs/tween.js";
import WorldPhysics from "./WorldPhysics";
import Intersections from "../utils/Intersections";
import Effects from "../utils/Effects";
import PhysicsUtils from "../utils/PhysicsUtils";
import Ui from "../ui/Ui";
import TYPES from "../config/types";
import SocketClient from "../client/SocketClient";

const WorldStates = {
    INIT: "INIT",
    PLAYING: "PLAYING",
    LOST: "LOST"
};

export default class World {
    constructor(_options) {
        this.game = _options.game;
        this.optionsColor = _options.color;
        this.targetElement = _options.targetElement;
        this.optionsColor
            ? (this.color = this.optionsColor)
            : (this.color = this.game.contextVariables.randomizeColor ? Math.floor(Math.random() * 360) : this.game.contextVariables.color);
        this.initializeWorld();
        this.type = _options.type;
        this.type === TYPES.MULTIPLAYER_PLAYER ? this.setSocket() : null;
        this.state = WorldStates.INIT;
    }

    setSocket() {
        this.client = new SocketClient();
    }

    sendSocketMessage(type, message) {
        if (this.type === TYPES.MULTIPLAYER_PLAYER) {
            this.client.sendMessage(type, message);
        }
    }

    initializeWorld() {
        this.config = this.game.contextVariables;
        this.constants = this.game.contextConstants;
        this.setSceneAndPhysics();
        this.addLight();
        this.menu.ToggleScore(false);
        this.menu.ToggleHighScore(false);
    }

    setSceneAndPhysics() {
        this.setInstanceVariables();
        this.setWorldPhysics();
        this.addStaticMesh();
    }

    setInstanceVariables() {
        // we load every variable that the world class needs from the config class
        this.lagHandling = {
            queue: []
        };
        this.map = { static: [], falling: [] };
        this.scene = this.game.scene;
        this.instance = new CANNON.World();
        this.instance.gravity.set(0, -10, 0);
        this.movementAxis = "x";
        this.score = this.targetElement.querySelector("#score");
        this.score.innerHTML = 0;
        this.stx = this.constants.STARTING_SHAPE.x;
        this.sty = this.constants.STARTING_SHAPE.y;
        this.currentShape = { x: this.stx, y: this.sty };
        this.offset = this.config.offset;
        this.needsUp = this.config.needsUp;
        this.colorIncrement = this.config.colorIncrement;
        this.cubeHeight = this.config.cubeHeight;
        this.currentHeight = this.config.currentHeight;
        this.lost = this.config.lost;
        this.movementSpeed = this.config.movementSpeed;
        this.movementSpeedIncrease = this.constants.MOVEMENT_SPEED_INCREASE;
        this.started = this.config.started;
        this.menu = new Ui({ targetElement: this.targetElement });
        this.continueAllowed = false;
        this.perfectAudio = new Audio("./audio/click2.wav");
        this.clickAudio = new Audio("./audio/click1.wav");
        this.target = 2.7;

        this.menu.updateBackground({ color: this.color, game: this.game });
    }

    addEventListeners() {
        this.game.targetElement.addEventListener("click", () => {
            this.onClick();
        });
        window.addEventListener("keydown", e => {
            if (e.code === "Space") this.onClick();
        });
    }

    addLight() {
        const light2 = new THREE.AmbientLight(0xffffff, 0.4);
        const light3 = new THREE.DirectionalLight(0xffffff, 0.6);
        light3.castShadow = true;
        light3.position.set(300, 600, -300);
        light3.shadow.camera.position.set(-10, 300, -10);
        light3.shadow.mapSize.width = 1024 * 4;
        light3.shadow.mapSize.height = 1024 * 4;

        this.scene.add(light2, light3);
    }

    // the addStaticMesh and addNextMesh ads the initial meshes to the scene
    addStaticMesh() {
        const staticGeo = this.createGeometry(this.currentShape.x, 2, this.currentShape.y);
        const staticTransparentMaterial = this.createMaterial(this.color, 0.7);
        const texture = new THREE.TextureLoader().load("./images/1.jpg");
        staticTransparentMaterial.alphaMap = texture;
        staticTransparentMaterial.transparent = true;
        const cubeMaterials = [
            staticTransparentMaterial,
            staticTransparentMaterial,
            this.createMaterial(this.color, 0.7),
            staticTransparentMaterial,
            staticTransparentMaterial,
            staticTransparentMaterial
        ];

        const meshStatic = new THREE.Mesh(staticGeo, cubeMaterials);
        meshStatic.position.set(0, -0.5 - this.cubeHeight / 2, 0);
        meshStatic.receiveShadow = true;
        this.scene.add(meshStatic);
        const body = PhysicsUtils.meshToBody(meshStatic, 0, true);
        this.instance.addBody(body);
        this.map.static.push({ mesh: meshStatic, body: body });
    }

    addNextMesh() {
        const geometry = this.createGeometry(this.currentShape.x, this.currentShape.y, this.cubeHeight);
        const material = this.createMaterial(this.color, 1);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-1, this.currentHeight, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI / 2;
        this.scene.add(mesh);
        this.map.static.push({ mesh: mesh, body: null });
    }

    setWorldPhysics() {
        this.worldPhysics = new WorldPhysics(this.map.falling);
    }

    startMovingMesh() {
        this.move(this.map.static.at(-1).mesh, "x", 2.7, this.movementSpeed, this.config.easingFunction);
    }

    createMaterial(hue, opacity) {
        const color = `hsl(${hue % 360}, 100%, ${30 + 10 * opacity}%)`;
        const material = new THREE.MeshStandardMaterial({ color });

        return material;
    }

    createGeometry(x, y, z) {
        return new THREE.BoxGeometry(x, y, z);
    }

    getMeshById(id) {
        return this.map.static.at(id).mesh;
    }

    updateGame() {
        this.increaseSpeed();
        this.score.innerHTML = parseInt(this.score.innerHTML) + 1;
        this.menu.updateBackground({ color: this.color, game: this.game });
        this.needsUp += this.cubeHeight;
        this.placeNewBlock();
        this.color += this.colorIncrement;
    }

    async onClick() {
        if (this.state === WorldStates.LOST) {
            return this.restart();
        }

        if (this.state === WorldStates.INIT) {
            this.sendSocketMessage("start");
            return this.start();
        }

        const lastBlock = this.getMeshById(-1);
        const intersect = Intersections.intersects(lastBlock, this.getMeshById(-2));

        if (!intersect) {
            return this.handleLost(lastBlock);
        }

        this.cutAndPlace(intersect.insidePiece, false);
        this.sendSocketMessage("cutAndPlaceFalse", { intersect, currentHeight: this.currentHeight, position: lastBlock.position });

        if (!intersect.outsidePiece) {
            this.playPerfectEffect();
        } else {
            this.playClickEffect();
            this.cutAndPlace(intersect.outsidePiece, true);
        }

        this.updateGame();
    }

    handleLost(lastBlock) {
        lastBlock.tween.stop();
        this.sendSocketMessage("lost", { undefined, currentHeight: this.currentHeight, position: lastBlock.position });
        this.lostFunction(lastBlock);
    }

    playPerfectEffect() {
        this.perfectAudio.currentTime = 0;
        this.perfectAudio.play();
        Effects.perfectEffect(this.scene, this.map.static.at(-1).mesh.position, this.currentShape.x + 0.2, this.currentShape.y + 0.2);
    }

    playClickEffect() {
        this.clickAudio.currentTime = 0;
        this.clickAudio.play();
    }

    // this function takes in the intersection coordinates and places the cut block
    cutAndPlace(i, isFalling) {
        const geometry = this.createGeometry(i.right - i.left, i.top - i.bottom, this.cubeHeight);
        const material = new THREE.MeshStandardMaterial().copy(this.map.static.at(-1).mesh.material);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(i.left + (i.right - i.left) / 2, this.currentHeight, i.bottom + (i.top - i.bottom) / 2);
        mesh.rotation.x = Math.PI / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // in case the block needs to fall we create the cannon body and add them to the map that updates the physics
        if (isFalling) {
            const body = PhysicsUtils.meshToBody(mesh, 1, true);
            body.applyImpulse(new CANNON.Vec3(0, -2, 0), new CANNON.Vec3(0, 0, 0));
            this.map.falling.push({ mesh: mesh, body: body });
            this.instance.addBody(body);
        } else {
            this.currentShape.x = i.right - i.left;
            this.currentShape.y = i.top - i.bottom;
            this.scene.remove(this.map.static.at(-1).mesh);
            this.map.static.pop();
            const body = PhysicsUtils.meshToBody(mesh, 0, true);
            this.instance.addBody(body);
            this.map.static.push({ mesh: mesh, body: body });
        }
        this.scene.add(mesh);
    }

    // this places a new block after we clicked
    placeNewBlock() {
        const geometry = this.createGeometry(this.currentShape.x, this.currentShape.y, this.cubeHeight);
        const material = this.createMaterial(this.color, 1);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI / 2;
        this.currentHeight += this.cubeHeight;
        // we add it to the static list but it actualy isnt static (has no physics but its moving using tween)
        this.map.static.push({ mesh: mesh, body: null });

        // depending on the current axis we place the new mesh and toggle the axis
        if (this.movementAxis == "x") {
            this.movementAxis = "z";
            mesh.position.set(this.map.static.at(-2).mesh.position.x, this.currentHeight, this.map.static.at(-2).mesh.position.z - 2);
        } else {
            this.movementAxis = "x";
            mesh.position.set(this.map.static.at(-2).mesh.position.x - 2, this.currentHeight, this.map.static.at(-2).mesh.position.z);
        }
        this.scene.add(mesh);
        this.move(this.map.static.at(-1).mesh, this.movementAxis, 2.7, this.movementSpeed, this.config.easingFunction);
    }

    // this function moves a mesh on an axis from a to b
    move(mesh, axis, target, duration, easingFunction) {
        this.target = target;
        const startPosition = { [axis]: mesh.position[axis] };
        const endPosition = { [axis]: target };

        if (mesh.tween) {
            mesh.tween.stop();
        }

        mesh.tween = new TWEEN.Tween(startPosition)
            .to(endPosition, duration)
            .easing(TWEEN.Easing[easingFunction[0]][easingFunction[1]])
            .onUpdate(() => {
                mesh.position[axis] = startPosition[axis];
            })
            // we switch directions after one movement is complete
            .onComplete(() => {
                this.move(mesh, this.movementAxis, -target, duration, this.config.easingFunction);
            })
            .start();
    }

    increaseSpeed(increaseRate = this.movementSpeedIncrease, maxSpeed = 200) {
        this.movementSpeed = Math.max(this.movementSpeed + (maxSpeed - this.movementSpeed) * (1 - Math.exp(-increaseRate)), maxSpeed);
    }

    lostFunction(lastBlock) {
        // we end the game and let the last cube fall down
        this.lost = true;
        this.config.started = false;
        this.needsUp = 0;
        const body = PhysicsUtils.meshToBody(lastBlock, 1, true);
        body.applyImpulse(new CANNON.Vec3(0, -2, 0), new CANNON.Vec3(0, 0, 0));
        // -z = right down | z = top right | x = left down | -x right up
        // z = x axis | x = z axis
        this.map.falling.push({ mesh: lastBlock, body: body });
        this.instance.addBody(body);
        this.menu.ToggleHighScore(true);
        this.state = WorldStates.LOST;
    }

    start() {
        this.addNextMesh();
        this.startMovingMesh();
        this.menu.ToggleText(false);
        this.menu.ToggleScore(true);
        this.state = WorldStates.PLAYING;
    }

    restart() {
        if (this.type != TYPES.MULTIPLAYER_OPPONENT) this.menu.ToggleText(true);
        this.menu.ToggleHighScore(false);
        this.menu.ToggleScore(false);
        this.config.offset = this.offset;
        this.map.static.forEach(e => {
            this.scene.remove(e.mesh);
        });
        this.map.falling.forEach(e => {
            this.scene.remove(e.mesh);
        });
        this.map.falling = [];
        this.map.static = [];
        this.setSceneAndPhysics();
        this.state = WorldStates.INIT;
    }

    update() {
        this.worldPhysics.update(this.instance);
        TWEEN.update();
        // improve this
        if (this.needsUp > 0.5) {
            this.config.offset += this.needsUp / 100;
            this.needsUp -= this.needsUp / 100;
        }
    }
}
