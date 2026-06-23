// rendering/Environment.js

export function initEnvironment() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0f0a);
    scene.fog = new THREE.Fog(0x110a05, 15, 40);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, -6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.8;
    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.0, 0);
    controls.enableRotate = false; 
    controls.enablePan = false;
    controls.enableZoom = true;

    // الإضاءة
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 2.5);
    scene.add(ambientLight);

    const mainCeilingLight = new THREE.DirectionalLight(0xffffff, 4.0);
    mainCeilingLight.position.set(0, 10, 0);
    mainCeilingLight.castShadow = true;
    mainCeilingLight.shadow.mapSize.width = 2048;
    mainCeilingLight.shadow.mapSize.height = 2048;
    scene.add(mainCeilingLight);

    const tableSpotLight = new THREE.SpotLight(0xffaa44, 6.0);
    tableSpotLight.position.set(0, 8, 0);
    tableSpotLight.angle = Math.PI / 3;
    tableSpotLight.penumbra = 0.7;
    tableSpotLight.castShadow = true;
    scene.add(tableSpotLight);

    const sideLight = new THREE.DirectionalLight(0xe6ccb2, 0.4);
    sideLight.position.set(5, 3, 5);
    scene.add(sideLight);

    // الغرفة والأسطح
    const textureLoader = new THREE.TextureLoader();
    const woodColorTexture = textureLoader.load('./textures/wood_color.jpg');
    const woodRoughnessTexture = textureLoader.load('./textures/wood_rough.jpg');

    const woodMaterial = new THREE.MeshStandardMaterial({
        map: woodColorTexture,
        roughnessMap: woodRoughnessTexture,
        roughness: 0.5,
        metalness: 0.05
    });

    const size = 20; const height = 12;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), woodMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = floor.clone();
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height - 1.2;
    scene.add(ceiling);

    const wallGeo = new THREE.PlaneGeometry(size, height);
    const halfHeight = height / 2 - 1.2;

    const backWall = new THREE.Mesh(wallGeo, woodMaterial);
    backWall.position.set(0, halfHeight, -size / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const frontWall = backWall.clone();
    frontWall.rotation.y = Math.PI; frontWall.position.z = size / 2;
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(wallGeo, woodMaterial);
    leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-size / 2, halfHeight, 0); leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.rotation.y = -Math.PI / 2; rightWall.position.x = size / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // دالة التحميل الآمن
    const gltfLoader = new THREE.GLTFLoader();
    function loadModelSafe(path, pos, scale, rot = { x: 0, y: 0, z: 0 }) {
        gltfLoader.load(path, (gltf) => {
            const m = gltf.scene;
            m.scale.set(scale.x, scale.y, scale.z);
            m.position.set(pos.x, pos.y, pos.z);
            m.rotation.set(rot.x, rot.y, rot.z);
            m.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
            scene.add(m);
        }, undefined, (err) => console.error(`⚠️ خطأ في تحميل الموديل: ${path}`, err));
    }

    // تحميل الأثاث
    loadModelSafe('./models/carpet/persian_malayer_carpet/scene.gltf', { x: 0, y: -1.19, z: -4.5 }, { x: 4.5, y: 4.5, z: 4.5 });
    loadModelSafe('./models/gothic_coffee_table_4k.gltf/gothic_coffee_table_4k.gltf', { x: 0, y: -1.2, z: 0 }, { x: 4, y: 5, z: 2.8 });
    loadModelSafe('./models/wood_chair/scene.gltf', { x: 0.5, y: 1, z: 2 }, { x: 2, y: 2, z: 2 }, { x: 0, y: Math.PI, z: 0 });
    loadModelSafe('./models/library/bookcase_-_tall_with_books/scene.gltf', { x: -9, y: -1.2, z: 3 }, { x: 2.5, y: 1.5, z: 3 }, { x: 0, y: Math.PI / 2, z: 0 });
    loadModelSafe('./models/pictuer/fancy_picture_frame_01_4k.gltf/fancy_picture_frame_01_4k.gltf', { x: 9.72, y: 3, z: 1 }, { x: 7, y: 7, z: 1.5 }, { x: 0, y: -Math.PI / 2, z: 0 });
    loadModelSafe('./models/plant/potted_plant_02_4k.gltf/potted_plant_02_4k.gltf', { x: 9, y: -1.2, z: 9.2 }, { x: 2.0, y: 3.0, z: 2.0 });
    loadModelSafe('./models/plant/monstera_deliciosa_potted_mid-century_plant/scene.gltf', { x: -8.5, y: 0.5, z: -3 }, { x: 2.0, y: 3.0, z: 2.0 });

    return { scene, camera, renderer, controls };
}