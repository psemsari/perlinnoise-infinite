import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 15, 15);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const dirLight = new THREE.DirectionalLight(0xffffff,0.8); 
dirLight.position.set(10,20,10); 
scene.add(dirLight);

// Quad A (large plane)
const polyA = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, 1),
    new THREE.Vector3(0, 0, 1)
];

// Quad B (small plane - qui touche A par la droite)
const polyB = [
    new THREE.Vector3(0.5, 0.1, 0.5),
    new THREE.Vector3(1.5, 0.1, 0.5),
    new THREE.Vector3(1.5, 0.1, 1.5),
    new THREE.Vector3(0.5, 0.1, 1.5)
];

// Small plane position (will be controlled by keyboard)
let smallPlanePosition = new THREE.Vector3(1, 0.1, 1); // Center of polyB

// Generate quad A vertices (as triangles)
function generateQuadAVertices(): THREE.Vector3[] {
    return [
        polyA[0], polyA[1], polyA[2], // Triangle 1
        polyA[0], polyA[2], polyA[3]  // Triangle 2
    ];
}

// Generate quad B vertices at given position
function generateQuadBVertices(position: THREE.Vector3): THREE.Vector3[] {
    const offsetX = position.x - 1; // Center of polyB is at (1, 0.1, 1)
    const offsetZ = position.z - 1;
    
    return [
        new THREE.Vector3(0.5 + offsetX, position.y, 0.5 + offsetZ),
        new THREE.Vector3(1.5 + offsetX, position.y, 0.5 + offsetZ),
        new THREE.Vector3(1.5 + offsetX, position.y, 1.5 + offsetZ),
        new THREE.Vector3(0.5 + offsetX, position.y, 1.5 + offsetZ)
    ];
}

// Get quad B bounds
function getQuadBBounds(position: THREE.Vector3): {minX: number, maxX: number, minZ: number, maxZ: number} {
    const offsetX = position.x - 1;
    const offsetZ = position.z - 1;
    return {
        minX: 0.5 + offsetX,
        maxX: 1.5 + offsetX,
        minZ: 0.5 + offsetZ,
        maxZ: 1.5 + offsetZ
    };
}

// Check if a point is inside a rectangle (small plane bounds)
function pointInRectangle2D(point: THREE.Vector3, minX: number, maxX: number, minZ: number, maxZ: number): boolean {
    return point.x >= minX && point.x <= maxX && point.z >= minZ && point.z <= maxZ;
}

// Check if a triangle is completely inside the rectangle
function triangleCompletelyInsideRectangle(
    a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3,
    minX: number, maxX: number, minZ: number, maxZ: number
): boolean {
    return pointInRectangle2D(a, minX, maxX, minZ, maxZ) &&
           pointInRectangle2D(b, minX, maxX, minZ, maxZ) &&
           pointInRectangle2D(c, minX, maxX, minZ, maxZ);
}

// Check if a triangle is completely outside the rectangle
function triangleCompletelyOutsideRectangle(
    a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3,
    minX: number, maxX: number, minZ: number, maxZ: number
): boolean {
    const allLeft = a.x < minX && b.x < minX && c.x < minX;
    const allRight = a.x > maxX && b.x > maxX && c.x > maxX;
    const allBottom = a.z < minZ && b.z < minZ && c.z < minZ;
    const allTop = a.z > maxZ && b.z > maxZ && c.z > maxZ;
    
    return allLeft || allRight || allBottom || allTop;
}

// Get intersection point between two line segments (2D in XZ plane)
function lineSegmentIntersection2D(
    p1: THREE.Vector3, p2: THREE.Vector3,
    p3: THREE.Vector3, p4: THREE.Vector3
): THREE.Vector3 | null {
    const x1 = p1.x, z1 = p1.z;
    const x2 = p2.x, z2 = p2.z;
    const x3 = p3.x, z3 = p3.z;
    const x4 = p4.x, z4 = p4.z;
    
    const denom = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // Parallel lines
    
    const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (z1 - z3) - (z1 - z2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return new THREE.Vector3(
            x1 + t * (x2 - x1),
            0,
            z1 + t * (z2 - z1)
        );
    }
    return null;
}

// Clip a triangle against a rectangle using Sutherland-Hodgman algorithm
// This clips OUTSIDE the rectangle (keeps parts outside the rectangle, removes parts inside)
function clipTriangleAgainstRectangle(
    triA: THREE.Vector3, triB: THREE.Vector3, triC: THREE.Vector3,
    minX: number, maxX: number, minZ: number, maxZ: number
): THREE.Vector3[] {
    // Start with triangle vertices
    let polygon: THREE.Vector3[] = [triA, triB, triC];
    
    // Clip against each edge of the rectangle (keep parts outside)
    // Left edge (minX) - keep points with x < minX (outside left)
    polygon = clipPolygonAgainstEdge(polygon, 
        new THREE.Vector3(minX, 0, minZ),
        new THREE.Vector3(minX, 0, maxZ),
        new THREE.Vector3(minX - 1, 0, minZ) // Normal pointing left (outside rectangle)
    );
    
    // Right edge (maxX) - keep points with x > maxX (outside right)
    polygon = clipPolygonAgainstEdge(polygon,
        new THREE.Vector3(maxX, 0, minZ),
        new THREE.Vector3(maxX, 0, maxZ),
        new THREE.Vector3(maxX + 1, 0, minZ) // Normal pointing right (outside rectangle)
    );
    
    // Bottom edge (minZ) - keep points with z < minZ (outside bottom)
    polygon = clipPolygonAgainstEdge(polygon,
        new THREE.Vector3(minX, 0, minZ),
        new THREE.Vector3(maxX, 0, minZ),
        new THREE.Vector3(minX, 0, minZ - 1) // Normal pointing down (outside rectangle)
    );
    
    // Top edge (maxZ) - keep points with z > maxZ (outside top)
    polygon = clipPolygonAgainstEdge(polygon,
        new THREE.Vector3(minX, 0, maxZ),
        new THREE.Vector3(maxX, 0, maxZ),
        new THREE.Vector3(minX, 0, maxZ + 1) // Normal pointing up (outside rectangle)
    );
    
    return polygon;
}

// Clip polygon against an edge (Sutherland-Hodgman)
// Keeps parts OUTSIDE the clipping rectangle
function clipPolygonAgainstEdge(
    polygon: THREE.Vector3[],
    edgeStart: THREE.Vector3,
    edgeEnd: THREE.Vector3,
    normalPoint: THREE.Vector3
): THREE.Vector3[] {
    if (polygon.length === 0) return [];
    
    const clipped: THREE.Vector3[] = [];
    const edgeDir = new THREE.Vector3().subVectors(edgeEnd, edgeStart);
    const normal = new THREE.Vector3().subVectors(normalPoint, edgeStart);
    normal.cross(edgeDir).normalize();
    
    for (let i = 0; i < polygon.length; i++) {
        const current = polygon[i];
        const next = polygon[(i + 1) % polygon.length];
        
        const currentKept = isPointKept(current, edgeStart, normal);
        const nextKept = isPointKept(next, edgeStart, normal);
        
        if (currentKept && nextKept) {
            // Both kept (outside) - add next
            clipped.push(next);
        } else if (currentKept && !nextKept) {
            // Current kept (outside), next removed (inside) - add current and intersection
            clipped.push(current);
            const intersection = lineSegmentIntersection2D(current, next, edgeStart, edgeEnd);
            if (intersection) clipped.push(intersection);
        } else if (!currentKept && nextKept) {
            // Current removed (inside), next kept (outside) - add intersection and next
            const intersection = lineSegmentIntersection2D(current, next, edgeStart, edgeEnd);
            if (intersection) clipped.push(intersection);
            clipped.push(next);
        }
        // If both removed (inside), skip
    }
    
    return clipped;
}

// Check if point should be kept (is outside the clipping rectangle)
// Returns true if point is outside and should be kept
function isPointKept(point: THREE.Vector3, edgeStart: THREE.Vector3, normal: THREE.Vector3): boolean {
    const toPoint = new THREE.Vector3().subVectors(point, edgeStart);
    // If dot product > 0, point is outside the clipping rectangle (keep it)
    return toPoint.dot(normal) > 0;
}

// Triangulate a polygon (simple fan triangulation)
function triangulatePolygon(polygon: THREE.Vector3[]): THREE.Vector3[][] {
    if (polygon.length < 3) return [];
    
    const triangles: THREE.Vector3[][] = [];
    for (let i = 1; i < polygon.length - 1; i++) {
        triangles.push([polygon[0], polygon[i], polygon[i + 1]]);
    }
    return triangles;
}

// Unified vertex system
const vertices: THREE.Vector3[] = [];
const vertexMap = new Map<string, number>();

function addVertex(v: THREE.Vector3): number {
    const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
    if(!vertexMap.has(key)){
        vertexMap.set(key, vertices.length);
        vertices.push(v.clone());
    }
    return vertexMap.get(key)!;
}

// Build mesh with remeshing
function rebuildMesh() {
    // Clear previous data
    vertices.length = 0;
    vertexMap.clear();
    
    // Generate vertices
    const quadAVertices = generateQuadAVertices(); // Returns 6 vertices (2 triangles)
    const quadBVertices = generateQuadBVertices(smallPlanePosition);
    const quadBBounds = getQuadBBounds(smallPlanePosition);
    
    // Build faces
    const faces: number[][] = [];
    
    // Quad A triangles - clip against Quad B
    const tri1A = quadAVertices[0]; // polyA[0]
    const tri1B = quadAVertices[1]; // polyA[1]
    const tri1C = quadAVertices[2]; // polyA[2]
    
    const tri2A = quadAVertices[3]; // polyA[0]
    const tri2B = quadAVertices[4]; // polyA[2]
    const tri2C = quadAVertices[5]; // polyA[3]
    
    // Process triangle 1 of Quad A
    if(triangleCompletelyInsideRectangle(tri1A, tri1B, tri1C, quadBBounds.minX, quadBBounds.maxX, quadBBounds.minZ, quadBBounds.maxZ)) {
        // Triangle is completely inside, skip it (creates hole)
    } else if(triangleCompletelyOutsideRectangle(tri1A, tri1B, tri1C, quadBBounds.minX, quadBBounds.maxX, quadBBounds.minZ, quadBBounds.maxZ)) {
        // Triangle is completely outside, keep it as is
        const idx1 = addVertex(tri1A);
        const idx2 = addVertex(tri1B);
        const idx3 = addVertex(tri1C);
        faces.push([idx1, idx2, idx3]);
    } else {
        // Triangle intersects rectangle - clip it
        const clippedTri1 = clipTriangleAgainstRectangle(
            tri1A, tri1B, tri1C,
            quadBBounds.minX, quadBBounds.maxX, quadBBounds.minZ, quadBBounds.maxZ
        );
        
        if(clippedTri1.length >= 3) {
            const triangles = triangulatePolygon(clippedTri1);
            for(const tri of triangles) {
                const idx1 = addVertex(tri[0]);
                const idx2 = addVertex(tri[1]);
                const idx3 = addVertex(tri[2]);
                faces.push([idx1, idx2, idx3]);
            }
        }
    }
    
    // Process triangle 2 of Quad A
    if(triangleCompletelyInsideRectangle(tri2A, tri2B, tri2C, quadBBounds.minX, quadBBounds.maxX, quadBBounds.minZ, quadBBounds.maxZ)) {
        // Triangle is completely inside, skip it (creates hole)
    } else if(triangleCompletelyOutsideRectangle(tri2A, tri2B, tri2C, quadBBounds.minX, quadBBounds.maxX, quadBBounds.minZ, quadBBounds.maxZ)) {
        // Triangle is completely outside, keep it as is
        const idx1 = addVertex(tri2A);
        const idx2 = addVertex(tri2B);
        const idx3 = addVertex(tri2C);
        faces.push([idx1, idx2, idx3]);
    } else {
        // Triangle intersects rectangle - clip it
        const clippedTri2 = clipTriangleAgainstRectangle(
            tri2A, tri2B, tri2C,
            quadBBounds.minX, quadBBounds.maxX, quadBBounds.minZ, quadBBounds.maxZ
        );
        
        if(clippedTri2.length >= 3) {
            const triangles = triangulatePolygon(clippedTri2);
            for(const tri of triangles) {
                const idx1 = addVertex(tri[0]);
                const idx2 = addVertex(tri[1]);
                const idx3 = addVertex(tri[2]);
                faces.push([idx1, idx2, idx3]);
            }
        }
    }
    
    // Quad B faces (small plane) - add as 2 triangles
    const quadBIndices: number[] = [];
    quadBVertices.forEach(v => {
        quadBIndices.push(addVertex(v));
    });
    
    // Triangle 1: 0, 1, 2
    faces.push([quadBIndices[0], quadBIndices[1], quadBIndices[2]]);
    // Triangle 2: 0, 2, 3
    faces.push([quadBIndices[0], quadBIndices[2], quadBIndices[3]]);
    
    // Build BufferGeometry
    const positions = new Float32Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        positions[i * 3 + 0] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
    }
    
    const triCount = faces.length;
    const indexArray = (vertices.length > 65535) ? new Uint32Array(triCount * 3) : new Uint16Array(triCount * 3);
    let w = 0;
    for (let i = 0; i < faces.length; i++) {
        const f = faces[i];
        if (f.length !== 3) continue;
        indexArray[w++] = f[0];
        indexArray[w++] = f[1];
        indexArray[w++] = f[2];
    }
    
    // Remove old attributes if they exist
    if (geometry.attributes.position) {
        geometry.deleteAttribute('position');
    }
    if (geometry.index) {
        geometry.setIndex(null);
    }
    
    // Set new attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (w > 0) {
        geometry.setIndex(new THREE.BufferAttribute(indexArray.slice(0, w), 1));
    }
    
    // Recompute normals and bounding volumes
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
}

// Create geometry and mesh
const geometry = new THREE.BufferGeometry();
const material = new THREE.MeshStandardMaterial({color:0x999999});
const mesh = new THREE.Mesh(geometry, material);
mesh.material.wireframe = true;
scene.add(mesh);

// Initial mesh build
rebuildMesh();

// Keyboard controls (ZQSD = WASD in French keyboard layout)
const keys: {[key: string]: boolean} = {};
const moveSpeed = 0.01;

window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

// Update small plane position based on keys
function updateSmallPlanePosition() {
    let moved = false;
    
    if(keys['z'] || keys['w']) { // Z or W (forward)
        smallPlanePosition.z -= moveSpeed;
        moved = true;
    }
    if(keys['s']) { // S (backward)
        smallPlanePosition.z += moveSpeed;
        moved = true;
    }
    if(keys['q'] || keys['a']) { // Q or A (left)
        smallPlanePosition.x -= moveSpeed;
        moved = true;
    }
    if(keys['d']) { // D (right)
        smallPlanePosition.x += moveSpeed;
        moved = true;
    }
    
    if(moved) {
        rebuildMesh();
    }
}

// Render loop
function animate(){ 
    requestAnimationFrame(animate);
    updateSmallPlanePosition();
    controls.update();
    renderer.render(scene,camera);
}
animate();
