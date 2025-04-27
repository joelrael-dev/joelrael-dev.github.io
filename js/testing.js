// Import necessary Three.js modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';

// --- Global variables ---
let scene, camera, renderer, controls;
let moleculeGroup; // Group to hold the molecule parts

// --- Configuration ---
const pdbId = '7XNH'; // The PDB ID to load
const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;
const atomSphereRadius = 0.4; // Adjust radius of atom spheres as needed

// --- Initialization Function ---
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Dark grey background

    // Camera setup
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 1000; // Initial camera distance

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI displays
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement); // Add canvas to the HTML body

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.6); // Softer ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Main light source
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Controls setup (for user interaction)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Adds inertia to camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Keep panning relative to the scene origin
    controls.minDistance = 50;   // How close the user can zoom in
    controls.maxDistance = 2000; // How far the user can zoom out

    // Molecule Group setup
    moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    // Load the PDB molecule data
    loadMolecule(pdbUrl);

    // Add resize listener
    window.addEventListener('resize', onWindowResize);

    // Start the animation loop
    animate();
}

// --- Load PDB Data Function ---
function loadMolecule(url) {
    const loader = new PDBLoader();
    const infoDiv = document.getElementById('info'); // Assuming an info div exists in HTML
    if (infoDiv) infoDiv.textContent = `Loading PDB: ${pdbId}...`;

    // Reusable objects for InstancedMesh setup
    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    const tempPosition = new THREE.Vector3(); // To read position attribute

    loader.load(url, (pdb) => {
        // PDB loaded successfully
        const geometryAtoms = pdb.geometryAtoms;
        const geometryBonds = pdb.geometryBonds;
        const atomPositions = geometryAtoms.getAttribute('position');
        const atomColors = geometryAtoms.getAttribute('color'); // PDBLoader provides colors per atom
        const atomCount = atomPositions.count;

        if (infoDiv) infoDiv.textContent = `PDB: ${pdbId} Loaded. Atoms: ${atomCount}`;
        console.log("PDB Loaded:", pdb);


        // --- Atoms (as Spheres using InstancedMesh) ---
        // 1. Base Geometry (a single sphere)
        const sphereGeometry = new THREE.IcosahedronGeometry(atomSphereRadius, 3); // Icosahedron is a good sphere approximation

        // 2. Material (that uses instance colors)
        const atomMaterial = new THREE.MeshPhongMaterial({
            shininess: 30,
            vertexColors: false, // We are using INSTANCE colors, not vertex colors on the sphere itself
            // side: THREE.DoubleSide // Can uncomment if spheres look odd from inside
        });

        // 3. InstancedMesh
        const atomMesh = new THREE.InstancedMesh(sphereGeometry, atomMaterial, atomCount);
        atomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // May help performance if matrices change often (not strictly needed here)
        atomMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(atomCount * 3), 3); // Enable instance colors

        // 4. Set position and color for each instance
        for (let i = 0; i < atomCount; i++) {
            // Get position for this atom
            tempPosition.fromBufferAttribute(atomPositions, i);
            // Set the transformation matrix for this instance (only position is needed)
            tempMatrix.setPosition(tempPosition);
            atomMesh.setMatrixAt(i, tempMatrix);

            // Get color for this atom
            tempColor.fromBufferAttribute(atomColors, i);
            // Set the color for this instance
            atomMesh.setColorAt(i, tempColor);
        }
        atomMesh.instanceMatrix.needsUpdate = true; // Tell Three.js matrices have been set
        if (atomMesh.instanceColor) {
             atomMesh.instanceColor.needsUpdate = true; // Tell Three.js colors have been set
        }


        moleculeGroup.add(atomMesh); // Add the InstancedMesh to the group

        // --- Bonds (as Lines) ---
        // Simple material for Bonds
        const bondMaterial = new THREE.LineBasicMaterial({
             color: 0x888888, // Grey color for bonds
             vertexColors: true, // Use colors from PDB geometryBonds if available
             linewidth: 1 // Note: linewidth > 1 might not work on all platforms
        });
        const bondLines = new THREE.LineSegments(geometryBonds, bondMaterial);
        moleculeGroup.add(bondLines);


        // --- Center the molecule and adjust camera ---
        // Calculate bounding box using the original atom positions geometry
        geometryAtoms.computeBoundingBox();
        const bbox = geometryAtoms.boundingBox;
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        moleculeGroup.position.sub(center); // Move group so its center is at the world origin

        // Adjust camera distance based on molecule size
        const sphere = new THREE.Sphere();
        bbox.getBoundingSphere(sphere);
        // Position camera based on the bounding sphere radius
        camera.position.z = Math.max(sphere.radius * 2.5, 150); // Ensure camera isn't too close for small molecules
        controls.target.copy(moleculeGroup.position); // Point controls at the molecule center
        controls.update(); // Apply changes to controls

    }, (xhr) => {
        // Progress callback (optional)
        if (infoDiv && xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            infoDiv.textContent = `Loading PDB: ${pdbId}... ${Math.round(percentComplete, 2)}%`;
        }
    }, (err) => {
        // Error callback
        console.error('Error loading PDB file:', err);
        if (infoDiv) infoDiv.textContent = `Error loading PDB: ${pdbId}`;
    });
}

// --- Animation Loop ---
function animate() {
    // Request the next frame
    requestAnimationFrame(animate);

    // Update controls (handles damping)
    controls.update();

    // Render the scene from the camera's perspective
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
function onWindowResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size and pixel ratio
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
}

// --- Start the application ---
init();

