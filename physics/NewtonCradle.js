// ========================================================================
//  NewtonCradle.js – موديول إدارة مصفوفة الكرات وحساب الاصطدامات المتتالية
// ========================================================================

import { PendulumPhysics } from './PendulumPhysics.js';
import { CradleAudio } from '../Audio.js'; // تأكد من مسار الصوت لديك

export class NewtonCradle {
    constructor() {
        this.g = 9.81;
        this.radius = 0.05;
        this.balls = [];
        this.count = 5;
        this.wireAlpha = (15 * Math.PI) / 180;

        for (let i = 0; i < this.count; i++) {
            this.balls.push(new PendulumPhysics({
                mass: 1,
                length: 1,
                angle: 0, 
                g: this.g,
                damping: 0.9995,
                ballRadius: this.radius,
                 restitution: 0.98
            }));
        }
    }

    // 🌟 التعديل هنا: دالة جديدة لتحديث الجاذبية في النظام بأكمله
    setGravity(newG) {
        this.g = newG;
        for (const ball of this.balls) {
            ball.g = newG; // تمرير الجاذبية الجديدة لكل كرة على حدة
        }
    }

    update(dt) {
        for (const ball of this.balls) ball.update(dt);
        this.detectCollisions();
    }

    detectCollisions() {
        for (let pass = 0; pass < 8; pass++) {
            for (let i = 0; i < this.balls.length - 1; i++) {
                const left = this.balls[i];
                const right = this.balls[i + 1];
                const worldX1 = i * this.radius * 2 + left.x;
                const worldY1 = left.y;
                const worldX2 = (i + 1) * this.radius * 2 + right.x;
                const worldY2 = right.y;
                const dx = worldX2 - worldX1, dy = worldY2 - worldY1;
                const distance = Math.hypot(dx, dy);
                if (distance <= this.radius * 2) {
                    const v1 = left.getTangentialVelocity();
                    const v2 = right.getTangentialVelocity();
                    if (v1 > v2) {
                        // استخدام pass === 0 لمنع تداخل الأصوات في نفس الإطار
                        if (pass === 0 && typeof CradleAudio !== 'undefined') {
                            CradleAudio.play(v1 - v2);
                        }
                        PendulumPhysics.resolveCollision(left, right, left.restitution);
                    }
                }
            }
        }
    }
}

// ربط الكلاس بـ window للتوافقية العالمية
window.NewtonCradle = NewtonCradle;