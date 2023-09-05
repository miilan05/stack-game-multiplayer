export default class dvdCollisionEngine {
    constructor(childObject, parentObject, direction, pxPerSec) {
        this.child = childObject;
        this.parent = parentObject;
        this.direction = direction;
        this.pxPerSec = pxPerSec;
        this.position = this.getPositionInsideParent();
        this.angleInRadians = this.direction * (Math.PI / 180);
        this.speedX = Math.cos(this.angleInRadians) * this.pxPerSec;
        this.speedY = Math.sin(this.angleInRadians) * this.pxPerSec;
        this.hue = 0;
        this.updatePosition = this.updatePosition.bind(this);
        this.animate();
    }

    getPositionInsideParent() {
        const parentRect = this.parent.getBoundingClientRect();
        const childRect = this.child.getBoundingClientRect();

        return {
            x: childRect.left - parentRect.left,
            y: childRect.top - parentRect.top
        };
    }

    updatePosition() {
        this.position.x += this.speedX / 60; // Assuming 60 FPS
        this.position.y += this.speedY / 60;

        // Check for collisions with parent's edges
        if (this.position.x < 0 || this.position.x + this.child.offsetWidth > this.parent.offsetWidth) {
            this.changeColor();
            this.speedX = -this.speedX;
        }
        if (this.position.y < 0 || this.position.y + this.child.offsetHeight > this.parent.offsetHeight) {
            this.changeColor();
            this.speedY = -this.speedY;
        }

        this.child.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    }

    animate() {
        setInterval(this.updatePosition, 1000 / 60); // Update every frame
    }

    changeColor() {
        this.hue += 55;
        this.child.style.filter = `hue-rotate(${this.hue}deg)`;
    }
}
