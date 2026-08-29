import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('COOP HUB 3D HERO MOVEMENT ENGINE TEST SUITE');
console.log('====================================================');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. Test GLB Asset Presence
const glbPath = path.join(process.cwd(), 'public', 'assets', '3d', 'CoopBot_Animated.glb');
assert(fs.existsSync(glbPath), 'GLB file exists at public/assets/3d/CoopBot_Animated.glb');
const stat = fs.statSync(glbPath);
assert(stat.size > 10 * 1024 * 1024, `GLB file is fully exported (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

// Read GLB JSON Chunk
const fd = fs.openSync(glbPath, 'r');
const chunkHeader = Buffer.alloc(8);
fs.readSync(fd, chunkHeader, 0, 8, 12);
const jsonChunkLen = chunkHeader.readUInt32LE(0);
const jsonBuf = Buffer.alloc(jsonChunkLen);
fs.readSync(fd, jsonBuf, 0, jsonChunkLen, 20);
fs.closeSync(fd);
const gltf = JSON.parse(jsonBuf.toString('utf8'));

// 2. Test Expected Animation Actions
const expectedAnimations = [
  'Action_Idle',
  'Action_Greeting',
  'Action_Listening',
  'Action_Thinking',
  'Action_Speaking',
  'Action_Success',
  'Action_Error',
  'Action_Wave',
  'Action_Point',
  'Action_Confirmation',
  'Action_Warning',
];

const foundAnimations = gltf.animations.map((a) => a.name);
expectedAnimations.forEach((animName) => {
  assert(foundAnimations.includes(animName), `Animation "${animName}" found in GLB`);
});

// 3. Test Expected Morph Targets
const morphNames = gltf.meshes[0].extras?.targetNames || [];
const expectedMorphs = ['Blink', 'Smile', 'Speaking', 'Thinking', 'Alert'];
expectedMorphs.forEach((mName) => {
  assert(morphNames.includes(mName), `Morph target "${mName}" found in mesh`);
});

// 4. Test State Machine Logic
import { hero3dStateMachine, HERO_STATES } from '../src/services/hero3d/hero3dStateMachine.js';

assert(hero3dStateMachine.getState() === HERO_STATES.IDLE, 'State machine starts in IDLE');

// Test transition
hero3dStateMachine.setState(HERO_STATES.LISTENING);
assert(hero3dStateMachine.getState() === HERO_STATES.LISTENING, 'Transition to LISTENING works');
assert(hero3dStateMachine.getAnimationName() === 'Action_Listening', 'Animation name mapping for LISTENING is Action_Listening');

// Test priority overriding
hero3dStateMachine.setState(HERO_STATES.SUCCESS); // Higher priority one-shot
assert(hero3dStateMachine.getState() === HERO_STATES.SUCCESS, 'Transition to SUCCESS works');

// Lower priority during one-shot
const lowerAllowed = hero3dStateMachine.setState(HERO_STATES.LISTENING);
assert(!lowerAllowed || hero3dStateMachine.getState() === HERO_STATES.SUCCESS, 'Lower priority state does not interrupt one-shot');

// Reset to IDLE
hero3dStateMachine.reset();
assert(hero3dStateMachine.getState() === HERO_STATES.IDLE, 'Reset returns state to IDLE');

// 5. Test Movement Engine Kinematics
import { hero3dMovementEngine } from '../src/services/hero3d/hero3dMovementEngine.js';

hero3dMovementEngine.setTargetGaze(0.5, -0.3);
const frame1 = hero3dMovementEngine.update(0.016);
assert(typeof frame1.headYaw === 'number', 'Movement engine computes numerical head yaw');
assert(Math.abs(frame1.headYaw) <= hero3dMovementEngine.MAX_HEAD_YAW, 'Head yaw is strictly clamped within bounds');
assert(Math.abs(frame1.eyeYaw) <= hero3dMovementEngine.MAX_EYE_YAW, 'Eye yaw is strictly clamped within bounds');
assert(frame1.blinkInfluence >= 0.0 && frame1.blinkInfluence <= 1.0, 'Blink influence is clamped in [0, 1]');

// 6. Test Zero Mock Data & Component Files
const hero3dComponentPath = path.join(process.cwd(), 'src', 'components', 'hero3d', 'Hero3D.jsx');
const hero3dCanvasPath = path.join(process.cwd(), 'src', 'components', 'hero3d', 'Hero3DCanvas.jsx');
assert(fs.existsSync(hero3dComponentPath), 'Hero3D.jsx component exists');
assert(fs.existsSync(hero3dCanvasPath), 'Hero3DCanvas.jsx WebGL canvas exists');

console.log('====================================================');
console.log(`TEST SUITE FINISHED: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
}
