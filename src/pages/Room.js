import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js'; 
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'; 
import { FaCamera } from 'react-icons/fa'; 

const Room = () => {
  const mountRef = useRef(null);
  const [quality, setQuality] = useState(25); 
  const [antialiasing, setAntialiasing] = useState(true);
  const cameraRef = useRef({ position: { x: 0, y: 2, z: 5 }, zoom: 1 }); 
  const activeCameraRef = useRef(null); 
  const sceneRef = useRef(null); 
  const materialsRef = useRef({}); 
  const [showModal, setShowModal] = useState(true);

  
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const statsRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const [selectedElement, setSelectedElement] = useState(null);
  const colorsRef = useRef(null);
  if (!colorsRef.current) {
    colorsRef.current = {
      walls: '#DEB887',
      floor: '#808080',
      counter: '#8B4513',
      furniture: '#654321',
      appliances: '#2F4F4F',
      sink: '#C0C0C0'
    };
  }
  const [customColors, setCustomColors] = useState(colorsRef.current);

  
  const materialCategoryMap = {
    walls: ['wall'],
    floor: ['floor'],
    counter: ['counter', 'counterTop'],
    furniture: ['chair', 'table'],
    appliances: ['stove', 'microwave', 'oven'],
    sink: ['sink', 'basin', 'basinMaterial', 'innerBasin']
  };

  
  const updateMaterialColor = (category, color) => {
    setCustomColors(prev => ({ ...prev, [category]: color }));
    colorsRef.current[category] = color;
    
    if (materialsRef.current) {
      const materialsToUpdate = materialCategoryMap[category] || [];
      materialsToUpdate.forEach(materialName => {
        const material = materialsRef.current[materialName];
        if (material) {
          material.color.setStyle(color);
          material.needsUpdate = true;
        }
      });
    }
  };

  const calculateResolution = (baseResolution) => {
    
    const scaleFactor = 0.2 + (quality / 20); 
    return Math.max(3, Math.floor(baseResolution * scaleFactor));
  };

  useEffect(() => {
    const mount = mountRef.current;

    
    const cleanup = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (statsRef.current?.dom?.parentNode) {
        statsRef.current.dom.parentNode.removeChild(statsRef.current.dom);
        statsRef.current = null;
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current = null;
      }

      
      while (mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }
    };

    
    cleanup();

    
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: antialiasing,
      powerPreference: 'high-performance',
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio * 0.5);
    mount.appendChild(rendererRef.current.domElement);

    
    const gl = rendererRef.current.getContext();
    if (!gl) {
      console.error('WebGL not supported or failed to initialize.');
      mount.innerHTML = '<p>Your browser does not support WebGL.</p>';
      return;
    }

    
    statsRef.current = new Stats();
    statsRef.current.showPanel(0); 
    document.body.appendChild(statsRef.current.dom);

    
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraRef.current.position.x, cameraRef.current.position.y, cameraRef.current.position.z); 
    camera.zoom = cameraRef.current.zoom; 
    camera.updateProjectionMatrix();
    activeCameraRef.current = camera; 

    
    const roomWidth = 10;
    const roomHeight = 5;
    const roomDepth = 10;

    
    const geometries = {
      wall: new THREE.PlaneGeometry(1, 1),
      floorCeiling: new THREE.PlaneGeometry(1, 1),
      box: new THREE.BoxGeometry(1, 1, 1),
    };

    
    const materials = {
      wall: new THREE.MeshStandardMaterial({ 
        color: colorsRef.current.walls,
        flatShading: true 
      }),
      floor: new THREE.MeshStandardMaterial({ 
        color: colorsRef.current.floor,
        flatShading: true 
      }),
      ceiling: new THREE.MeshBasicMaterial({ color: 0xCD853F }),
      table: new THREE.MeshStandardMaterial({ color: customColors.furniture }),
      chair: new THREE.MeshStandardMaterial({ color: customColors.furniture }),
      sink: new THREE.MeshBasicMaterial({ color: 0xC0C0C0 }),
      faucet: new THREE.MeshBasicMaterial({ color: 0xA9A9A9 }),
      knob: new THREE.MeshBasicMaterial({ color: 0x000000 }),
      stove: new THREE.MeshStandardMaterial({ color: customColors.appliances }),
      grate: new THREE.MeshBasicMaterial({ color: 0x555555 }),
      counter: new THREE.MeshStandardMaterial({ color: customColors.counter }),
      utensils: new THREE.MeshStandardMaterial({ color: 0xC0C0C0 }),
      counterTop: new THREE.MeshStandardMaterial({ color: 0xFFFFFF }),
      microwave: new THREE.MeshStandardMaterial({ color: 0x303030 }),
      plants: new THREE.MeshStandardMaterial({ color: 0x228B22 }),
      fruit: new THREE.MeshStandardMaterial({ color: 0xFF6B6B }),
      paper: new THREE.MeshStandardMaterial({ color: 0xFFFFFF }),
    };
    materialsRef.current = materials;

    
    const wallMeshes = [];
    
    const backWallMesh = new THREE.Mesh(geometries.wall, materials.wall);
    backWallMesh.scale.set(roomWidth, roomHeight, 1);
    backWallMesh.position.set(0, roomHeight / 2, -roomDepth / 2);
    wallMeshes.push(backWallMesh);
    
    const frontWallMesh = new THREE.Mesh(geometries.wall, materials.wall);
    frontWallMesh.scale.set(roomWidth, roomHeight, 1);
    frontWallMesh.position.set(0, roomHeight / 2, roomDepth / 2);
    frontWallMesh.rotation.y = Math.PI;
    wallMeshes.push(frontWallMesh);
    
    const leftWallMesh = new THREE.Mesh(geometries.wall, materials.wall);
    leftWallMesh.scale.set(roomDepth, roomHeight, 1);
    leftWallMesh.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWallMesh.rotation.y = Math.PI / 2;
    wallMeshes.push(leftWallMesh);
    
    const rightWallMesh = new THREE.Mesh(geometries.wall, materials.wall);
    rightWallMesh.scale.set(roomDepth, roomHeight, 1);
    rightWallMesh.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWallMesh.rotation.y = -Math.PI / 2;
    wallMeshes.push(rightWallMesh);

    
    const wallGeometries = wallMeshes.map(mesh => {
      mesh.updateMatrix();
      return mesh.geometry.clone().applyMatrix4(mesh.matrix);
    });
    const mergedWallGeometry = mergeGeometries(wallGeometries);
    const mergedWallMesh = new THREE.Mesh(mergedWallGeometry, materials.wall);
    scene.add(mergedWallMesh);

    
    const floorCeilingMeshes = [];
    
    const floorMesh = new THREE.Mesh(geometries.floorCeiling, materials.floor);
    floorMesh.scale.set(roomWidth, roomDepth, 1);
    floorMesh.rotation.x = -Math.PI / 2;
    floorCeilingMeshes.push(floorMesh);
    
    const ceilingMesh = new THREE.Mesh(geometries.floorCeiling, materials.ceiling);
    ceilingMesh.scale.set(roomWidth, roomDepth, 1);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = roomHeight;
    floorCeilingMeshes.push(ceilingMesh);

    
    const floorCeilingGeometries = floorCeilingMeshes.map(mesh => {
      mesh.updateMatrix();
      return mesh.geometry.clone().applyMatrix4(mesh.matrix);
    });
    const mergedFloorCeilingGeometry = mergeGeometries(floorCeilingGeometries);
    const mergedFloorCeilingMesh = new THREE.Mesh(mergedFloorCeilingGeometry, materials.floor);
    scene.add(mergedFloorCeilingMesh);

    
    const tableGeometry = new THREE.BoxGeometry(2, 0.1, 1, calculateResolution(10), calculateResolution(10), calculateResolution(10));
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = 1;
    scene.add(table);

    
    const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1, calculateResolution(10), calculateResolution(10), calculateResolution(10));
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

    
    const createChair = (material) => {
      const chair = new THREE.Group();

      
      const seatGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5, calculateResolution(10), calculateResolution(10), calculateResolution(10));
      const seat = new THREE.Mesh(seatGeometry, material);
      seat.position.y = 0.25;
      chair.add(seat);

      
      const backGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.05, calculateResolution(10), calculateResolution(10), calculateResolution(10));
      const back = new THREE.Mesh(backGeometry, material);
      back.position.y = 0.45;
      back.position.z = -0.225;
      chair.add(back);

      

      return chair;
    };

    
    const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const chairPositions = [
      [-1, 0, -0.8, 0],        
      [1, 0, -0.8, 0],         
      [-1, 0, 0.8, Math.PI],   
      [1, 0, 0.8, Math.PI],    
    ];

    
    const chairGeometry = new THREE.BoxGeometry(1, 1, 1); 
    const chairCount = chairPositions.length;
    const chairMesh = new THREE.InstancedMesh(chairGeometry, materials.chair, chairCount);
    chairPositions.forEach((pos, index) => {
      const dummy = new THREE.Object3D();
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.rotation.y = pos[3];
      dummy.scale.set(0.5, 0.5, 0.5); 
      dummy.updateMatrix();
      chairMesh.setMatrixAt(index, dummy.matrix);
    });
    scene.add(chairMesh);

    
    
    
    
    
    

    
    const sinkDepth = 0.5; 
    const createDetailedSink = () => {
      const sinkGroup = new THREE.Group();

      
      const basinGeometry = new THREE.BoxGeometry(1, 0.2, sinkDepth, calculateResolution(20), calculateResolution(5), calculateResolution(10));
      const basin = new THREE.Mesh(basinGeometry, materials.sink);
      sinkGroup.add(basin);

      
      const innerBasinGeometry = new THREE.BoxGeometry(0.9, 0.15, sinkDepth - 0.05, calculateResolution(20), calculateResolution(5), calculateResolution(10));
      const innerBasin = new THREE.Mesh(innerBasinGeometry, materials.sink);
      innerBasin.position.y = -0.1;
      innerBasin.position.z = -0.025; 
      sinkGroup.add(innerBasin);

      
      const faucetBaseGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1, calculateResolution(10));
      const faucetMaterial = new THREE.MeshStandardMaterial({ color: 0xA9A9A9 });
      const faucetBase = new THREE.Mesh(faucetBaseGeometry, faucetMaterial);
      faucetBase.position.set(0, 0.1, -0.2);
      sinkGroup.add(faucetBase);

      
      const faucetNeckGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.3, calculateResolution(10));
      const faucetNeck = new THREE.Mesh(faucetNeckGeometry, faucetMaterial);
      faucetNeck.position.set(0, 0.25, -0.2);
      faucetNeck.rotation.x = Math.PI / 2;
      sinkGroup.add(faucetNeck);

      
      const faucetSpoutGeometry = new THREE.TorusGeometry(0.05, 0.015, calculateResolution(10), calculateResolution(10), Math.PI);
      const faucetSpout = new THREE.Mesh(faucetSpoutGeometry, faucetMaterial);
      faucetSpout.position.set(0, 0.4, -0.15);
      faucetSpout.rotation.x = Math.PI / 2;
      sinkGroup.add(faucetSpout);

      
      const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.05, calculateResolution(10));
      const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
      leftHandle.position.set(-0.3, 0.15, -0.2);
      leftHandle.rotation.x = Math.PI / 2;
      sinkGroup.add(leftHandle);

      const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
      rightHandle.position.set(0.3, 0.15, -0.2);
      rightHandle.rotation.x = Math.PI / 2;
      sinkGroup.add(rightHandle);

      
      const drainGeometry = new THREE.CircleGeometry(0.05, calculateResolution(10));
      const drainMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const drain = new THREE.Mesh(drainGeometry, drainMaterial);
      drain.position.set(0, -0.1, 0);
      drain.rotation.x = -Math.PI / 2;
      sinkGroup.add(drain);

      
      sinkGroup.position.set(0, 1, -roomDepth / 2 + sinkDepth / 2); 

      return sinkGroup;
    };

    const detailedSink = createDetailedSink();
    scene.add(detailedSink);

    
    
    
    
    
    

    
    const stoveDepth = 0.6; 
    const createDetailedStove = () => {
      const stoveGroup = new THREE.Group();

      
      const bodyGeometry = new THREE.BoxGeometry(1, 1, stoveDepth, calculateResolution(20), calculateResolution(20), calculateResolution(10));
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.5;
      stoveGroup.add(body);

      
      const doorGeometry = new THREE.BoxGeometry(0.9, 0.6, 0.02, calculateResolution(10));
      const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(0, 0.3, stoveDepth / 2 + 0.01); 
      stoveGroup.add(door);

      
      const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, calculateResolution(10));
      const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
      const handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0, 0.3, 0.34);
      stoveGroup.add(handle);

      
      const panelGeometry = new THREE.BoxGeometry(1, 0.2, 0.1, calculateResolution(10));
      const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x3E3E3E });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(0, 0.9, stoveDepth / 2 - 0.05); 
      stoveGroup.add(panel);

      
      const knobGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.02, calculateResolution(10));
      const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const knobPositions = [
        [-0.3, 0.9, 0.31],
        [-0.1, 0.9, 0.31],
        [0.1, 0.9, 0.31],
        [0.3, 0.9, 0.31],
      ];
      knobPositions.forEach(pos => {
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(pos[0], pos[1], stoveDepth / 2 - 0.03); 
        stoveGroup.add(knob);
      });

      
      const burnerGeometry = new THREE.CircleGeometry(0.1, calculateResolution(10));
      const burnerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const burnerPositions = [
        [-0.25, 1.02, -0.15],
        [0.25, 1.02, -0.15],
        [-0.25, 1.02, 0.15],
        [0.25, 1.02, 0.15],
      ];
      burnerPositions.forEach(pos => {
        const burner = new THREE.Mesh(burnerGeometry, burnerMaterial);
        burner.rotation.x = -Math.PI / 2;
        burner.position.set(pos[0], pos[1], pos[2]);
        stoveGroup.add(burner);
      });

      
      const grateMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      burnerPositions.forEach(pos => {
        const grate = new THREE.Mesh(burnerGeometry, grateMaterial);
        grate.rotation.x = -Math.PI / 2;
        grate.position.set(pos[0], pos[1] + 0.01, pos[2]);
        stoveGroup.add(grate);
      });

      
      stoveGroup.position.set(2, 0, -roomDepth / 2 + stoveDepth / 2); 

      return stoveGroup;
    };

    const detailedStove = createDetailedStove();
    scene.add(detailedStove);

    const createDetailedChair = () => {
      const chair = new THREE.Group();
      
      
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.05, 0.5, calculateResolution(10)),
        materials.chair
      );
      seat.position.y = 0.45; 
      chair.add(seat);
    
      
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 0.05, calculateResolution(10)),
        materials.chair
      );
      back.position.set(0, 0.75, -0.225);
      chair.add(back);
    
      
      const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.45, calculateResolution(8));
      const legPositions = [
        [-0.22, 0.225, -0.22],
        [0.22, 0.225, -0.22],
        [-0.22, 0.225, 0.22],
        [0.22, 0.225, 0.22]
      ];
      
      legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, materials.chair);
        leg.position.set(...pos);
        chair.add(leg);
      });
    
      return chair;
    };

    
    chairPositions.forEach((pos) => {
      const chair = createDetailedChair();
      chair.position.set(pos[0], pos[1], pos[2]);
      chair.rotation.y = pos[3];
      scene.add(chair);
    });

    const createCounter = () => {
      const counterGroup = new THREE.Group();
    
      
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.9, 0.6),
        materials.counter
      );
      base.position.set(-2, 0.45, -roomDepth/2 + 0.3);
      counterGroup.add(base);
    
      
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(6.2, 0.05, 0.7),
        materials.counterTop
      );
      top.position.set(-2, 0.925, -roomDepth/2 + 0.3);
      counterGroup.add(top);
    
      
      const utensilPositions = [
        [-3.5, 1, -roomDepth/2 + 0.3], 
        [-3, 1, -roomDepth/2 + 0.3],   
        [-2.5, 1, -roomDepth/2 + 0.3], 
        [-2, 1, -roomDepth/2 + 0.3],   
      ];
    
      
      const knifeBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 0.2),
        materials.counter
      );
      knifeBlock.position.set(...utensilPositions[0]);
      counterGroup.add(knifeBlock);
    
      
      const spoonHolder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.25, calculateResolution(8)),
        materials.utensils
      );
      spoonHolder.position.set(...utensilPositions[1]);
      counterGroup.add(spoonHolder);
    
      
      const cuttingBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.02, 0.3),
        materials.counter
      );
      cuttingBoard.position.set(...utensilPositions[2]);
      counterGroup.add(cuttingBoard);
    
      
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, calculateResolution(10), calculateResolution(10), 0, Math.PI * 2, 0, Math.PI/2),
        materials.utensils
      );
      bowl.position.set(...utensilPositions[3]);
      counterGroup.add(bowl);
    
      return counterGroup;
    };

    
    const counter = createCounter();
    scene.add(counter);

    
    const createKitchenItems = () => {
      const items = new THREE.Group();
    
      
      const microwave = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.4),
        materials.microwave
      );
      microwave.position.set(-3, 1.05, -roomDepth/2 + 0.3);
      items.add(microwave);
    
      
      const paperHolder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.3, calculateResolution(8)),
        materials.utensils
      );
      paperHolder.rotation.x = Math.PI/2;
      paperHolder.position.set(-1.5, 1.05, -roomDepth/2 + 0.3);
      items.add(paperHolder);
    
      
      const paperRoll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.25, calculateResolution(16)),
        materials.paper
      );
      paperRoll.rotation.x = Math.PI/2;
      paperRoll.position.set(-1.5, 1.05, -roomDepth/2 + 0.3);
      items.add(paperRoll);
    
      
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.1, 0.2, calculateResolution(8)),
        materials.counter
      );
      pot.position.set(-4, 1.05, -roomDepth/2 + 0.3);
      items.add(pot);
    
      
      const plant = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, calculateResolution(8), calculateResolution(8)),
        materials.plants
      );
      plant.position.set(-4, 1.3, -roomDepth/2 + 0.3);
      items.add(plant);
    
      
      const fruitBowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, calculateResolution(16), calculateResolution(16), 0, Math.PI * 2, 0, Math.PI/2),
        materials.utensils
      );
      fruitBowl.position.set(0, 1.1, 0);
      fruitBowl.rotation.x = Math.PI;
    
      
      const fruitGeometry = new THREE.SphereGeometry(0.06, calculateResolution(8), calculateResolution(8));
      const fruitPositions = [
        [0.1, 1.15, 0],
        [-0.1, 1.15, 0],
        [0, 1.15, 0.1],
        [0, 1.2, 0],
      ];
    
      fruitPositions.forEach(pos => {
        const fruit = new THREE.Mesh(fruitGeometry, materials.fruit);
        fruit.position.set(...pos);
        items.add(fruit);
      });
    
      items.add(fruitBowl);
    
      return items;
    };
    
    
    const kitchenItems = createKitchenItems();
    scene.add(kitchenItems);

    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(-roomWidth / 4, roomHeight - 1, -roomDepth / 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 1);
    pointLight2.position.set(roomWidth / 4, roomHeight - 1, roomDepth / 4);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 1);
    pointLight3.position.set(-roomWidth / 4, roomHeight - 1, roomDepth / 4);
    scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0xffffff, 1);
    pointLight4.position.set(roomWidth / 4, roomHeight - 1, -roomDepth / 4);
    scene.add(pointLight4);

    
    const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, calculateResolution(10));
    const beamMaterial = new THREE.MeshStandardMaterial({ color: 0xffffe0 });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, roomHeight - 1.5, 0);
    scene.add(beam);

    
    
    
    
    
    
    
    

    
    const bulbGeometry = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI);
    const bulbMaterial = new THREE.MeshStandardMaterial({ emissive: 0xffffe0, emissiveIntensity: 1 });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.rotation.x = -Math.PI / 2; 
    bulb.position.set(0, roomHeight - 3.15, 0); 
    scene.add(bulb);

    
    const ceilingLight = new THREE.PointLight(0xffffff, 2, 30);
    ceilingLight.position.set(0, roomHeight - 0.5, 0);
    scene.add(ceilingLight);

    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemisphereLight.position.set(0, roomHeight, 0);
    scene.add(hemisphereLight);

    
    controlsRef.current = new OrbitControls(camera, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;

    
    controlsRef.current.maxPolarAngle = Math.PI / 2; 
    controlsRef.current.minPolarAngle = Math.PI / 4; 

    
    controlsRef.current.maxDistance = 5; 
    controlsRef.current.addEventListener('change', () => {
      if (camera.position.y > 4.063136450810716) camera.position.y = 4.063136450810716;
      if (camera.zoom > 1) camera.zoom = 1;
      camera.updateProjectionMatrix();
    });

    
    controlsRef.current.addEventListener('change', () => {
      cameraRef.current.position = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      cameraRef.current.zoom = camera.zoom;
    });

    
    const animate = () => {
      statsRef.current.begin(); 
      controlsRef.current.update(); 
      rendererRef.current.render(scene, camera);
      statsRef.current.end(); 
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    
    const handleResize = () => {
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    
    rendererRef.current.setPixelRatio(window.devicePixelRatio * 0.5); 
    rendererRef.current.antialias = false; 

    
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.frustumCulled = true;
      }
    });

    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current.domElement.remove();
        rendererRef.current = null;
      }
      if (statsRef.current) {
        document.body.removeChild(statsRef.current.dom);
      }
      mergedWallGeometry.dispose();
      mergedFloorCeilingGeometry.dispose();
      chairGeometry.dispose();
      Object.values(geometries).forEach(geometry => geometry.dispose());
      Object.values(materials).forEach(material => material.dispose());
    };
  }, [quality, antialiasing]); 

  
  const throttledColorUpdate = (category, color) => {
    if (!materialsRef.current) return;
    requestAnimationFrame(() => {
      updateMaterialColor(category, color);
    });
  };

  
  const takeScreenshot = () => {
    if (rendererRef.current && sceneRef.current && activeCameraRef.current) {
      
      const ui = document.querySelector('.kitchen-ui');
      if (ui) {
        
        ui.style.display = 'none';
        
        
        rendererRef.current.render(sceneRef.current, activeCameraRef.current);
        
        
        const link = document.createElement('a');
        link.download = 'kitchen-screenshot.png';
        const canvas = rendererRef.current.domElement;
        link.href = canvas.toDataURL('image/png', 1.0);
        
        
        ui.style.display = 'block';
        
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div>
      <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
      <div className="kitchen-ui" style={{ position: 'absolute', top: 10, left: 10, zIndex: 100, background: 'rgba(255,255,255,0.7)', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: 0 }}>Welcome to the Kitchen</h1>
          <button 
            onClick={takeScreenshot}
            style={{ 
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f0f0f0'
            }}
          >
            <FaCamera size={20} />
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '20px', display: 'inline-block' }}>
            Quality: {quality}
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              style={{ marginLeft: '10px', verticalAlign: 'middle' }}
            />
          </label>
          <label style={{ display: 'inline-block' }}>
            Anti-aliasing:
            <input
              type="checkbox"
              checked={antialiasing}
              onChange={(e) => setAntialiasing(e.target.checked)}
              style={{ marginLeft: '5px', verticalAlign: 'middle' }}
            />
          </label>
        </div>
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Customize Colors</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {Object.entries(customColors).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ textTransform: 'capitalize', marginRight: '10px' }}>
                  {key}:
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => throttledColorUpdate(key, e.target.value)}
                    style={{ marginLeft: '5px', verticalAlign: 'middle' }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 style={{ marginTop: 0 }}>Welcome to the 3D Kitchen Visualizer :)</h2>
            <p>This interactive 3D kitchen allows you to:</p>
            <ul style={{ textAlign: 'left', marginBottom: '20px' }}>
              <li>Design to your hearts content!</li>
              <li>Adjust various quality settings</li>
              <li>Take screenshots of your design</li>
              <ul>
                <li>Adjust your view to focus what you want captured perfectly</li>
                <li>Click the camera icon in the top right corner and your image will be downloaded and saved to your device</li>
              </ul>
              <li>Navigate using mouse controls:
                <ul>
                  <li>Left click + drag to rotate</li>
                  <li>Right click + drag to pan</li>
                  <li>Scroll to zoom</li>
                </ul>
              </li>
            </ul>
            <p>Have fun!</p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                padding: '8px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;