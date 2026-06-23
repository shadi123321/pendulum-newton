// controls/Interaction.js

const raycaster = new THREE.Raycaster();
const mousePos = new THREE.Vector2();

export let isDragging = false;

let dragIdx = -1;
let dragStartX = 0, dragStartTheta = 0, dragPrevTheta = 0, dragPrevTime = 0, dragVel = 0;

let camTheta = Math.PI;
let camPhi = Math.PI / 6;
let camRadius = 7;
const camTarget = new THREE.Vector3(0, 1.0, 0);

const keysDown = {};
window.addEventListener('keydown', e => {
    keysDown[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keysDown[e.code] = false; });

export function updateCameraFromKeys(dt, camera, controls) {
    const rotSpeed = 1.4 * dt, panSpeed = 4.0 * dt, zoomSpeed = 6.0 * dt;
    if (keysDown['ArrowLeft']) camTheta -= rotSpeed;
    if (keysDown['ArrowRight']) camTheta += rotSpeed;
    if (keysDown['ArrowUp']) camPhi = Math.max(0.05, camPhi - rotSpeed);
    if (keysDown['ArrowDown']) camPhi = Math.min(1.50, camPhi + rotSpeed);
    if (keysDown['KeyQ']) camRadius = Math.max(2, camRadius - zoomSpeed);
    if (keysDown['KeyE']) camRadius = Math.min(20, camRadius + zoomSpeed);

    if (keysDown['KeyW'] || keysDown['KeyA'] || keysDown['KeyS'] || keysDown['KeyD']) {
        const forward = new THREE.Vector3(-Math.sin(camTheta), 0, -Math.cos(camTheta)).normalize();
        const right = new THREE.Vector3(Math.cos(camTheta), 0, -Math.sin(camTheta)).normalize();
        if (keysDown['KeyW']) camTarget.addScaledVector(forward, panSpeed);
        if (keysDown['KeyS']) camTarget.addScaledVector(forward, -panSpeed);
        if (keysDown['KeyA']) camTarget.addScaledVector(right, -panSpeed);
        if (keysDown['KeyD']) camTarget.addScaledVector(right, panSpeed);
    }
    camera.position.set(
        camTarget.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta),
        camTarget.y + camRadius * Math.cos(camPhi),
        camTarget.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta)
    );
    camera.lookAt(camTarget);
    controls.target.copy(camTarget);
}

function getIntersect(e, objs, camera, renderer) {
    const rect = renderer.domElement.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    mousePos.x = ((cx - rect.left) / rect.width) * 2 - 1;
    mousePos.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mousePos, camera);
    const hits = raycaster.intersectObjects(objs);
    return hits.length ? hits[0] : null;
}

export function setupInteraction(physicsEngine, ballMeshes, camera, renderer, controls) {
    const draggable = ballMeshes.map(b => b.mesh);

    function onDragStart(e) {
        const hit = getIntersect(e, draggable, camera, renderer);
        if (!hit) return;
        isDragging = true;
        dragIdx = hit.object.userData.ballIndex;
        dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
        dragStartTheta = physicsEngine.balls[dragIdx].theta;
        dragPrevTheta = dragStartTheta;
        dragPrevTime = performance.now();
        dragVel = 0;
        physicsEngine.balls[dragIdx].omega = 0;
        ballMeshes[dragIdx].mesh.material.color.setHex(0xffdd88);
        if (!e.touches) e.preventDefault();
    }

    function onDragMove(e) {
        if (!isDragging || dragIdx < 0) {
            if (!e.touches) renderer.domElement.style.cursor = getIntersect(e, draggable, camera, renderer) ? 'grab' : 'default';
            return;
        }
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = cx - dragStartX;
        let newTheta = dragStartTheta + dx * (Math.PI / 150);
        newTheta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newTheta));
        const now = performance.now();
        const dt = now - dragPrevTime;
        if (dt > 0) {
            const raw = (newTheta - dragPrevTheta) / (dt / 1000);
            dragVel = dragVel * 0.6 + raw * 0.4;
        }
        dragPrevTheta = newTheta;
        dragPrevTime = now;
        const ball = physicsEngine.balls[dragIdx];
        ball.theta = newTheta;
        ball.omega = 0;
        ball.updatePosition();
        if (!e.touches) renderer.domElement.style.cursor = 'grabbing';
    }

    function onDragEnd() {
        if (isDragging && dragIdx >= 0) {
            ballMeshes[dragIdx].mesh.material.color.setRGB(0xee/255, 0xee/255, 0xee/255);
            physicsEngine.balls[dragIdx].omega = dragVel;
        }
        isDragging = false;
        dragIdx = -1;
        dragVel = 0;
        renderer.domElement.style.cursor = 'default';
    }

    renderer.domElement.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    renderer.domElement.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);

    function resetCradle() {
        physicsEngine.balls.forEach((b, i) => {
            b.theta = i === 0 ? Math.PI / 4 : 0;
            b.omega = 0; b.alpha = 0;
            b.updatePosition();
        });
        if (window.guiInstance) window.guiInstance.resetToDefault();
    }

    renderer.domElement.addEventListener('dblclick', (e) => {
        if (getIntersect(e, draggable, camera, renderer)) resetCradle();
    });
    document.getElementById('reset-btn').addEventListener('click', resetCradle);
}