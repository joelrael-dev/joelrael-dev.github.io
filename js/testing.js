import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';

let scene, camera, renderer, controls;
let moleculeGroup; // Group to hold the molecule parts
let atomMeshes = []; // Store meshes that need color updates
const clock = new THREE.Clock();

// --- Configuration ---
const pdbId = '7XNH';
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
    camera.position.z = 500; // Start further away

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
    controls.maxDistance = 1000;

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
            shininess: 100
        });
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
