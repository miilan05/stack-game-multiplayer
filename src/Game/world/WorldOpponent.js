import World from "./World";
import SocketClient from "../client/SocketClient";
import * as TWEEN from "@tweenjs/tween.js";

const WorldStates = {
    INIT: "INIT",
    PLAYING: "PLAYING",
    LOST: "LOST"
};

export default class WorldOpponent extends World {
    constructor(_options) {
        super(_options);
        this.onClick();
        this.client = new SocketClient();
        this.addSocketEvents();
    }

    start() {
        super.start();
        this.menu.ToggleText(true);
    }

    move(mesh, axis, target, duration, easingFunction) {
        let lagHandlingNeeded = this.lagHandling.queue.length !== 0;

        const startPosition = { [axis]: mesh.position[axis] };
        const endPosition = lagHandlingNeeded ? { [axis]: this.lagHandling.queue[0].position[axis] } : { [axis]: target };
        duration = lagHandlingNeeded ? (Math.abs(startPosition[axis] - endPosition[axis]) / 5.4) * duration : duration;

        if (mesh.tween) {
            mesh.tween.stop();
        }
        mesh.tween = new TWEEN.Tween(startPosition)
            .to(endPosition, duration)
            .easing(TWEEN.Easing[easingFunction[0]][easingFunction[1]])
            .onUpdate(() => {
                mesh.position[axis] = startPosition[axis];
            })
            .onComplete(() => {
                if (lagHandlingNeeded) {
                    const { intersect } = this.lagHandling.queue.shift();
                    if (!intersect) {
                        super.lostFunction(mesh);
                        return;
                    }
                    this.cutAndPlace(intersect.insidePiece, false);
                    if (!intersect.outsidePiece) {
                        super.playPerfectEffect();
                    } else {
                        this.cutAndPlace(intersect.outsidePiece, true);
                    }
                    super.updateGame();
                } else {
                    this.move(mesh, this.movementAxis, -target, duration, this.config.easingFunction);
                }
            });

        mesh.tween.start();
    }

    // add socket.io event listeners
    addSocketEvents() {
        this.client.socket.on("cutAndPlaceFalse", data => {
            if (this.state === WorldStates.LOST) {
                this.restart();
                this.start();
            }
            if (!data.intersect) return;

            this.increaseSpeed();
            this.needsUp += this.cubeHeight;

            this.lagHandling.queue.push({
                intersect: data.intersect,
                currentHeight: data.currentHeight,
                position: data.position
            });
        });

        // ADD: move lost piece to position and then lose the game so that we dont have intersection when we lose
        this.client.socket.on("lost", data => {
            this.lagHandling.queue.push({
                intersect: undefined,
                currentHeight: data.currentHeight,
                position: data.position
            });
        });
    }
}
