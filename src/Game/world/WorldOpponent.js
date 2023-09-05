import World from "./World";
import TYPES from "../config/types";
import SocketClient from "../client/SocketClient";
import Effects from "../utils/Effects";
import * as TWEEN from "@tweenjs/tween.js";

export default class WorldOpponent extends World {
    constructor(_options) {
        super(_options);
        this.onClick();
        this.client = new SocketClient();
        this.addSocketEvents();
    }

    start() {
        this.addNextMesh();
        this.startMovingMesh();
        this.menu.ToggleScore(true);
    }

    move(mesh, axis, target, duration, easingFunction) {
        const startPosition = { [axis]: mesh.position[axis] };
        const lagHandlingNeeded = this.lagHandling.queue.length != 0;
        let endPosition;

        if (lagHandlingNeeded) {
            let i = this.lagHandling.queue[0];
            endPosition = { [axis]: i.position[axis] };
            duration = (Math.abs(startPosition[axis] - endPosition[axis]) / 5.4) * duration;
        } else {
            endPosition = { [axis]: target };
        }
        if (mesh.tween) {
            mesh.tween.stop();
        }
        mesh.tween = new TWEEN.Tween(startPosition)
            .to(endPosition, duration)
            .easing(TWEEN.Easing[easingFunction[0]][easingFunction[1]])
            .onUpdate(() => {
                mesh.position[axis] = startPosition[axis];
            });
        if (lagHandlingNeeded) {
            mesh.tween.onComplete(() => {
                const { intersect, currentHeight, position } = this.lagHandling.queue.shift();
                // if we click but the game is lost we restart it and exit the function
                // if there is no intersection the user has lost and the function exits
                // if (!intersect) {
                //     // lastBlock.tween.stop();
                //     this.lostFunction(lastBlock);
                //     return;
                // }
                // if both ifs above arent true we update everything and continue the game
                this.score.innerHTML = parseInt(this.score.innerHTML) + 1;
                this.menu.updateBackground({ color: this.color, game: this.game });

                this.cutAndPlace(intersect.insidePiece, false);
                // in case the intersects function hasnt returnd an outside piece the user has made a perfect intersection and we play the perfec effect
                if (!intersect.outsidePiece) {
                    Effects.perfectEffect(
                        this.scene,
                        this.map.static.at(-1).mesh.position,
                        this.currentShape.x + 0.2,
                        this.currentShape.y + 0.2
                    );
                } else {
                    this.cutAndPlace(intersect.outsidePiece, true);
                }

                this.placeNewBlock();
                this.color += this.colorIncrement;
            });
        } else {
            // we switch directions after one movement is complete
            mesh.tween.onComplete(() => {
                this.move(mesh, this.movementAxis, -target, duration, this.config.easingFunction);
            });
        }

        mesh.tween.start();
    }

    // add socket.io event listeners
    addSocketEvents() {
        this.client.socket.on("cutAndPlaceFalse", data => {
            if (this.lost) {
                this.restart();
                this.lost = false;
                return;
            }
            if (!this.config.started) {
                this.start();
                this.config.started = true;
                return;
            }
            this.movementSpeed = this.increaseSpeed(this.movementSpeed, this.movementSpeedIncrease, 200);
            const lastBlock = this.map.static.at(-1).mesh;
            // lastBlock.tween.stop();
            this.needsUp += this.cubeHeight;

            const intersect = data.intersect;
            this.lagHandling.queue.push({
                intersect: data.intersect,
                currentHeight: data.currentHeight,
                position: data.position
            });
        });
        // ADD: move lost piece to position and then lose the game so that we dont have intersection when we lose
        this.client.socket.on("lost", position => {
            const lastBlock = this.map.static.at(-1).mesh;
            lastBlock.tween.stop();
            this.lostFunction(lastBlock);
        });
    }
}
