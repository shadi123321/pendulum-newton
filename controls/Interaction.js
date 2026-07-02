// ========================================================================
//  controls/Interaction.js – إدارة التفاعل مع المستخدم (سحب الكرات، تحريك الكاميرا، إعادة الضبط)
// ========================================================================

/**
 * هذا الملف مسؤول عن:
 * 1. التحكم في الكاميرا باستخدام لوحة المفاتيح (الأسهم، WASD، Q/E).
 * 2. تفاعل السحب بالماوس أو اللمس لتحريك الكرات يدوياً.
 * 3. إعادة ضبط التجربة (النقر المزدوج أو زر الإعادة).
 */

// ==================== أدوات Three.js للتعامل مع الأشعة ====================
// راي كاستر لاكتشاف الكرات التي يتم النقر عليها
const raycaster = new THREE.Raycaster();
// متجه لتخزين إحداثيات الماوس في الفضاء الموحد (-1 إلى 1)
const mousePos = new THREE.Vector2();

// متغير عام لتتبع حالة السحب (هل المستخدم يسحب كرة حالياً؟)
export let isDragging = false;

// ==================== متغيرات خاصة بالسحب ====================
let dragIdx = -1;               // فهرس الكرة التي يتم سحبها (-1 يعني لا شيء)
let dragStartX = 0;             // موقع الماوس X عند بدء السحب
let dragStartTheta = 0;         // زاوية الكرة عند بدء السحب
let dragPrevTheta = 0;          // الزاوية السابقة (لحساب السرعة)
let dragPrevTime = 0;           // الوقت السابق (لحساب السرعة)
let dragVel = 0;                // السرعة الزاوية الناتجة عن السحب (تُمنح للكرة عند التحرير)

// ==================== متغيرات الكاميرا (نظام إحداثيات كروي) ====================
let camTheta = Math.PI;         // الزاوية الأفقية (حول المحور Y)
let camPhi = Math.PI / 6;       // الزاوية الرأسية (من الأعلى)
let camRadius = 7;              // المسافة من نقطة الهدف
const camTarget = new THREE.Vector3(0, 1.0, 0); // النقطة التي تنظر إليها الكاميرا

// ==================== إدارة ضغطات المفاتيح ====================
// كائن يخزن حالة كل مفتاح (مضغوط أم لا)
const keysDown = {};
window.addEventListener('keydown', e => {
    keysDown[e.code] = true;
    // منع تمرير الصفحة عند استخدام مفاتيح الأسهم
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keysDown[e.code] = false; });

/**
 * تحديث الكاميرا بناءً على مفاتيح التحكم (تُستدعى كل إطار)
 * @param {number} dt - الفاصل الزمني (بالثواني)
 * @param {THREE.Camera} camera - كائن الكاميرا
 * @param {THREE.OrbitControls} controls - عناصر التحكم في المدار (للتزامن)
 */
export function updateCameraFromKeys(dt, camera, controls) {
    // سرعات الدوران والتحريك والزوم (مضروبة في dt للاستقلال عن معدل الإطارات)
    const rotSpeed = 1.4 * dt, panSpeed = 4.0 * dt, zoomSpeed = 6.0 * dt;

    // الأسهم لتدوير الكاميرا حول الهدف
    if (keysDown['ArrowLeft']) camTheta -= rotSpeed;
    if (keysDown['ArrowRight']) camTheta += rotSpeed;
    if (keysDown['ArrowUp']) camPhi = Math.max(0.05, camPhi - rotSpeed);   // الحد الأعلى (لا نتجاوز القطب)
    if (keysDown['ArrowDown']) camPhi = Math.min(1.50, camPhi + rotSpeed); // الحد الأدنى (لا نمر تحت الأرض)

    // Q/E للتكبير والتصغير
    if (keysDown['KeyQ']) camRadius = Math.max(2, camRadius - zoomSpeed);
    if (keysDown['KeyE']) camRadius = Math.min(20, camRadius + zoomSpeed);

    // WASD لتحريك نقطة الهدف (التحريك الموازي للأرض)
    if (keysDown['KeyW'] || keysDown['KeyA'] || keysDown['KeyS'] || keysDown['KeyD']) {
        // حساب متجهات الاتجاه المعتمدة على camTheta (أفقي فقط)
        const forward = new THREE.Vector3(-Math.sin(camTheta), 0, -Math.cos(camTheta)).normalize();
        const right = new THREE.Vector3(Math.cos(camTheta), 0, -Math.sin(camTheta)).normalize();
        if (keysDown['KeyW']) camTarget.addScaledVector(forward, panSpeed);
        if (keysDown['KeyS']) camTarget.addScaledVector(forward, -panSpeed);
        if (keysDown['KeyA']) camTarget.addScaledVector(right, -panSpeed);
        if (keysDown['KeyD']) camTarget.addScaledVector(right, panSpeed);
    }

    // تحديث موقع الكاميرا في الفضاء الكروي
    camera.position.set(
        camTarget.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta),
        camTarget.y + camRadius * Math.cos(camPhi),
        camTarget.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta)
    );
    camera.lookAt(camTarget);
    // مزامنة نقطة هدف عناصر التحكم المدارية (إذا استُخدمت)
    controls.target.copy(camTarget);
}

/**
 * دالة مساعدة للحصول على أول كائن تصطدم به الأشعة الصادرة من الماوس/اللمس.
 * @param {Event} e - حدث الماوس أو اللمس
 * @param {THREE.Object3D[]} objs - مصفوفة الكائنات القابلة للتفاعل
 * @param {THREE.Camera} camera - الكاميرا المستخدمة
 * @param {THREE.WebGLRenderer} renderer - العارض للحصول على أبعاد الشاشة
 * @returns {THREE.Intersection|null} - نتيجة التصادم أو null
 */
function getIntersect(e, objs, camera, renderer) {
    const rect = renderer.domElement.getBoundingClientRect();
    // الحصول على إحداثيات الماوس/اللمس (تدعم اللمس المتعدد بأخذ أول لمسة)
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    // تحويل إلى إحداثيات NDC (تتراوح بين -1 و 1)
    mousePos.x = ((cx - rect.left) / rect.width) * 2 - 1;
    mousePos.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mousePos, camera);
    const hits = raycaster.intersectObjects(objs);
    return hits.length ? hits[0] : null;
}

/**
 * إعداد التفاعلات (السحب، إعادة الضبط، تحديث المؤشر) وإرفاقها بالعناصر.
 * @param {NewtonCradle} physicsEngine - محرك الفيزياء (يحتوي على الكرات)
 * @param {Array} ballMeshes - مصفوفة كائنات تحتوي على mesh وبيانات الكرة (يُفترض أن لكل كرة mesh)
 * @param {THREE.Camera} camera - كاميرا المشهد
 * @param {THREE.WebGLRenderer} renderer - عارض WebGL
 * @param {THREE.OrbitControls} controls - عناصر التحكم (للتزامن مع تحديث الكاميرا)
 */
export function setupInteraction(physicsEngine, ballMeshes, camera, renderer, controls) {
    // استخراج الشبكات (meshes) من كائنات ballMeshes للكشف بالرايكاستر
    const draggable = ballMeshes.map(b => b.mesh);

    /**
     * بدء السحب (حدث mousedown أو touchstart)
     */
    function onDragStart(e) {
        const hit = getIntersect(e, draggable, camera, renderer);
        if (!hit) return; // لم يصطدم بأي كرة

        isDragging = true;
        dragIdx = hit.object.userData.ballIndex; // فهرس الكرة مخزّن في userData
        dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
        dragStartTheta = physicsEngine.balls[dragIdx].theta;
        dragPrevTheta = dragStartTheta;
        dragPrevTime = performance.now();
        dragVel = 0;
        // إيقاف أي حركة ذاتية للكرة أثناء السحب
        physicsEngine.balls[dragIdx].omega = 0;
        // تغيير لون الكرة للإشارة إلى أنها مُسحبة
        ballMeshes[dragIdx].mesh.material.color.setHex(0xffdd88);
        if (!e.touches) e.preventDefault(); // منع السلوك الافتراضي للماوس
    }

    /**
     * تحريك المؤشر/اللمس أثناء السحب (mousemove / touchmove)
     */
    function onDragMove(e) {
        // إذا لم يكن هناك سحب، نقوم بتحديث شكل المؤشر (يد أم سهم) حسب وجود كرة تحت المؤشر
        if (!isDragging || dragIdx < 0) {
            if (!e.touches) {
                renderer.domElement.style.cursor = getIntersect(e, draggable, camera, renderer) ? 'grab' : 'default';
            }
            return;
        }

        // حساب الإزاحة الأفقية من نقطة البداية
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = cx - dragStartX;
        // تحويل الإزاحة إلى تغير في الزاوية (معامل تحويل 150 بكسل لكل راديان تقريباً)
        let newTheta = dragStartTheta + dx * (Math.PI / 150);
        // تحديد الزاوية بين -90 و +90 درجة (لا نسمح بتجاوز الأفقي)
        newTheta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newTheta));

        // حساب السرعة الزاوية اللحظية من تغير الزاوية خلال الزمن
        const now = performance.now();
        const dt = now - dragPrevTime;
        if (dt > 0) {
            const raw = (newTheta - dragPrevTheta) / (dt / 1000);
            // تجانس السرعة (فلتر تمرير منخفض) للحصول على سرعة سلسة عند التحرير
            dragVel = dragVel * 0.6 + raw * 0.4;
        }
        dragPrevTheta = newTheta;
        dragPrevTime = now;

        // تحديث زاوية الكرة الفيزيائية مباشرة (دون تأثير القوى)
        const ball = physicsEngine.balls[dragIdx];
        ball.theta = newTheta;
        ball.omega = 0; // منع أي حركة ذاتية أثناء السحب
        ball.updatePosition();

        if (!e.touches) renderer.domElement.style.cursor = 'grabbing';
    }

    /**
     * إنهاء السحب (mouseup / touchend)
     */
    function onDragEnd() {
        if (isDragging && dragIdx >= 0) {
            // إعادة لون الكرة إلى اللون الافتراضي
            ballMeshes[dragIdx].mesh.material.color.setRGB(0xee/255, 0xee/255, 0xee/255);
            // منح الكرة السرعة الزاوية التي تم حسابها أثناء السحب (لتستمر في الحركة)
            physicsEngine.balls[dragIdx].omega = dragVel;
        }
        isDragging = false;
        dragIdx = -1;
        dragVel = 0;
        renderer.domElement.style.cursor = 'default';
    }

    // ==================== ربط الأحداث ====================
    renderer.domElement.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    // أحداث اللمس (مع passive: false للسماح بـ preventDefault)
    renderer.domElement.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);

    /**
     * دالة إعادة ضبط المهد (ترجع جميع الكرات إلى وضعها الأولي)
     * الكرة الأولى تُزاح بزاوية 45 درجة، والباقي في المنتصف.
     */
    function resetCradle() {
        physicsEngine.balls.forEach((b, i) => {
            b.theta = i === 0 ? Math.PI / 4 : 0;
            b.omega = 0;
            b.alpha = 0;
            b.updatePosition();
        });
        // إذا كانت واجهة المستخدم (GUI) موجودة، نعيد ضبط قيمها إلى الافتراضية
        if (window.guiInstance) window.guiInstance.resetToDefault();
    }

    // ==================== أحداث إعادة الضبط ====================
    // النقر المزدوج على أي كرة يعيد ضبط المحاكاة
    renderer.domElement.addEventListener('dblclick', (e) => {
        if (getIntersect(e, draggable, camera, renderer)) resetCradle();
    });
    // زر الإعادة الموجود في صفحة HTML (بمعرف reset-btn)
    document.getElementById('reset-btn').addEventListener('click', resetCradle);
}