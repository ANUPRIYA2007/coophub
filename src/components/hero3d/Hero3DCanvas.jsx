import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { hero3dStateMachine, HERO_STATES } from '../../services/hero3d/hero3dStateMachine';
import { hero3dMovementEngine } from '../../services/hero3d/hero3dMovementEngine';
import { hero3dInteractionController } from '../../services/hero3d/hero3dInteractionController';

const GLB_URL = '/assets/3d/CoopBot_Animated.glb';

export default function Hero3DCanvas({
  mode = 'bubble', // 'avatar' | 'bubble' | 'card' | 'full'
  interactive = true,
  className = '',
  style = {},
  onLoaded = null,
}) {
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hero3dInteractionController.init();

    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    let animationFrameId = null;
    let isVisible = true;

    // Dimensions
    const getContainerSize = () => {
      const w = container.clientWidth || container.offsetWidth || 120;
      const h = container.clientHeight || container.offsetHeight || 120;
      return { width: Math.max(w, 40), height: Math.max(h, 40) };
    };

    const initialSize = getContainerSize();

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, initialSize.width / initialSize.height, 0.1, 50);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialSize.width, initialSize.height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Comprehensive Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 1.8);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 3.0);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf97316, 2.5);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Character State References
    let mixer = null;
    let actions = {};
    let currentAction = null;
    let morphTargetDict = {};
    let morphTargetInfluences = null;
    let headBone = null;
    let neckBone = null;
    let eyeLBone = null;
    let eyeRBone = null;
    let spineBone = null;
    let modelRoot = null;
    let baseCenterX = 0;
    let baseCenterY = 0;
    let baseCenterZ = 0;
    let lookTargetY = 0;
    let renderVisorFace = null;

    const clock = new THREE.Clock();

    // Load Animated GLB
    const loader = new GLTFLoader();
    loader.load(
      GLB_URL,
      (gltf) => {
        if (isDisposed) return;
        setIsLoading(false);

        const model = gltf.scene;
        modelRoot = model;
        scene.add(model);

        // Calculate exact bounding box & center geometry
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Recenter model to origin
        baseCenterX = -center.x;
        baseCenterY = -center.y;
        baseCenterZ = -center.z;
        model.position.set(baseCenterX, baseCenterY, baseCenterZ);

        const maxDim = Math.max(size.x, size.y, size.z);

        // Position camera dynamically based on mode and computed model dimensions
        let camDist = maxDim * 1.4;
        lookTargetY = 0;

        if (mode === 'avatar') {
          lookTargetY = size.y * 0.38;
          camDist = maxDim * 0.55;
        } else if (mode === 'bubble') {
          lookTargetY = size.y * 0.04;
          camDist = maxDim * 1.12;
        } else if (mode === 'card') {
          lookTargetY = size.y * 0.02;
          camDist = maxDim * 1.25;
        } else if (mode === 'full') {
          lookTargetY = 0;
          camDist = maxDim * 1.45;
        }

        camera.position.set(0, lookTargetY + 0.05, camDist);
        camera.lookAt(0, lookTargetY, 0);

        // Traverse mesh and bones
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness, 0.7);
              child.material.needsUpdate = true;
            }
            if (child.morphTargetDictionary && child.morphTargetInfluences) {
              morphTargetDict = child.morphTargetDictionary;
              morphTargetInfluences = child.morphTargetInfluences;
            }
          }
          if (child.isBone) {
            if (child.name === 'Head') headBone = child;
            if (child.name === 'Neck') neckBone = child;
            if (child.name === 'Eye_L') eyeLBone = child;
            if (child.name === 'Eye_R') eyeRBone = child;
            if (child.name === 'Spine') spineBone = child;
          }
        });

        // Attach Dynamic Visor Screen Overlay for Expressive Blinking & Speaking Mouth
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 512;
        faceCanvas.height = 512;
        const faceCtx = faceCanvas.getContext('2d');
        const faceTexture = new THREE.CanvasTexture(faceCanvas);
        faceTexture.colorSpace = THREE.SRGBColorSpace;

        const faceGeo = new THREE.PlaneGeometry(0.48, 0.32, 24, 16);
        const posAttr = faceGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const curveZ = -Math.cos((x / 0.24) * (Math.PI / 2.6)) * 0.055 + 0.055;
          posAttr.setZ(i, curveZ);
        }
        faceGeo.computeVertexNormals();

        const faceMat = new THREE.MeshBasicMaterial({
          map: faceTexture,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
        });
        const visorFaceMesh = new THREE.Mesh(faceGeo, faceMat);

        if (headBone) {
          visorFaceMesh.position.set(0, -0.27, 0.045);
          visorFaceMesh.rotation.set(Math.PI / 2, Math.PI, 0);
          headBone.add(visorFaceMesh);
        } else {
          visorFaceMesh.position.set(0, lookTargetY + 0.35, -0.26);
          model.add(visorFaceMesh);
        }

        // Dynamic Face Drawing Function
        renderVisorFace = (blinkVal, isSpeaking, gazeX, gazeY, time, state) => {
          faceCtx.clearRect(0, 0, 512, 512);

          // Eye Coordinates & Gaze Offsets
          const leftEyeX = 168 + gazeX * 22;
          const rightEyeX = 344 + gazeX * 22;
          const eyeY = 220 + gazeY * 16;

          // Eyebrows
          faceCtx.strokeStyle = '#38bdf8';
          faceCtx.lineWidth = 8;
          faceCtx.lineCap = 'round';

          let leftBrowY = eyeY - 60;
          let rightBrowY = eyeY - 60;
          if (state === 'THINKING') {
            rightBrowY -= 14;
            leftBrowY += 6;
          } else if (state === 'ERROR' || state === 'WARNING') {
            leftBrowY -= 10;
            rightBrowY -= 10;
          }

          // Left Brow Arc
          faceCtx.beginPath();
          faceCtx.arc(leftEyeX, leftBrowY + 30, 36, Math.PI * 1.15, Math.PI * 1.85);
          faceCtx.stroke();

          // Right Brow Arc
          faceCtx.beginPath();
          faceCtx.arc(rightEyeX, rightBrowY + 30, 36, Math.PI * 1.15, Math.PI * 1.85);
          faceCtx.stroke();

          // Eyes: Real-Time Blinking (Height scales from 48px down to 2px)
          const eyeOpen = Math.max(0.02, 1.0 - blinkVal * 0.96);
          const eyeHeight = 48 * eyeOpen;
          const eyeWidth = 40;

          if (eyeOpen > 0.15) {
            // Draw Left Eye
            faceCtx.fillStyle = '#ffffff';
            faceCtx.beginPath();
            faceCtx.ellipse(leftEyeX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
            faceCtx.fill();

            // Left Pupil
            faceCtx.fillStyle = '#0f172a';
            faceCtx.beginPath();
            faceCtx.ellipse(leftEyeX + gazeX * 8, eyeY + gazeY * 6, eyeWidth * 0.65, eyeHeight * 0.65, 0, 0, Math.PI * 2);
            faceCtx.fill();

            // Specular Gleam
            faceCtx.fillStyle = '#ffffff';
            faceCtx.beginPath();
            faceCtx.arc(leftEyeX + 10, eyeY - eyeHeight * 0.35, 9, 0, Math.PI * 2);
            faceCtx.fill();

            // Draw Right Eye
            faceCtx.fillStyle = '#ffffff';
            faceCtx.beginPath();
            faceCtx.ellipse(rightEyeX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
            faceCtx.fill();

            // Right Pupil
            faceCtx.fillStyle = '#0f172a';
            faceCtx.beginPath();
            faceCtx.ellipse(rightEyeX + gazeX * 8, eyeY + gazeY * 6, eyeWidth * 0.65, eyeHeight * 0.65, 0, 0, Math.PI * 2);
            faceCtx.fill();

            // Specular Gleam
            faceCtx.fillStyle = '#ffffff';
            faceCtx.beginPath();
            faceCtx.arc(rightEyeX + 10, eyeY - eyeHeight * 0.35, 9, 0, Math.PI * 2);
            faceCtx.fill();
          } else {
            // Closed Eye Cute Curve
            faceCtx.strokeStyle = '#38bdf8';
            faceCtx.lineWidth = 7;
            faceCtx.beginPath();
            faceCtx.arc(leftEyeX, eyeY, 32, Math.PI * 0.15, Math.PI * 0.85);
            faceCtx.stroke();

            faceCtx.beginPath();
            faceCtx.arc(rightEyeX, eyeY, 32, Math.PI * 0.15, Math.PI * 0.85);
            faceCtx.stroke();
          }

          // Dynamic Animated Mouth: Opens and Closes when Speaking
          const mouthX = 256;
          const mouthY = 365;

          if (isSpeaking) {
            // Rapid speech opening & closing cadence
            const speechPulse = Math.abs(Math.sin(time * 15.0) * Math.sin(time * 8.0));
            const mouthH = 10 + speechPulse * 34;
            const mouthW = 46 + speechPulse * 12;

            // Mouth Cavity
            faceCtx.fillStyle = '#0f172a';
            faceCtx.beginPath();
            faceCtx.ellipse(mouthX, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
            faceCtx.fill();
            faceCtx.strokeStyle = '#38bdf8';
            faceCtx.lineWidth = 4;
            faceCtx.stroke();

            // Upper Teeth Bar
            faceCtx.fillStyle = '#ffffff';
            faceCtx.beginPath();
            faceCtx.rect(mouthX - mouthW * 0.6, mouthY - mouthH * 0.8, mouthW * 1.2, mouthH * 0.45);
            faceCtx.fill();

            // Tongue Accent
            faceCtx.fillStyle = '#f43f5e';
            faceCtx.beginPath();
            faceCtx.arc(mouthX, mouthY + mouthH * 0.3, mouthW * 0.45, 0, Math.PI);
            faceCtx.fill();
          } else if (state === 'THINKING') {
            // Cute small inquisitive 'o'
            faceCtx.fillStyle = '#0f172a';
            faceCtx.beginPath();
            faceCtx.arc(mouthX + 12, mouthY, 14, 0, Math.PI * 2);
            faceCtx.fill();
            faceCtx.strokeStyle = '#38bdf8';
            faceCtx.lineWidth = 4;
            faceCtx.stroke();
          } else if (state === 'ERROR' || state === 'WARNING') {
            // Expressive 'Oops' oval
            faceCtx.fillStyle = '#0f172a';
            faceCtx.beginPath();
            faceCtx.ellipse(mouthX, mouthY, 26, 16, 0, 0, Math.PI * 2);
            faceCtx.fill();
            faceCtx.strokeStyle = '#f97316';
            faceCtx.lineWidth = 4;
            faceCtx.stroke();
          } else {
            // Cheerful Smile Line
            faceCtx.strokeStyle = '#ffffff';
            faceCtx.lineWidth = 7;
            faceCtx.beginPath();
            faceCtx.arc(mouthX, mouthY - 10, 36, Math.PI * 0.2, Math.PI * 0.8);
            faceCtx.stroke();
          }

          faceTexture.needsUpdate = true;
        };

        // Initialize Animation Actions
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actions[clip.name] = action;
          });

          // Play default Idle or active state action
          const initialActionName = hero3dStateMachine.getAnimationName();
          const initialAction = actions[initialActionName] || actions['Action_Idle'] || Object.values(actions)[0];
          if (initialAction) {
            initialAction.play();
            currentAction = initialAction;
          }
        }

        if (onLoaded) onLoaded(gltf);
      },
      undefined,
      (error) => {
        if (isDisposed) return;
        console.warn('[Hero3DCanvas] GLB Load Warning:', error);
        setLoadError(error.message);
      }
    );

    // State Machine Subscription
    const unsubscribeState = hero3dStateMachine.subscribe((newState) => {
      if (!actions || Object.keys(actions).length === 0) return;

      const actionName = hero3dStateMachine.getAnimationName(newState);
      const nextAction = actions[actionName];

      if (nextAction && nextAction !== currentAction) {
        nextAction.reset();
        nextAction.fadeIn(0.25);
        nextAction.play();

        if (currentAction) {
          currentAction.fadeOut(0.25);
        }
        currentAction = nextAction;
      }
    });

    // Render Loop
    const renderLoop = () => {
      if (isDisposed) return;
      animationFrameId = requestAnimationFrame(renderLoop);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update Kinematics & Procedural Motion
      const kinematics = hero3dMovementEngine.update(delta);

      if (mixer) {
        mixer.update(delta);
      }

      // Procedural Head & Eye Look-At Overrides
      if (headBone && interactive) {
        headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, kinematics.headYaw, 0.2);
        headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, kinematics.headPitch, 0.2);
        headBone.rotation.z = THREE.MathUtils.lerp(headBone.rotation.z, kinematics.headRoll, 0.2);
      }

      if (neckBone && interactive) {
        neckBone.rotation.y = THREE.MathUtils.lerp(neckBone.rotation.y, kinematics.headYaw * 0.4, 0.2);
      }

      if (eyeLBone && eyeRBone && interactive) {
        eyeLBone.rotation.y = kinematics.eyeYaw;
        eyeRBone.rotation.y = kinematics.eyeYaw;
      }

      if (spineBone) {
        spineBone.rotation.y = THREE.MathUtils.lerp(spineBone.rotation.y, kinematics.spineYaw, 0.15);
      }

      if (modelRoot) {
        modelRoot.position.y = baseCenterY + kinematics.floatOffsetY;
      }

      // Morph Target Updates (Blink & Active State Morphs)
      if (morphTargetDict && morphTargetInfluences) {
        // Natural Eyelid Blinking
        if (morphTargetDict['Blink'] !== undefined) {
          morphTargetInfluences[morphTargetDict['Blink']] = kinematics.blinkInfluence;
        }

        const isSpeaking = hero3dStateMachine.getState() === HERO_STATES.SPEAKING;

        // Dynamic Mouth Opening and Closing during Speech
        if (morphTargetDict['Speaking'] !== undefined) {
          let speakingTarget = 0.0;
          if (isSpeaking) {
            const t = clock.getElapsedTime();
            const speechWave = Math.sin(t * 14.0) * Math.sin(t * 7.5);
            speakingTarget = THREE.MathUtils.clamp(Math.abs(speechWave) * 1.1, 0.15, 0.95);
          }
          morphTargetInfluences[morphTargetDict['Speaking']] = THREE.MathUtils.lerp(
            morphTargetInfluences[morphTargetDict['Speaking']] || 0,
            speakingTarget,
            0.35
          );
        }

        // Apply State Morphs (Smile, Thinking, Alert)
        const stateMorphs = hero3dStateMachine.getMorphTargets();
        Object.entries(stateMorphs).forEach(([morphName, targetValue]) => {
          if (morphName === 'Speaking' || morphName === 'Blink') return;
          const idx = morphTargetDict[morphName];
          if (idx !== undefined) {
            morphTargetInfluences[idx] = THREE.MathUtils.lerp(
              morphTargetInfluences[idx] || 0,
              targetValue,
              0.25
            );
          }
        });
      }

      // Update Dynamic Visor Face (Real-Time Blinking & Speaking Mouth)
      if (renderVisorFace) {
        const currentState = hero3dStateMachine.getState();
        const isSpeaking = currentState === HERO_STATES.SPEAKING;
        renderVisorFace(
          kinematics?.blinkInfluence || 0,
          isSpeaking,
          kinematics?.currentGaze?.x || kinematics?.gazeX || 0,
          kinematics?.currentGaze?.y || kinematics?.gazeY || 0,
          time,
          currentState
        );
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.max(entry.contentRect.width || container.clientWidth || 60, 40);
        const newHeight = Math.max(entry.contentRect.height || container.clientHeight || 60, 40);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // Intersection Observer
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    intersectionObserver.observe(container);

    // Cleanup
    return () => {
      isDisposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      unsubscribeState();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      if (mixer) mixer.stopAllAction();

      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mode, interactive, onLoaded]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center text-xs text-orange-500 p-2 ${className}`}>
        <span>3D Hero</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
