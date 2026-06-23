// UI/CradleGUI.js

export default class CradleGUI {
    constructor(cradle, simulationState, onUpdate) {
        this.cradle = cradle;
        this.simState = simulationState;
        this.onUpdate = onUpdate;
        const GUI = window.lil.GUI;
        this.gui = new GUI({ title: "🎛️ لوحة التحكم" });
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';

        this.settings = {
            g: cradle.g,
            damping: cradle.balls[0]?.damping || 0.999,
            massImperfection: 0,
            lengthImperfection: 0,
            ball0Angle: 45, ball1Angle: 0, ball2Angle: 0, ball3Angle: 0, ball4Angle: 0,
            ball0Mass: 1.0, ball1Mass: 1.0, ball2Mass: 1.0, ball3Mass: 1.0, ball4Mass: 1.0
        };

        this.init();
    }

    init() {
        const ctrlFolder = this.gui.addFolder('▶️ التحكم');
        ctrlFolder.add({ start: () => this.startSim() }, 'start').name('تشغيل');
        ctrlFolder.add({ stop: () => this.stopSim() }, 'stop').name('إيقاف مؤقت');

        const anglesFolder = this.gui.addFolder('زوايا البدء (°)');
        anglesFolder.close();
        anglesFolder.add(this.settings, 'ball0Angle', -90, 90, 1).name('كرة #0').onChange(v => this.setBallAngle(0, v));
        anglesFolder.add(this.settings, 'ball1Angle', -90, 90, 1).name('كرة #1').onChange(v => this.setBallAngle(1, v));
        anglesFolder.add(this.settings, 'ball2Angle', -90, 90, 1).name('كرة #2').onChange(v => this.setBallAngle(2, v));
        anglesFolder.add(this.settings, 'ball3Angle', -90, 90, 1).name('كرة #3').onChange(v => this.setBallAngle(3, v));
        anglesFolder.add(this.settings, 'ball4Angle', -90, 90, 1).name('كرة #4').onChange(v => this.setBallAngle(4, v));

        const massesFolder = this.gui.addFolder('كتل الكرات (kg)');
        massesFolder.add(this.settings, 'ball0Mass', 0.1, 5.0, 0.1).name('كتلة #0').onChange(v => this.setBallMass(0, v));
        massesFolder.add(this.settings, 'ball1Mass', 0.1, 5.0, 0.1).name('كتلة #1').onChange(v => this.setBallMass(1, v));
        massesFolder.add(this.settings, 'ball2Mass', 0.1, 5.0, 0.1).name('كتلة #2').onChange(v => this.setBallMass(2, v));
        massesFolder.add(this.settings, 'ball3Mass', 0.1, 5.0, 0.1).name('كتلة #3').onChange(v => this.setBallMass(3, v));
        massesFolder.add(this.settings, 'ball4Mass', 0.1, 5.0, 0.1).name('كتلة #4').onChange(v => this.setBallMass(4, v));

        const physFolder = this.gui.addFolder('الفيزياء');
        physFolder.add(this.settings, 'g', 0, 25, 0.1).name('الجاذبية g').onChange(v => this.cradle.g = v);
        physFolder.add(this.settings, 'damping', 0.90, 1.0, 0.001).name('معامل التخميد').onChange(v => {
            this.cradle.balls.forEach(b => b.damping = v);
        });

        const imperfFolder = this.gui.addFolder('الحساسية الميكانيكية');
        imperfFolder.close();
        imperfFolder.add(this.settings, 'massImperfection', -0.5, 0.5, 0.01).name('Δm (الكرة الوسطى)').onChange(v => {
            if (this.cradle.balls[2]) {
                this.cradle.balls[2].mass = 1 + v;
                this.settings.ball2Mass = 1 + v;
                if (this.onUpdate) this.onUpdate();
            }
        });
        imperfFolder.add(this.settings, 'lengthImperfection', -0.2, 0.2, 0.01).name('ΔL (الكرة الأخيرة)').onChange(v => {
            const last = this.cradle.balls[this.cradle.balls.length - 1];
            if (last) { last.length = 1 + v; last.updatePosition(); }
            if (this.onUpdate) this.onUpdate();
        });

        this.gui.add({ reset: () => this.resetToDefault() }, 'reset').name('🔄 إعادة ضبط المصنع');
    }

    setBallAngle(index, degrees) {
        const balls = this.cradle.balls;
        const dia = this.cradle.radius * 2;
        if (!balls[index]) return;

        const newTheta = (degrees * Math.PI) / 180;
        const oldX = balls[index].length * Math.sin(balls[index].theta);
        const newX = balls[index].length * Math.sin(newTheta);
        const deltaX = newX - oldX;

        balls[index].theta = newTheta;
        balls[index].omega = 0;
        balls[index].alpha = 0;
        balls[index].updatePosition();

        for (let i = index - 1; i >= 0; i--) {
            const gap = ((i + 1) * dia + balls[i + 1].x) - (i * dia + balls[i].x);
            if (gap > dia) break;
            const nx = Math.max(-balls[i].length, Math.min(balls[i].length, balls[i].length * Math.sin(balls[i].theta) + deltaX));
            balls[i].theta = Math.asin(nx / balls[i].length);
            balls[i].omega = 0; balls[i].alpha = 0;
            balls[i].updatePosition();
        }

        for (let i = index + 1; i < balls.length; i++) {
            const gap = (i * dia + balls[i].x) - ((i - 1) * dia + balls[i - 1].x);
            if (gap > dia) break;
            const nx = Math.max(-balls[i].length, Math.min(balls[i].length, balls[i].length * Math.sin(balls[i].theta) + deltaX));
            balls[i].theta = Math.asin(nx / balls[i].length);
            balls[i].omega = 0; balls[i].alpha = 0;
            balls[i].updatePosition();
        }

        if (this.onUpdate) this.onUpdate();
    }

    setBallMass(index, massValue) {
        const ball = this.cradle.balls[index];
        if (ball) {
            ball.mass = massValue;
            if (this.onUpdate) this.onUpdate();
        }
    }

    startSim() { this.simState.isRunning = true; }
    stopSim() { this.simState.isRunning = false; }

    resetToDefault() {
        this.simState.isRunning = false;
        this.settings.g = 9.81;
        this.settings.damping = 0.9995;
        this.settings.massImperfection = 0;
        this.settings.lengthImperfection = 0;
        this.settings.ball0Angle = 0; this.settings.ball1Angle = 0; this.settings.ball2Angle = 0; this.settings.ball3Angle = 0; this.settings.ball4Angle = 0;
        this.settings.ball0Mass = 1.0; this.settings.ball1Mass = 1.0; this.settings.ball2Mass = 1.0; this.settings.ball3Mass = 1.0; this.settings.ball4Mass = 1.0;

        this.cradle.g = 9.81;
        this.cradle.balls.forEach((ball) => {
            ball.mass = 1.0; ball.length = 1.0; ball.damping = 0.9995;
            ball.theta = 0;
            ball.omega = 0; ball.alpha = 0;
            ball.updatePosition();
        });

        this.gui.controllers.forEach(c => c.updateDisplay());
        this.gui.folders.forEach(f => f.controllers.forEach(c => c.updateDisplay()));
        if (this.onUpdate) this.onUpdate();
    }
}