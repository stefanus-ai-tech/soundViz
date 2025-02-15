import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BarVisualizerProps {
  audioData: Uint8Array;
}

const BarVisualizer = ({ audioData }: BarVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene with black background
    sceneRef.current = new THREE.Scene();
    sceneRef.current.fog = new THREE.Fog(0x000000, 1, 30);

    // Setup camera
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current.position.z = 15;
    cameraRef.current.position.y = 5;
    cameraRef.current.lookAt(0, 0, 0);

    // In the setup effect of BarVisualizer.tsx
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    rendererRef.current.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    rendererRef.current.setClearColor(0x000000, 0);
    rendererRef.current.domElement.setAttribute('data-engine', 'three.js'); // Add this line
    containerRef.current.appendChild(rendererRef.current.domElement);

    // Create bars with brighter rainbow colors
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const materials = Array(32)
      .fill(null)
      .map((_, i) => {
        const hue = (i / 32) * 360;
        return new THREE.MeshPhongMaterial({
          color: new THREE.Color(`hsl(${hue}, 100%, 70%)`),
          shininess: 150,
          specular: new THREE.Color(`hsl(${hue}, 100%, 90%)`),
          emissive: new THREE.Color(`hsl(${hue}, 100%, 40%)`),
        });
      });

    for (let i = 0; i < 32; i++) {
      const bar = new THREE.Mesh(geometry, materials[i]);
      const angle = (i / 32) * Math.PI * 2;
      const radius = 8;
      bar.position.x = Math.cos(angle) * radius;
      bar.position.z = Math.sin(angle) * radius;
      bar.rotation.y = -angle;
      sceneRef.current.add(bar);
      barsRef.current.push(bar);
    }

    // Add ground plane for reflection
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      shininess: 100,
      specular: 0x222222,
      transparent: true,
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    sceneRef.current.add(ground);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x111111);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 15, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;

    sceneRef.current.add(ambientLight);
    sceneRef.current.add(spotLight);

    let frame = 0;
    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current)
        return;

      frame += 0.005;
      cameraRef.current.position.x = Math.sin(frame) * 15;
      cameraRef.current.position.z = Math.cos(frame) * 15;
      cameraRef.current.lookAt(0, 0, 0);

      requestAnimationFrame(animate);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      cameraRef.current.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    // Update bars based on audio data
    barsRef.current.forEach((bar, i) => {
      if (audioData && audioData[i]) {
        const scale = (audioData[i] / 128.0) * 3;
        bar.scale.y = scale;
        bar.position.y = scale * 0.5 - 0.5;
      }
    });
  }, [audioData]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default BarVisualizer;
