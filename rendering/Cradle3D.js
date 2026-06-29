// rendering/Cradle3D.js

const PHYSICS_TO_3D = 0.45;
const BALL_RADIUS_3D = 0.055;
const SPACING = BALL_RADIUS_3D * 2.2;
const PIVOT_Y = 0.75;
const STRING_LEN = PHYSICS_TO_3D;
const MAX_TENSION = 25;

export function createCradle3D(scene) {
    const cradleGroup = new THREE.Group();
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 1.0, roughness: 0.05 });
    const lightBaseMat = new THREE.MeshStandardMaterial({ color: 0x2c1a04, roughness: 0.3, metalness: 0.1 });

    const baseBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), lightBaseMat);
    baseBox.position.y = 0.03;
    baseBox.castShadow = true;
    cradleGroup.add(baseBox);

    const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.75, 16);
    const poles = [{ x: -0.6, z: -0.4 }, { x: -0.6, z: 0.4 }, { x: 0.6, z: -0.4 }, { x: 0.6, z: 0.4 }];
    poles.forEach(p => {
        const pole = new THREE.Mesh(poleGeo, chromeMat);
        pole.position.set(p.x, 0.375, p.z);
        pole.castShadow = true;
        cradleGroup.add(pole);
    });

    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 16);
    const barL = new THREE.Mesh(barGeo, chromeMat);
    barL.rotation.z = Math.PI / 2;
    barL.position.set(0, 0.75, -0.4);
    cradleGroup.add(barL);
    const barR = barL.clone();
    barR.position.z = 0.4;
    cradleGroup.add(barR);

    const ballMeshes = [];
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS_3D, 32, 32);
    const defaultString = new THREE.LineBasicMaterial({ color: 0x666666 });

    for (let i = 0; i < 5; i++) {
        const group = new THREE.Group();
        const xPos = (i - 2) * SPACING;
        group.position.set(xPos, PIVOT_Y, 0);

        const fPts = [new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(0, -STRING_LEN, 0)];
        const bPts = [new THREE.Vector3(0, 0, -0.4), new THREE.Vector3(0, -STRING_LEN, 0)];
        const fStr = new THREE.Line(new THREE.BufferGeometry().setFromPoints(fPts), defaultString.clone());
        const bStr = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bPts), defaultString.clone());
        group.add(fStr, bStr);

        const mesh = new THREE.Mesh(ballGeo, chromeMat.clone());
        mesh.position.set(0, -STRING_LEN, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.ballIndex = i;
        group.add(mesh);

        cradleGroup.add(group);
        ballMeshes.push({ group, mesh, frontStr: fStr, backStr: bStr });
    }
    
    cradleGroup.position.set(0, 1.5, -0.2);
    scene.add(cradleGroup);

   function updateCradleFromPhysics(physicsEngine) {
        for (let i = 0; i < 5; i++) {
            const ball = physicsEngine.balls[i];
            if (!ball) continue;
            const { group, mesh, frontStr, backStr } = ballMeshes[i];

            group.rotation.z = 0;
            const bx = Math.sin(ball.theta) * STRING_LEN;
            const by = -Math.cos(ball.theta) * STRING_LEN;

            mesh.position.set(bx, by, 0);

            // 🌟 التعديل الجديد: تغيير حجم (مقياس) الكرة بناءً على كتلتها ديناميكياً
            // نستخدم الجذر التكعيبي (Cube Root) لمحاكاة تغير الحجم الفيزيائي الواقعي الثابت الكثافة
const scaleFactor = Math.sqrt(ball.mass);
            mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

            const fp = frontStr.geometry.attributes.position.array;
            fp[3] = bx; fp[4] = by;
            frontStr.geometry.attributes.position.needsUpdate = true;

            const bp = backStr.geometry.attributes.position.array;
            bp[3] = bx; bp[4] = by;
            backStr.geometry.attributes.position.needsUpdate = true;

            const tension = ball.computeTensionPerWire(physicsEngine.wireAlpha);
            // يمكنك هنا أيضاً تعديل ألوان الخيوط بناءً على الوزن إن أردت لاحقاً
        }
    }

    return { ballMeshes, updateCradleFromPhysics };
}