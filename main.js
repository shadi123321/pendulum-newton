// main.js

// 📥 استيراد مكونات البيئة والرسم ثلاثي الأبعاد من المجلد المخصص لها
import { initEnvironment } from './rendering/Environment.js';
import { createCradle3D } from './rendering/Cradle3D.js';

// 📥 استيراد دوال ومغيرات التفاعل
import { setupInteraction, updateCameraFromKeys, isDragging } from './controls/Interaction.js';

// 📥 استيراد محرك منظومة نيوتن والـ UI
import { NewtonCradle } from './physics/NewtonCradle.js'; 
import { TableRenderer, CradleGUI, updateHUD } from './UI/UI.js';

// 1️⃣ تهيئة البيئة الأساسية واستخراج كائنات Three.js
const { scene, camera, renderer, controls } = initEnvironment();

// 2️⃣ تهيئة مجسمات كرات البندول ثلاثية الأبعاد داخل المشهد
const { ballMeshes, updateCradleFromPhysics } = createCradle3D(scene);

// 3️⃣ تهيئة محرك الفيزياء وإدارة الحالة العامة
const physicsEngine = new NewtonCradle();
const simState = { isRunning: true };

// 4️⃣ تهيئة وعرض الجداول ولوحة القيادة الرسومية
const tableRenderer = new TableRenderer('table-body');
const gui = new CradleGUI(physicsEngine, simState, () => {
    tableRenderer.render(physicsEngine);
});
window.guiInstance = gui;

tableRenderer.render(physicsEngine);

// 5️⃣ تفعيل أحداث التفاعل (السحب والإفلات) وتمرير الكائنات إليها بشكل صريح
setupInteraction(physicsEngine, ballMeshes, camera, renderer, controls);

// 6️⃣ إعداد مؤقت التحديث الثابت للفيزياء (Fixed Timestep)
const FIXED_DT = 1 / 120;
let accumulator = 0;
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    let frameTime = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // تحديث حركة الكاميرا من موديول الأحداث بشكل آمن
    updateCameraFromKeys(frameTime, camera, controls);

    // تحديث المحاكاة الفيزيائية للبندول بنظام التوقيت الثابت (عند عدم السحب)
    if (!isDragging && simState.isRunning) {
        accumulator += frameTime;
        while (accumulator >= FIXED_DT) {
            physicsEngine.update(FIXED_DT);
            accumulator -= FIXED_DT;
        }
    }

    // مزامنة وعرض البيانات الرسومية الحركية وتحديث الـ HUD والجدول
    updateCradleFromPhysics(physicsEngine);
    updateHUD(physicsEngine, physicsEngine.wireAlpha);
    tableRenderer.render(physicsEngine);

    controls.update();
    renderer.render(scene, camera);
}

// البدء في تفعيل الأنيميشن والمشهد ثلاثي الأبعاد
animate();

// إدارة أحداث التجاوب مع مقاسات الشاشة المختلفة للمتصفح
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('✅ تم تشغيل البنية الجديدة المتكاملة للموديولات بنجاح تام وبأعلى كفاءة!');