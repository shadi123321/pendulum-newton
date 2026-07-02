export class BallPhysics {
     static AIR_DENSITY = 1.2;          // Air density (kg/m³) under standard conditions
    static DRAG_COEFFICIENT = 0.47;    // Drag coefficient for a sphere (approximate value for a smooth sphere)
    
    /**
      * @param {number} mass - Mass of the ball (kg)
     * @param {number} length - Length of the string (m)
     * @param {number} angle - Initial angle (radians)
     * @param {number} g - Acceleration due to gravity (m/s²)
     * @param {number} damping - Damping coefficient (value less than 1 causes energy loss)
     * @param {number} ballRadius - Radius of the ball (m), used to compute cross‑sectional area
     * @param {number} restitution - Coefficient of restitution (0 = perfectly inelastic, 1 = perfectly elastic)
     */
    // constructor done
   constructor({ mass, length, angle, g, damping, ballRadius, restitution})
    {
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
     getTangentialVelocity() //v=ωr
     {
         return this.omega * this.length; 
        }

    // convert angular velocity to linear velocity 
    setTangentialVelocity(v) //ω=v/L
    { 
        this.omega = v / this.length;
     }

     getTangentialWeightComponent() //force of weight W=-m.g.sin(0)
     { 
        return -this.mass * this.g * Math.sin(this.theta);
     }
     
    getAirResistanceForce()  // drag equation: F_drag = 0.5 * rho * Cd * A * v^2
    {
        const v = this.getTangentialVelocity();
        if (Math.abs(v) < 1e-6) return 0; // avoid division by zero or very small values
         const drag = 0.5 * BallPhysics.AIR_DENSITY * BallPhysics.DRAG_COEFFICIENT * this.crossSectionalArea * v * v;
        return -Math.sign(v) * drag; // negative sign because force opposes motion
    }

   
   computeTension() {
    const v = this.getTangentialVelocity();
     const radialWeight = this.mass * this.g * Math.cos(this.theta);
     const centripetal = (this.mass * v * v) / this.length;
    this.tension = radialWeight + centripetal;

    if (this.tension < 0) {
        this.tension = 0;
    }

    return this.tension;
}   
    //T new =T old/2.cos(a)
    computeTensionPerWire(alpha) { return this.computeTension() / (2 * Math.cos(alpha)); }
    SegmaForces() {
        return this.getTangentialWeightComponent() + this.getAirResistanceForce();
    }
     //Newton's Low in motion 
    updateAngularAcceleration()
     {
         this.alpha = this.SegmaForces() / (this.mass * this.length); }
     updatePosition() {
        this.x = this.length * Math.sin(this.theta);   // horizontal displacement
        this.y = -this.length * Math.cos(this.theta);  // vertical displacement (negative because upward is positive)
    }
    integrateEuler(dt) {
        this.updateAngularAcceleration();      // compute angular acceleration from current forces
        this.omega += this.alpha * dt;         // update angular velocity
        this.omega *= this.damping;            // apply damping (gradual energy loss)
        this.theta += this.omega * dt;         // update angle
        this.updatePosition();                 // update coordinates (x, y)
        this.computeTension();                 // compute tension in string (to maintain constraint)
    }
    update(dt) {
        if (dt > 0.03)
             dt = 0.03; // set maximum time step
        this.integrateEuler(dt);
    }
      //Ek = 0.5 * m * v^2 */
    get kineticEnergy() { return 0.5 * this.mass * this.getTangentialVelocity() ** 2; }

    //y = -length) 
    get height() { return this.y + this.length; }

    //Ep = m * g * h 
    getPotentialEnergy(g = null) 
    { return this.mass * (g || this.g) * this.height; }

    //E=Ek+Ep
    getTotalEnergy(g = null) 
    {
     return this.kineticEnergy + this.getPotentialEnergy(g); 
        }

    /**
     * Static function to resolve an elastic collision between two pendulums (balls) in a single
     * tangential direction. Uses one‑dimensional elastic collision equations with restitution coefficient.
     * @param {BallPhysics} b1 - First pendulum (left)
     * @param {BallPhysics} b2 - Second pendulum (right)
     * @param {number} restitution - Coefficient of restitution (default 1 for perfectly elastic)
     */
    static resolveCollision(b1, b2, e = 1.0) {
    const m1 = b1.mass;
    const m2 = b2.mass;

    const v1 = b1.getTangentialVelocity();
    const v2 = b2.getTangentialVelocity();

     const totalMass = m1 + m2;

    // الزخم الكلي
    const momentum = m1 * v1 + m2 * v2;

    // السرعة النسبية بين الكرتين
    const relativeVelocity = v1 - v2;

    // السرعات الجديدة
    const newV1 = (momentum - m2 * e * relativeVelocity) / totalMass;
    const newV2 = (momentum + m1 * e * relativeVelocity) / totalMass;

    // تطبيق النتائج
    b1.setTangentialVelocity(newV1);
    b2.setTangentialVelocity(newV2);
}
}

// Bind the class to window to ensure global compatibility with any other traditional files
window.BallPhysics = BallPhysics;