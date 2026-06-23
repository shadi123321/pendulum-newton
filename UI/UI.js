// UI/UI.js

import TableRenderer from './TableRenderer.js';
import CradleGUI from './CradleGUI.js';

// إعادة تصدير الكلاسات لسهولة الوصول إليها من ملف واحد
export { TableRenderer, CradleGUI };

// دالة تحديث شاشة العرض (HUD) الحالية في أعلى اليسار
export function updateHUD(physicsEngine, wireAlpha) {
    let totalE = 0, maxAngle = 0, maxSpeed = 0, maxTension = 0;
    for (const b of physicsEngine.balls) {
        totalE += b.getTotalEnergy(physicsEngine.g);
        maxAngle = Math.max(maxAngle, Math.abs(b.theta));
        maxSpeed = Math.max(maxSpeed, Math.abs(b.getTangentialVelocity()));
        maxTension = Math.max(maxTension, b.computeTensionPerWire(wireAlpha));
    }
    document.getElementById('hud-energy').textContent = totalE.toFixed(3) + ' J';
    document.getElementById('hud-angle').textContent = (maxAngle * 180 / Math.PI).toFixed(1) + '°';
    document.getElementById('hud-speed').textContent = maxSpeed.toFixed(3) + ' m/s';
    document.getElementById('hud-tension').textContent = maxTension.toFixed(2) + ' N';
}