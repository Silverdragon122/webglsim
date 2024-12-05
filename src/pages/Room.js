import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Room = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // Adjusted camera position

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Room dimensions
    const roomWidth = 10;
    const roomHeight = 5;
    const roomDepth = 10;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMaterial);
    backWall.position.z = -roomDepth / 2;
    backWall.position.y = roomHeight / 2;
    scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMaterial);
    frontWall.position.z = roomDepth / 2;
    frontWall.position.y = roomHeight / 2;
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -roomWidth / 2;
    leftWall.position.y = roomHeight / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = roomWidth / 2;
    rightWall.position.y = roomHeight / 2;
    scene.add(rightWall);

    // Table
    const tableGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = 1;
    scene.add(table);

    // Table Legs
    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legPositions = [
      [-0.95, 0.5, -0.45],
      [0.95, 0.5, -0.45],
      [-0.95, 0.5, 0.45],
      [0.95, 0.5, 0.45],
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, tableMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      scene.add(leg);
    });

    // Function to create a detailed chair
    const createChair = (material) => {
      const chair = new THREE.Group();

      // Seat
      const seatGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5);
      const seat = new THREE.Mesh(seatGeometry, material);
      seat.position.y = 0.25;
      chair.add(seat);

      // Backrest
      const backGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.05);
      const back = new THREE.Mesh(backGeometry, material);
      back.position.y = 0.45;
      back.position.z = -0.225;
      chair.add(back);

      // Removed legs

      return chair;
    };

    // Chairs
    const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const chairPositions = [
      [-1, 0.75, -0.8], // Updated Y position
      [1, 0.75, -0.8],  // Updated Y position
    ];
    chairPositions.forEach(pos => {
      const chair = createChair(chairMaterial);
      chair.position.set(pos[0], pos[1], pos[2]);
      scene.add(chair);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, roomHeight - 1, 0);
    scene.add(pointLight);

    // Ceiling Light Beam
    const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 32);
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0xffffe0 });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, roomHeight - 1.5, 0);
    scene.add(beam);

    // Remove Ceiling Light Shade (Dish)
    // Commented out or removed the shade geometry and mesh
    // const shadeGeometry = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI);
    // const shadeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    // const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
    // shade.rotation.x = 0;
    // shade.position.set(0, roomHeight - 1.5, 0);
    // scene.add(shade);

    // Adjust Ceiling Light Bulb
    const bulbGeometry = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI);
    const bulbMaterial = new THREE.MeshStandardMaterial({ emissive: 0xffffe0, emissiveIntensity: 1 });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.rotation.x = -Math.PI / 2; // Rotate to have flat side facing downward
    bulb.position.set(0, roomHeight - 3.15, 0); // Slightly adjusted to link to the bottom of the beam
    scene.add(bulb);

    // Adjust Ceiling Light Source Position
    const ceilingLight = new THREE.PointLight(0xffffe0, 1.5, 15);
    ceilingLight.position.set(0, roomHeight - 3.15, 0); // Link to the bottom of the beam
    scene.add(ceilingLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update controls
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      controls.dispose();
    };
  }, []);

  return (
    <div>
      <h1>Welcome to the Kitchen</h1>
      <div ref={mountRef} style={{ width: '100%', height: '500px' }} />
    </div>
  );
};

export default Room;