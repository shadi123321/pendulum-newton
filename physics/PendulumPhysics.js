// ========================================================================
//  PendulumPhysics.js – موديول المحاكاة الفيزيائية للبندول المنفرد
// ========================================================================

export class PendulumPhysics {
    // Attributes الفيزيائية الخاصة بالبيئة ومقاومة الهواء داخل الكلاس
    static AIR_DENSITY = 1.2;
    static DRAG_COEFFICIENT = 0.47;
    
    constructor({ mass = 1, length = 1, angle = 0, g = 9.81, damping = 0.9995, ballRadius = 0.05, restitution = 0.98 }) {
        this.mass = mass;
        this.length = length;
        this.g = g;
        this.radius = ballRadius;
        this.theta = angle;
        this.omega = 0;
        this.alpha = 0;
        this.damping = damping;
        this.restitution = restitution;
        this.tension = 0;
        this.weight = mass * g;
        this.crossSectionalArea = Math.PI * this.radius * this.radius;
        this.updatePosition();
    }

    updatePosition() {
        this.x = this.length * Math.sin(this.theta);
        this.y = -this.length * Math.cos(this.theta);
    }

    getTangentialVelocity() { return this.omega * this.length; }
    setTangentialVelocity(v) { this.omega = v / this.length; }

    getTangentialWeightComponent() { return -this.mass * this.g * Math.sin(this.theta); }
    getRadialWeightComponent() { return this.mass * this.g * Math.cos(this.theta); }

    getAirResistanceForce() {
        const v = this.getTangentialVelocity();
        if (Math.abs(v) < 1e-6) return 0;
        // استخدام الـ Attributes الثابتة للكلاس هنا
        const drag = 0.5 * PendulumPhysics.AIR_DENSITY * PendulumPhysics.DRAG_COEFFICIENT * this.crossSectionalArea * v * v;
        return -Math.sign(v) * drag;
    }

    computeTension() {
        const v = this.getTangentialVelocity();
        const radialWeight = this.getRadialWeightComponent();
        const centripetal = (this.mass * v * v) / this.length;
        this.tension = radialWeight + centripetal;
        if (this.tension < 0) this.tension = 0;
        return this.tension;
    }

    computeTensionPerWire(alpha) { return this.computeTension() / (2 * Math.cos(alpha)); }

    getNetTangentialForce() {
        return this.getTangentialWeightComponent() + this.getAirResistanceForce();
    }

    updateAngularAcceleration() { this.alpha = this.getNetTangentialForce() / (this.mass * this.length); }

    integrateEuler(dt) {
        this.updateAngularAcceleration();
        this.omega += this.alpha * dt;
        this.omega *= this.damping;
        this.theta += this.omega * dt;
        this.updatePosition();
        this.computeTension();
    }

    update(dt) {
        if (dt > 0.03) dt = 0.03;
        this.integrateEuler(dt);
    }

    get kineticEnergy() { return 0.5 * this.mass * this.getTangentialVelocity() ** 2; }
    get height() { return this.y + this.length; }
    getPotentialEnergy(g = null) { return this.mass * (g || this.g) * this.height; }
    getTotalEnergy(g = null) { return this.kineticEnergy + this.getPotentialEnergy(g); }

    static resolveCollision(b1, b2, restitution = 1.0) {
        const m1 = b1.mass, m2 = b2.mass;
        const v1 = b1.getTangentialVelocity(), v2 = b2.getTangentialVelocity();
        const newV1 = ((m1 - restitution * m2) * v1 + (1 + restitution) * m2 * v2) / (m1 + m2);
        const newV2 = ((1 + restitution) * m1 * v1 + (m2 - restitution * m1) * v2) / (m1 + m2);
        b1.setTangentialVelocity(newV1);
        b2.setTangentialVelocity(newV2);
    }
}

// ربط الكلاس بـ window لضمان التوافقية العالمية مع أي ملفات تقليدية أخرى
window.PendulumPhysics = PendulumPhysics;