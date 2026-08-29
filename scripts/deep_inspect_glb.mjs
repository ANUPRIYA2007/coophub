import fs from 'fs';

const GLB_PATH = 'D:\\1ca72277-85b2-4773-9976-f5c63285ff2d.glb';

function deepInspect() {
  const fd = fs.openSync(GLB_PATH, 'r');
  const headerBuf = Buffer.alloc(12);
  fs.readSync(fd, headerBuf, 0, 12, 0);

  const chunkHeader = Buffer.alloc(8);
  fs.readSync(fd, chunkHeader, 0, 8, 12);
  const jsonChunkLen = chunkHeader.readUInt32LE(0);

  const jsonBuf = Buffer.alloc(jsonChunkLen);
  fs.readSync(fd, jsonBuf, 0, jsonChunkLen, 20);

  const gltf = JSON.parse(jsonBuf.toString('utf8'));

  // Read BIN chunk header
  const binHeaderOffset = 20 + jsonChunkLen;
  const binHeader = Buffer.alloc(8);
  fs.readSync(fd, binHeader, 0, 8, binHeaderOffset);
  const binChunkLen = binHeader.readUInt32LE(0);
  const binChunkType = binHeader.readUInt32LE(4); // 0x004E4942 = BIN

  console.log('=== FULL GLTF STRUCTURE ===');
  console.log('Asset:', JSON.stringify(gltf.asset, null, 2));
  console.log('Scenes:', JSON.stringify(gltf.scenes, null, 2));
  console.log('Nodes:', JSON.stringify(gltf.nodes, null, 2));
  console.log('Meshes:', JSON.stringify(gltf.meshes, null, 2));
  console.log('Materials:', JSON.stringify(gltf.materials, null, 2));
  console.log('Textures:', JSON.stringify(gltf.textures, null, 2));
  console.log('Images:', JSON.stringify(gltf.images, null, 2));
  console.log('Samplers:', JSON.stringify(gltf.samplers, null, 2));
  console.log('Accessors:', JSON.stringify(gltf.accessors, null, 2));
  console.log('BufferViews:', JSON.stringify(gltf.bufferViews, null, 2));

  // Compute Triangle count & Bounding box
  if (gltf.meshes && gltf.meshes.length > 0) {
    const mesh = gltf.meshes[0];
    mesh.primitives.forEach((prim, i) => {
      console.log(`\n--- Primitive ${i} ---`);
      console.log('Attributes:', prim.attributes);
      console.log('Mode:', prim.mode ?? 4); // 4 = TRIANGLES
      console.log('Targets (Morph Targets):', prim.targets || 'NONE');

      if (prim.indices !== undefined) {
        const indexAccessor = gltf.accessors[prim.indices];
        console.log(`Indices Count: ${indexAccessor.count}, Triangle Count: ${indexAccessor.count / 3}`);
      }

      if (prim.attributes.POSITION !== undefined) {
        const posAccessor = gltf.accessors[prim.attributes.POSITION];
        console.log(`Vertex Count (POSITION): ${posAccessor.count}`);
        console.log(`Bounding Box Min: [${posAccessor.min.join(', ')}]`);
        console.log(`Bounding Box Max: [${posAccessor.max.join(', ')}]`);
        const sizeX = posAccessor.max[0] - posAccessor.min[0];
        const sizeY = posAccessor.max[1] - posAccessor.min[1];
        const sizeZ = posAccessor.max[2] - posAccessor.min[2];
        console.log(`Dimensions (W x H x D): ${sizeX.toFixed(4)} x ${sizeY.toFixed(4)} x ${sizeZ.toFixed(4)} units`);
      }
    });
  }

  // Inspect embedded image bufferView
  if (gltf.images && gltf.images.length > 0) {
    const img = gltf.images[0];
    if (img.bufferView !== undefined) {
      const bv = gltf.bufferViews[img.bufferView];
      console.log(`\nEmbedded Image bufferView: ${img.bufferView}, ByteLength: ${bv.byteLength}, MIME: ${img.mimeType}`);
      
      const imgBuffer = Buffer.alloc(bv.byteLength);
      const imgOffset = binHeaderOffset + 8 + (bv.byteOffset || 0);
      fs.readSync(fd, imgBuffer, 0, bv.byteLength, imgOffset);

      // Check PNG or JPEG header
      if (imgBuffer[0] === 0x89 && imgBuffer[1] === 0x50 && imgBuffer[2] === 0x4E && imgBuffer[3] === 0x47) {
        const width = imgBuffer.readUInt32BE(16);
        const height = imgBuffer.readUInt32BE(20);
        console.log(`Texture Type: PNG, Dimensions: ${width} x ${height} px`);
      } else if (imgBuffer[0] === 0xFF && imgBuffer[1] === 0xD8) {
        console.log('Texture Type: JPEG');
      }
    }
  }

  fs.closeSync(fd);
}

deepInspect();
