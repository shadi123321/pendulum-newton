import { initEnvironment } from './rendering/Environment.js';
import { createCradle3D } from './rendering/Cradle3D.js';
import { setupInteraction, updateCameraFromKeys, isDragging } from './controls/Interaction.js';
import { CradlePhysics } from './physics/CradlePhysics.js';
import { TableRenderer, CradleGUI, updateHUD } from './UI/UI.js';

const { scene, camera, renderer, controls } = initEnvironment();
const { ballMeshes, updateCradleFromPhysics } = createCradle3D(scene);

const physicsEngine = new CradlePhysics();
const simState = { isRunning: true };
const tableRenderer = new TableRenderer('table-body');
const gui = new CradleGUI(physicsEngine, simState, () => {
    tableRenderer.render(physicsEngine);
});
window.guiInstance = gui;

tableRenderer.render(physicsEngine);

setupInteraction(physicsEngine, ballMeshes, camera, renderer, controls);

const FIXED_DT = 1 / 120;
let accumulator = 0;
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    let frameTime = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    updateCameraFromKeys(frameTime, camera, controls);

    if (!isDragging && simState.isRunning) {
        accumulator += frameTime;
        while (accumulator >= FIXED_DT) {
            physicsEngine.update(FIXED_DT);
            accumulator -= FIXED_DT;
        }
    }

    updateCradleFromPhysics(physicsEngine);

    updateHUD(physicsEngine, physicsEngine.wireAlpha);

    tableRenderer.render(physicsEngine);

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('✅ تم تشغيل البنية الجديدة المتكاملة للموديولات بنجاح تام وبأعلى كفاءة!');