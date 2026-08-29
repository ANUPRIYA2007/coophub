import bpy
import bmesh
import math
import os
import shutil

print("=================================================================")
print("FREEING ARMS AND HANDS FROM POCKET TOPOLOGY")
print("=================================================================")

if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

bpy.context.view_layer.objects.active = mesh_obj

bm = bmesh.new()
bm.from_mesh(mesh_obj.data)
bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.faces.ensure_lookup_table()

# 1. Identify Right Arm Vertices (x > 0.205, -0.25 < z < 0.44)
arm_r_verts = set(v for v in bm.verts if v.co.x > 0.205 and -0.25 < v.co.z < 0.44)
arm_l_verts = set(v for v in bm.verts if v.co.x < -0.205 and -0.25 < v.co.z < 0.44)

# Find boundary edges connecting arm to torso/pockets
edges_to_split = []
for v in arm_r_verts:
    for e in v.link_edges:
        other = e.other_vert(v)
        if other not in arm_r_verts:
            edges_to_split.append(e)

for v in arm_l_verts:
    for e in v.link_edges:
        other = e.other_vert(v)
        if other not in arm_l_verts:
            edges_to_split.append(e)

print(f"Splitting {len(edges_to_split)} boundary edges connecting arms to body...")
# Split boundary edges
res = bmesh.ops.split_edges(bm, edges=list(set(edges_to_split)))
bm.to_mesh(mesh_obj.data)
bm.free()

mesh_obj.data.update()
print("Mesh updated after edge split!")

# 2. Re-assign Vertex Weights with 100% Clean Authority
vg_uarm_r = mesh_obj.vertex_groups.get("UpperArm.R")
vg_farm_r = mesh_obj.vertex_groups.get("Forearm.R")
vg_hand_r = mesh_obj.vertex_groups.get("Hand.R")

vg_uarm_l = mesh_obj.vertex_groups.get("UpperArm.L")
vg_farm_l = mesh_obj.vertex_groups.get("Forearm.L")
vg_hand_l = mesh_obj.vertex_groups.get("Hand.L")

vg_hips = mesh_obj.vertex_groups.get("Hips")
vg_spine = mesh_obj.vertex_groups.get("Spine")
vg_chest = mesh_obj.vertex_groups.get("Chest")
vg_thigh_r = mesh_obj.vertex_groups.get("Thigh.R")
vg_thigh_l = mesh_obj.vertex_groups.get("Thigh.L")

# Clear body weights from arm vertices and assign arm weights
for i, v in enumerate(mesh_obj.data.vertices):
    x, y, z = v.co

    # RIGHT ARM
    if x > 0.205 and -0.25 < z < 0.44:
        if vg_hips: vg_hips.remove([i])
        if vg_spine: vg_spine.remove([i])
        if vg_thigh_r: vg_thigh_r.remove([i])
        if vg_chest: vg_chest.remove([i])

        if z < -0.02: # Hand & Wrist
            vg_hand_r.add([i], 1.0, 'REPLACE')
            vg_farm_r.add([i], 0.0, 'REPLACE')
            vg_uarm_r.add([i], 0.0, 'REPLACE')
        elif -0.02 <= z < 0.18: # Forearm
            t = (z + 0.02) / 0.20
            vg_hand_r.add([i], (1.0 - t) * 0.3, 'REPLACE')
            vg_farm_r.add([i], 1.0 - (1.0 - t) * 0.3, 'REPLACE')
            vg_uarm_r.add([i], t * 0.3, 'ADD')
        else: # UpperArm
            t = (z - 0.18) / 0.26
            vg_farm_r.add([i], (1.0 - t) * 0.3, 'REPLACE')
            vg_uarm_r.add([i], 1.0 - (1.0 - t) * 0.3, 'REPLACE')

    # LEFT ARM
    if x < -0.205 and -0.25 < z < 0.44:
        if vg_hips: vg_hips.remove([i])
        if vg_spine: vg_spine.remove([i])
        if vg_thigh_l: vg_thigh_l.remove([i])
        if vg_chest: vg_chest.remove([i])

        if z < -0.02: # Hand & Wrist
            vg_hand_l.add([i], 1.0, 'REPLACE')
            vg_farm_l.add([i], 0.0, 'REPLACE')
            vg_uarm_l.add([i], 0.0, 'REPLACE')
        elif -0.02 <= z < 0.18: # Forearm
            t = (z + 0.02) / 0.20
            vg_hand_l.add([i], (1.0 - t) * 0.3, 'REPLACE')
            vg_farm_l.add([i], 1.0 - (1.0 - t) * 0.3, 'REPLACE')
            vg_uarm_l.add([i], t * 0.3, 'ADD')
        else: # UpperArm
            t = (z - 0.18) / 0.26
            vg_farm_l.add([i], (1.0 - t) * 0.3, 'REPLACE')
            vg_uarm_l.add([i], 1.0 - (1.0 - t) * 0.3, 'REPLACE')

print("Weights re-assigned cleanly after edge split!")

# Save blend file
blend_path = os.path.join(os.getcwd(), "3d-hero", "CoopBot_3D_Hero.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Saved blend file.")

# 3. Test Render: Wave Pose (Right hand raised high in air)
for pb in arm_obj.pose.bones:
    pb.rotation_mode = 'XYZ'
    pb.location = (0, 0, 0)
    pb.rotation_euler = (0, 0, 0)

pb_uarm_r = arm_obj.pose.bones["UpperArm.R"]
pb_farm_r = arm_obj.pose.bones["Forearm.R"]
pb_hand_r = arm_obj.pose.bones["Hand.R"]

pb_uarm_r.rotation_euler = (math.radians(95), math.radians(20), math.radians(65))
pb_farm_r.rotation_euler = (math.radians(45), 0, math.radians(35))
pb_hand_r.rotation_euler = (0, 0, math.radians(-30))

# Setup Camera
if "TestCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("TestCam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("TestCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["TestCam"]

bpy.context.scene.camera = cam_obj
cam_obj.location = (0.0, -2.5, 0.15)
cam_obj.rotation_euler = (math.radians(88), 0, 0)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 4

out_still = os.path.join(os.getcwd(), "3d-hero", "documentation", "proofs", "proof_freed_hand_wave.png")
scene.render.filepath = out_still
scene.render.image_settings.file_format = 'PNG'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
bpy.ops.render.render(write_still=True)

artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\5acac303-c777-4512-af36-e68bc4351c3a"
shutil.copy(out_still, os.path.join(artifact_dir, "proof_freed_hand_wave.png"))
print(f"Rendered proof: {out_still}")
