 
 import { BallPhysics } from './BallPhysics.js';
 import { CradleAudio } from '../Audio.js';  

 export class CradlePhysics {
    constructor() {
         this.g = 9.81;
         this.radius = 0.05;
         this.balls = [];
         this.count = 5;
         this.wireAlpha = (15 * Math.PI) / 180;

        // إنشاء الكرات وإضافتها إلى المصفوفة بمعاملات فيزيائية محددة
        for (let i = 0; i < this.count; i++) {
            this.balls.push(new BallPhysics({
                mass: 1,                 
                length: 1,               
                angle: 0,                
                g: 9.81,               
                damping: 0.9995,         
                ballRadius: this.radius,  
                restitution: 0.98  
            }));
        }
    }

      setGravity(newG) {
        this.g = newG;  
        for (const ball of this.balls) {
            ball.g = newG;  
        }
    }
detectCollisions() {
    //iteratioin 8 times per frame 

         for (let pass = 0; pass < 8; pass++) {
             for (let i = 0; i < this.balls.length - 1; i++) {
                 const left = this.balls[i];   //leftball 
                 const right = this.balls[i + 1]; //right ball 

                 const worldX1 = i * this.radius * 2 + left.x;
                const worldX2 = (i + 1) * this.radius * 2 + right.x;

                //the same 
                const worldY1 = left.y; 
                const worldY2 = right.y;

                //calculate distance 
                const dx = worldX2 - worldX1;
                const dy = worldY2 - worldY1;
                const distance = Math.hypot(dx, dy);
                
                // ture->there is a collusion 
                if (distance <= this.radius * 2) {
                     //get the Tangential Velocity
                     const v1 = left.getTangentialVelocity();
                    const v2 = right.getTangentialVelocity();

                    // if left>right 
                    //Displacement  from right--> v1>v2 -----because w:negative  --->v2:negative &v1:null =0

                    if (v1 > v2) {
                          if (pass === 0 && typeof CradleAudio !== 'undefined') {
                             CradleAudio.play(v1 - v2);
                        }
                       // process the collision by calcuate the new velocity and e=restitution factor 
                          BallPhysics.resolveCollision(left, right, left.restitution);
                    }
                }
            }
        }
    }
     update(dt) {
         for (const ball of this.balls)
             ball.update(dt);
         this.detectCollisions();
    }

     
}

 window.CradlePhysics = CradlePhysics;