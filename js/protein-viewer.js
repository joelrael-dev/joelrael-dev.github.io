import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, container;

function init() {
    // Get the container element
    container = document.getElementById('container');
    if (!container) {
        console.error("Container element not found!");
        return;
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc); // Light grey background

    // Camera
    const fov = 75; // Field of view
    const aspect = container.clientWidth / container.clientHeight; // Aspect ratio
    const near = 0.1; // Near clipping plane
    const far = 1000; // Far clipping plane
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 5; // Move camera back so we can see the object

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable anti-aliasing
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens
    container.appendChild(renderer.domElement); // Add the canvas to the container

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Add inertia to camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1; // Prevent zooming too close
    controls.maxDistance = 500; // Prevent zooming too far out

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // OBJ Loader
    const loader = new OBJLoader();

    // --- IMPORTANT: Path to your OBJ file ---
    // Relative path from protein.html (in pages/) to TESTING.obj (in root)
    const objPath = '../TESTING.obj';
    // ----------------------------------------

    loader.load(
        // Resource URL
        objPath,
        // Called when resource is loaded
        function ( object ) {
            // Optional: Center the object geometry
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center); // Center the object's pivot point

            // Optional: Scale the object if it's too big or small
            // const desiredSize = 2; // Example: make the longest dimension 2 units
            // const currentSize = box.getSize(new THREE.Vector3());
            // const maxDim = Math.max(currentSize.x, currentSize.y, currentSize.z);
            // const scale = desiredSize / maxDim;
            // object.scale.set(scale, scale, scale);

            scene.add( object );
            console.log('OBJ loaded successfully');
        },
        // Called while loading is progressing
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // Called when loading has errors
        function ( error ) {
            console.error( 'An error happened during OBJ loading:', error );
            // Display an error message to the user
            const errorMsg = document.createElement('p');
            errorMsg.textContent = `Error loading model: ${error}. Check console and file path (${objPath}).`;
            errorMsg.style.color = 'red';
            errorMsg.style.position = 'absolute';
            errorMsg.style.top = '10px';
            errorMsg.style.left = '10px';
            container.appendChild(errorMsg);
        }
    );

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    if (!container) return;
    // Update camera aspect ratio
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate); // Loop the animation

    controls.update(); // Required if controls.enableDamping is true

    renderer.render(scene, camera); // Render the scene
}

// Start the process
init();
if (renderer) { // Only start animation if init was successful
    animate();
}