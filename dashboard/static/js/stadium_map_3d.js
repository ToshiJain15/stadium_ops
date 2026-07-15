// Interactive 3D Stadium Visualization Engine using vanilla Three.js

(function() {
  let scene, camera, renderer, controls;
  let lowerTierGroup, upperTierGroup, liveNodesGroup, lidarRing;
  
  // Track all sector mesh objects for interaction and updates
  const sectorMeshes = [];
  
  // Smooth Camera transition targets
  const targetCamPos = new THREE.Vector3(0, 10, 14);
  const targetLookAt = new THREE.Vector3(0, 0, 0);
  const currentLookAt = new THREE.Vector3(0, 0, 0);

  // Initialize 3D Visualizer
  function init() {
    const container = document.getElementById('stadium-canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#141414');

    // Create Camera
    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 10, 14);

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 3;
    controls.maxDistance = 22;

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 15, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xD4FF00, 1.5, 20);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 12, 0);
    spotLight.angle = 0.6;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);

    // Build pitch field
    const pitchGeo = new THREE.PlaneGeometry(6.5, 10.5);
    const pitchMat = new THREE.MeshStandardMaterial({ color: 0x143c24, roughness: 0.8 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = -0.1;
    scene.add(pitch);

    // Render pitch markings
    const borderGeo = new THREE.BoxGeometry(6.2, 0.01, 10.2);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = -0.09;
    scene.add(border);

    const centerLineGeo = new THREE.BoxGeometry(6.2, 0.01, 0.05);
    const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
    centerLine.position.y = -0.085;
    scene.add(centerLine);

    const centerCircleGeo = new THREE.RingGeometry(1.2, 1.25, 32);
    const centerCircleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const centerCircle = new THREE.Mesh(centerCircleGeo, centerCircleMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = -0.08;
    scene.add(centerCircle);

    // Penalty Areas
    const p1Geo = new THREE.BoxGeometry(3.2, 0.01, 2.0);
    const p1 = new THREE.Mesh(p1Geo, borderMat);
    p1.position.set(0, -0.08, -4.1);
    scene.add(p1);

    const p2 = new THREE.Mesh(p1Geo, borderMat);
    p2.position.set(0, -0.08, 4.1);
    scene.add(p2);

    // Goalposts
    buildGoalpost(0, 0.25, -5.1);
    buildGoalpost(0, 0.25, 5.1);

    // Stadium outer wireframe shell
    const shellGeo = new THREE.CylinderGeometry(9.5, 9.8, 4, 32, 4, true);
    const shellMat = new THREE.MeshBasicMaterial({ color: 0x1a3a3a, wireframe: true, transparent: true, opacity: 0.15 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.position.y = 1.5;
    scene.add(shell);

    // Dynamic LiDAR Scanner Laser Hologram
    const lidarRingGeo = new THREE.TorusGeometry(8.2, 0.04, 8, 64);
    const lidarRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF, // Cyan holographic scanner glow
      transparent: true,
      opacity: 0.6
    });
    lidarRing = new THREE.Mesh(lidarRingGeo, lidarRingMat);
    lidarRing.rotation.x = Math.PI / 2;
    lidarRing.position.y = 0.5;
    scene.add(lidarRing);

    // Create Groups for Tiers
    lowerTierGroup = new THREE.Group();
    upperTierGroup = new THREE.Group();
    scene.add(lowerTierGroup);
    scene.add(upperTierGroup);

    // Build Lower bowl stands (12 sectors arranged programmatically)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      let color = '#1a1a1a';
      if (i === 3) {
        color = '#FF5252'; // high traffic Sector 103
      } else if (i === 0 || i === 6) {
        color = '#00E676'; // Gates entry
      } else if (i % 3 === 1) {
        color = '#333333';
      }

      const sectName = `sec_10${i}`;
      const px = Math.cos(angle) * 5.2;
      const pz = Math.sin(angle) * 6.2;
      const size = [2.0, 0.6, 1.2];

      const standGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
      const standMat = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        emissive: color,
        emissiveIntensity: 0.05
      });
      
      const stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(px, 0.3, pz);
      stand.rotation.y = -angle - Math.PI / 2;
      
      // Save metadata properties for Raycasting & updating states
      stand.userData = {
        name: sectName,
        baseY: 0.3,
        baseColor: color,
        tier: 'lower'
      };

      lowerTierGroup.add(stand);
      sectorMeshes.push(stand);
    }

    // Build Upper bowl stands (16 sectors arranged programmatically)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      let color = '#222222';
      if (i === 4 || i === 12) {
        color = '#D4FF00'; // warning occupancy
      } else if (i % 4 === 0) {
        color = '#1a1a1a';
      }

      const sectName = `sec_20${i}`;
      const px = Math.cos(angle) * 7.8;
      const pz = Math.sin(angle) * 8.8;
      const size = [2.3, 0.8, 1.5];

      const standGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
      const standMat = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        emissive: color,
        emissiveIntensity: 0.05
      });
      
      const stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(px, 1.3, pz);
      stand.rotation.y = -angle - Math.PI / 2;
      
      stand.userData = {
        name: sectName,
        baseY: 1.3,
        baseColor: color,
        tier: 'upper'
      };

      upperTierGroup.add(stand);
      sectorMeshes.push(stand);
    }

    // Live Indicators Nodes Group
    liveNodesGroup = new THREE.Group();
    scene.add(liveNodesGroup);

    const nodePositions = [
      [4, 0.8, 4],
      [-4, 0.8, -4],
      [5, 0.8, -3],
      [-5, 0.8, 3]
    ];

    nodePositions.forEach(pos => {
      const nodeGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00E676 });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(pos[0], pos[1], pos[2]);
      liveNodesGroup.add(node);
    });

    // Add raycasting / pointer click events
    renderer.domElement.addEventListener('click', onCanvasClick);
    
    // Resize Listener
    window.addEventListener('resize', onWindowResize);
    
    // Start Render loop animation
    animate();
  }

  function buildGoalpost(x, y, z) {
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const goal = new THREE.Group();
    goal.position.set(x, y, z);

    const p1 = new THREE.Mesh(postGeo, mat);
    p1.position.x = -0.8;
    goal.add(p1);

    const p2 = new THREE.Mesh(postGeo, mat);
    p2.position.x = 0.8;
    goal.add(p2);

    const bar = new THREE.Mesh(barGeo, mat);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = 0.25;
    goal.add(bar);

    scene.add(goal);
  }

  // Raycaster click helper
  function onCanvasClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Only raycast visible items
    const activeGroup = window.stadiumState.activeTier === 'lower' ? lowerTierGroup : upperTierGroup;
    const intersects = raycaster.intersectObjects(activeGroup.children);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const zoneName = hitObj.userData.name;

      if (window.stadiumState.activeZone === zoneName) {
        window.stadiumState.activeZone = null;
        dispatchInfoAlert('Cleared camera focus.');
      } else {
        window.stadiumState.activeZone = zoneName;
        dispatchInfoAlert(`Camera auto-focusing on: ${zoneName.toUpperCase()}`);
      }
      
      // Update HTML UI reset label overlay
      updateZoneDetailsBadge();
    }
  }

  function updateZoneDetailsBadge() {
    let badge = document.getElementById('details-focused-badge');
    
    // If badge doesn't exist, create it inside stadium container
    const container = document.getElementById('stadium-canvas-container').parentNode;
    if (!badge && container) {
      badge = document.createElement('div');
      badge.id = 'details-focused-badge';
      badge.className = 'absolute bottom-[15px] left-[15px] z-10';
      container.appendChild(badge);
    }

    if (badge) {
      if (window.stadiumState.activeZone) {
        badge.innerHTML = `
          <div class="glass-panel" style="padding: 8px 15px; font-size: 0.8rem; display: flex; items-center: center; gap: 10px; background: rgba(0,0,0,0.85); border: 1px solid var(--primary)">
            <span style="color: var(--primary); font-weight: 600">Active Focus: ${window.stadiumState.activeZone.toUpperCase()}</span>
            <button onclick="clearActiveZoneFocus()" style="background: transparent; border: none; color: #FF5252; cursor: pointer; font-weight: bold; font-size: 1rem; padding: 0">✕</button>
          </div>
        `;
      } else {
        badge.innerHTML = '';
      }
    }
  }

  // Clear zone focus helper made globally callable
  window.clearActiveZoneFocus = function() {
    window.stadiumState.activeZone = null;
    updateZoneDetailsBadge();
  };

  // Switch tier helper
  window.select3DTier = function(tierName) {
    window.stadiumState.activeTier = tierName;
    window.stadiumState.activeZone = null; // Clear focused zone

    // Highlight active layout buttons on HTML page
    const upperBtn = document.getElementById('map-upper-btn');
    const lowerBtn = document.getElementById('map-lower-btn');

    if (upperBtn && lowerBtn) {
      if (tierName === 'upper') {
        upperBtn.className = "btn-primary px-4 py-1.5 rounded-full text-xs";
        lowerBtn.className = "btn-outline px-4 py-1.5 rounded-full text-xs";
      } else {
        lowerBtn.className = "btn-primary px-4 py-1.5 rounded-full text-xs";
        upperBtn.className = "btn-outline px-4 py-1.5 rounded-full text-xs";
      }
    }

    updateZoneDetailsBadge();
    dispatchInfoAlert(`Stadium model changed: ${tierName.toUpperCase()} bowl views loaded.`);
  };

  function onWindowResize() {
    const container = document.getElementById('stadium-canvas-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Primary rendering ticks loop
  function animate() {
    requestAnimationFrame(animate);

    const state = window.stadiumState;
    const elapsedTime = clockGetElapsedTime();

    // 1. Manage visibility of Tiers depending on active bowl state
    lowerTierGroup.visible = state.activeTier === 'lower';
    upperTierGroup.visible = state.activeTier === 'upper';

    // 2. Rotate live Sentinel guards nodes indicators slowly
    if (liveNodesGroup) {
      liveNodesGroup.rotation.y = elapsedTime * 0.1;
    }

    // 3. Highlight and animate active stand mesh position
    sectorMeshes.forEach(mesh => {
      const isFocused = state.activeZone === mesh.userData.name;
      const isSameTier = state.activeTier === mesh.userData.tier;

      if (isSameTier && isFocused) {
        // Pulse float position height
        mesh.position.y = mesh.userData.baseY + Math.sin(elapsedTime * 3) * 0.15;
        mesh.material.color.set('#D4FF00');
        mesh.material.emissive.set('#D4FF00');
        mesh.material.emissiveIntensity = 0.45 + Math.sin(elapsedTime * 8) * 0.15; // fast pulse glow
        mesh.material.opacity = 0.95;
      } else {
        // Smoothly return to default position & color
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, mesh.userData.baseY, 0.1);
        
        // Shifting heat wave noise on warnings and entry gates
        if (mesh.userData.baseColor === '#D4FF00' || mesh.userData.baseColor === '#FF5252' || mesh.userData.baseColor === '#00E676') {
          mesh.material.color.set(mesh.userData.baseColor);
          mesh.material.emissive.set(mesh.userData.baseColor);
          mesh.material.emissiveIntensity = 0.1 + Math.sin(elapsedTime * 3.5 + mesh.position.x) * 0.06;
          mesh.material.opacity = 0.75;
        } else {
          mesh.material.color.set(mesh.userData.baseColor);
          mesh.material.emissive.set(mesh.userData.baseColor);
          mesh.material.emissiveIntensity = 0.04;
          mesh.material.opacity = 0.55;
        }
      }
    });

    // 3.1 Animate LiDAR Scanner sweep
    if (lidarRing) {
      lidarRing.position.y = 1.5 + Math.sin(elapsedTime * 2.0) * 1.4;
      lidarRing.material.opacity = 0.45 + Math.sin(elapsedTime * 4) * 0.15; // pulsating laser thickness
    }

    // Interpolate camera values smoothly
    if (window.stadiumState.autoTourActive) {
      const tourTimer = elapsedTime * 0.4;
      const index = Math.floor(tourTimer) % 6;
      const progress = tourTimer % 1;
      
      const tourPoints = [
        { cam: new THREE.Vector3(0, 11, 15), look: new THREE.Vector3(0, 0, 0) }, // Default lower view
        { cam: new THREE.Vector3(5.2 * 1.3, 3.5, 6.2 * 1.3), look: new THREE.Vector3(5.2, 0.3, 6.2) }, // VIP Sector 103 focus
        { cam: new THREE.Vector3(0, 14, 18), look: new THREE.Vector3(0, 1.5, 0) }, // Default upper view
        { cam: new THREE.Vector3(-7.8 * 1.2, 4.5, -8.8 * 1.2), look: new THREE.Vector3(-7.8, 1.3, -8.8) }, // Gate entry focus
        { cam: new THREE.Vector3(0, 6, 9), look: new THREE.Vector3(0, 0, 0) }, // Pitch close-up
        { cam: new THREE.Vector3(8.5, 2.5, 0), look: new THREE.Vector3(0, 0.5, 0) } // Side bench angle
      ];
      
      const currentPoint = tourPoints[index];
      const nextPoint = tourPoints[(index + 1) % tourPoints.length];
      
      // Interpolate position and lookat
      targetCamPos.copy(currentPoint.cam).lerp(nextPoint.cam, progress);
      targetLookAt.copy(currentPoint.look).lerp(nextPoint.look, progress);
    } else if (state.activeZone) {
      const sect = sectorMeshes.find(s => s.userData.name === state.activeZone);
      if (sect) {
        const sx = sect.position.x;
        const sy = sect.position.y;
        const sz = sect.position.z;
        
        targetCamPos.set(sx * 1.5, sy + 3.2, sz * 1.5);
        targetLookAt.set(sx, sy, sz);
      }
    } else {
      // Default views
      if (state.activeTier === 'upper') {
        targetCamPos.set(0, 12, 16);
        targetLookAt.set(0, 1.5, 0);
      } else {
        targetCamPos.set(0, 10, 14);
        targetLookAt.set(0, 0.5, 0);
      }
    }

    camera.position.lerp(targetCamPos, 0.08);
    currentLookAt.lerp(targetLookAt, 0.08);
    controls.target.copy(currentLookAt);

    controls.update();
    renderer.render(scene, camera);
  }

  // Helper timer fallback (avoids library deprecation notices)
  const startTime = Date.now();
  function clockGetElapsedTime() {
    return (Date.now() - startTime) / 1000;
  }

  // Fix 14: Proper disposal of Three.js objects to avoid memory leaks
  window.disposeStadiumScene = function() {
    if (!scene) return;
    
    // Dispose geometry and materials
    sectorMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      scene.remove(mesh);
    });
    
    if (renderer) {
      renderer.dispose();
    }
  };

  // Load initializer
  window.addEventListener('DOMContentLoaded', () => {
    // Small timeout to guarantee DOM metrics are styled
    setTimeout(init, 100);
  });
})();
