import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';

let scene, camera, renderer, controls;
let moleculeGroup; // Group to hold the molecule parts
let atomMeshes = []; // Store meshes that need color updates
const clock = new THREE.Clock();

// --- Configuration ---
const pdbId = '4HL8';
const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;
const rotationSpeed = 0.1; // Radians per second
const colorWaveSpeed = 0.5;
const colorWaveFrequency = 0.1; // Lower value = wider waves

// --- Initialization ---
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Dark background

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 1000; // Start further away

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8); // Soft ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Brighter directional light
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 2000;

    // Molecule Group
    moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    // Load PDB
    loadMolecule(pdbUrl);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

// --- Load PDB Data ---
function loadMolecule(url) {
    const loader = new PDBLoader();
    const infoDiv = document.getElementById('info');

    loader.load(url, (pdb) => {
        infoDiv.textContent = `PDB: ${pdbId} Loaded. Atoms: ${pdb.geometryAtoms.getAttribute('position').count}`;
        console.log("PDB Loaded:", pdb);

        const geometryAtoms = pdb.geometryAtoms;
        const geometryBonds = pdb.geometryBonds;
        const json = pdb.json;

        // --- Atoms ---
        // Use InstancedMesh for performance if available (PDBLoader might already do this)
        // For simplicity here, we'll assume it might create regular Meshes or InstancedMeshes
        // We need to ensure materials support vertex/instance colors for the effect.

        // Calculate bounding box for color mapping
        geometryAtoms.computeBoundingBox();
        const bbox = geometryAtoms.boundingBox;
        const yMin = bbox.min.y;
        const yMax = bbox.max.y;
        const yRange = yMax - yMin;

        // Material for Atoms (allowing color changes)
        const atomMaterial = new THREE.MeshPhongMaterial({
            vertexColors: true, // Enable vertex/instance colors
            shininess: 50
        });

        const atomMesh = new THREE.Mesh(geometryAtoms, atomMaterial);
        moleculeGroup.add(atomMesh);
        atomMeshes.push({ mesh: atomMesh, geometry: geometryAtoms, yMin: yMin, yRange: yRange }); // Store for color update

        // --- Bonds ---
        // Material for Bonds (can be simple or also colored if desired)
        const bondMaterial = new THREE.LineBasicMaterial({
             vertexColors: true, // Allow bond colors if PDB provides them
             linewidth: 1 // Note: linewidth > 1 might not work on all platforms
        });
        const bondLines = new THREE.LineSegments(geometryBonds, bondMaterial);
        moleculeGroup.add(bondLines);


        // Center the molecule and adjust camera
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        moleculeGroup.position.sub(center); // Move group so its center is at origin

        // Adjust camera distance based on molecule size
        const sphere = new THREE.Sphere();
        bbox.getBoundingSphere(sphere);
        camera.position.z = sphere.radius * 2.5; // Adjust multiplier as needed
        controls.target.copy(moleculeGroup.position); // Point controls at the molecule center
        controls.update();

    }, (xhr) => {
        // Progress callback
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            infoDiv.textContent = `Loading PDB: ${pdbId}... ${Math.round(percentComplete, 2)}%`;
        }
    }, (err) => {
        // Error callback
        console.error('Error loading PDB file:', err);
        infoDiv.textContent = `Error loading PDB: ${pdbId}`;
    });
}

// --- Update Atom Colors ---
function updateColors(time) {
    const color = new THREE.Color(); // Reusable color object

    atomMeshes.forEach(item => {
        const mesh = item.mesh;
        const geometry = item.geometry;
        const yMin = item.yMin;
        const yRange = item.yRange;
        const positions = geometry.attributes.position;
        const colorsAttribute = geometry.attributes.color; // Get color attribute

        if (!colorsAttribute) {
             console.warn("Geometry missing color attribute for dynamic coloring.");
             return; // Cannot proceed without color attribute
        }

        const count = positions.count;

        for (let i = 0; i < count; i++) {
            const y = positions.getY(i);

            // Normalize Y position (0 to 1) relative to the molecule's height
            const normalizedY = (yRange > 0) ? (y - yMin) / yRange : 0.5;

            // Calculate hue based on normalized position and time (wave effect)
            // The modulo (%) ensures the hue cycles from 0 to 1
            const hue = (normalizedY * colorWaveFrequency + time * colorWaveSpeed) % 1.0;

            // Set color using HSL (Hue, Saturation, Lightness)
            color.setHSL(hue, 1.0, 0.5); // Full saturation, medium lightness

            // Apply color to the attribute
            colorsAttribute.setXYZ(i, color.r, color.g, color.b);
        }

        // IMPORTANT: Tell Three.js the color attribute needs to be updated on the GPU
        colorsAttribute.needsUpdate = true;
    });
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Update controls
    controls.update();

    // Slowly rotate the molecule group
    if (moleculeGroup) {
        moleculeGroup.rotation.y += rotationSpeed * deltaTime;
    }

    // Update colors for the wave effect
    updateColors(elapsedTime);

    // Render the scene
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Start ---
init();