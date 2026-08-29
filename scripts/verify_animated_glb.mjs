import fs from 'fs';

const EXPORT_GLB = '3d-hero/exports/CoopBot_Animated.glb';

function verifyExport() {
  const stat = fs.statSync(EXPORT_GLB);
  console.log(`Exported GLB Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);

  const fd = fs.openSync(EXPORT_GLB, 'r');
  const headerBuf = Buffer.alloc(12);
  fs.readSync(fd, headerBuf, 0, 12, 0);

  const chunkHeader = Buffer.alloc(8);
  fs.readSync(fd, chunkHeader, 0, 8, 12);
  const jsonChunkLen = chunkHeader.readUInt32LE(0);

  const jsonBuf = Buffer.alloc(jsonChunkLen);
  fs.readSync(fd, jsonBuf, 0, jsonChunkLen, 20);
  fs.closeSync(fd);

  const gltf = JSON.parse(jsonBuf.toString('utf8'));

  console.log('=== EXPORTED GLB METRICS ===');
  console.log('Scenes count:', gltf.scenes?.length);
  console.log('Nodes count:', gltf.nodes?.length);
  console.log('Skins count:', gltf.skins?.length);
  if (gltf.skins && gltf.skins.length > 0) {
    console.log('Joints in Skin:', gltf.skins[0].joints.length);
    const jointNames = gltf.skins[0].joints.map(jIdx => gltf.nodes[jIdx].name);
    console.log('Joint Names:', jointNames);
  }

  console.log('\nAnimations Count:', gltf.animations?.length);
  if (gltf.animations) {
    gltf.animations.forEach((anim, i) => {
      console.log(`Animation [${i + 1}]: "${anim.name}", Channels: ${anim.channels?.length}, Samplers: ${anim.samplers?.length}`);
    });
  }

  console.log('\nMeshes Count:', gltf.meshes?.length);
  if (gltf.meshes) {
    gltf.meshes.forEach((m, i) => {
      console.log(`Mesh [${i}]: "${m.name}", Primitives: ${m.primitives.length}`);
      if (m.primitives[0].targets) {
        console.log(`Morph Targets Count: ${m.primitives[0].targets.length}`);
      }
      if (m.extras?.targetNames) {
        console.log(`Morph Target Names:`, m.extras.targetNames);
      }
    });
  }

  console.log('\nMaterials Count:', gltf.materials?.length);
  console.log('Textures Count:', gltf.textures?.length);
  console.log('Images Count:', gltf.images?.length);
}

verifyExport();
