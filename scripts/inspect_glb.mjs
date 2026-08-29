import fs from 'fs';
import path from 'path';

const GLB_PATH = 'D:\\1ca72277-85b2-4773-9976-f5c63285ff2d.glb';

function inspectGlb() {
  console.log(`Checking GLB file at: ${GLB_PATH}`);
  if (!fs.existsSync(GLB_PATH)) {
    console.error(`File not found: ${GLB_PATH}`);
    return;
  }

  const stat = fs.statSync(GLB_PATH);
  console.log(`File Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);

  const fd = fs.openSync(GLB_PATH, 'r');
  const headerBuf = Buffer.alloc(12);
  fs.readSync(fd, headerBuf, 0, 12, 0);

  const magic = headerBuf.toString('utf8', 0, 4);
  const version = headerBuf.readUInt32LE(4);
  const length = headerBuf.readUInt32LE(8);

  console.log(`Magic: ${magic}, Version: ${version}, Total Length: ${length}`);
  if (magic !== 'glTF') {
    console.error('Not a valid glTF/GLB file!');
    fs.closeSync(fd);
    return;
  }

  // Read first chunk (JSON chunk)
  const chunkHeader = Buffer.alloc(8);
  fs.readSync(fd, chunkHeader, 0, 8, 12);
  const chunkLength = chunkHeader.readUInt32LE(0);
  const chunkType = chunkHeader.readUInt32LE(4); // 0x4E4F534A = JSON

  console.log(`JSON Chunk Length: ${chunkLength}, Chunk Type: 0x${chunkType.toString(16)}`);

  const jsonBuf = Buffer.alloc(chunkLength);
  fs.readSync(fd, jsonBuf, 0, chunkLength, 20);
  fs.closeSync(fd);

  const jsonStr = jsonBuf.toString('utf8');
  const gltf = JSON.parse(jsonStr);

  console.log('--- GLB METRICS ---');
  console.log('Asset:', gltf.asset);
  console.log('Scenes count:', gltf.scenes?.length || 0);
  console.log('Nodes count:', gltf.nodes?.length || 0);
  console.log('Meshes count:', gltf.meshes?.length || 0);
  console.log('Materials count:', gltf.materials?.length || 0);
  console.log('Textures count:', gltf.textures?.length || 0);
  console.log('Images count:', gltf.images?.length || 0);
  console.log('Skins count:', gltf.skins?.length || 0);
  console.log('Animations count:', gltf.animations?.length || 0);
  console.log('Cameras count:', gltf.cameras?.length || 0);

  // Write full inspection JSON to inspect_output.json for analysis
  fs.writeFileSync('scripts/inspect_output.json', JSON.stringify({
    fileSize: stat.size,
    asset: gltf.asset,
    scenes: gltf.scenes,
    nodes: gltf.nodes,
    meshes: gltf.meshes,
    materials: gltf.materials,
    textures: gltf.textures,
    images: gltf.images?.map((img, i) => ({ index: i, name: img.name, mimeType: img.mimeType })),
    skins: gltf.skins,
    animations: gltf.animations?.map(a => ({
      name: a.name,
      channelsCount: a.channels?.length,
      samplersCount: a.samplers?.length,
      channels: a.channels
    })),
    extensionsUsed: gltf.extensionsUsed,
    extensionsRequired: gltf.extensionsRequired
  }, null, 2));

  console.log('Saved detailed gltf structure to scripts/inspect_output.json');
}

inspectGlb();
