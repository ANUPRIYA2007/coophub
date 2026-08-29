import bpy
import math
import os
import shutil

print("--- TESTING PROOF STILLS WITH ROTATION_MODE = 'XYZ' ---")

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# Set all pose bones to XYZ Euler mode
for pb in arm_obj.pose.bones:
    pb.rotation_mode = 'XYZ'

# Setup Camera
if "ProofCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("ProofCam")
    cam_data.lens = 55
    cam_obj = bpy.data.objects.new("ProofCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["ProofCam"]

bpy.context.scene.camera = cam_obj
cam_obj.location = (0.0, -2.5, 0.2)
cam_obj.rotation_euler = (math.radians(88), 0, 0)

# Studio Lights
if "ProofLight" not in bpy.data.objects:
    light_data = bpy.data.lights.new(name="ProofLight", type='AREA')
    light_data.energy = 500
    light_data.size = 2.0
    light_obj = bpy.data.objects.new(name="ProofLight", object_data=light_data)
    light_obj.location = (1.5, -2.0, 1.8)
    bpy.context.scene.collection.objects.link(light_obj)

output_dir = os.path.join(os.getcwd(), "3d-hero", "documentation", "proofs")
os.makedirs(output_dir, exist_ok=True)
artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\5acac303-c777-4512-af36-e68bc4351c3a"

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 4
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.image_settings.file_format = 'PNG'

def reset_all():
    for pb in arm_obj.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
    if mesh_obj.data.shape_keys:
        for kb in mesh_obj.data.shape_keys.key_blocks:
            kb.value = 0.0

# 1. TEST WAVE (Right hand raised high into the air waving)
reset_all()
pb_uarm_r = arm_obj.pose.bones["UpperArm.R"]
pb_farm_r = arm_obj.pose.bones["Forearm.R"]
pb_hand_r = arm_obj.pose.bones["Hand.R"]

pb_uarm_r.rotation_euler = (math.radians(95), math.radians(20), math.radians(65))
pb_farm_r.rotation_euler = (math.radians(45), 0, math.radians(35))
pb_hand_r.rotation_euler = (0, 0, math.radians(-30))

p_wave = os.path.join(output_dir, "proof_01_wave.png")
scene.render.filepath = p_wave
bpy.ops.render.render(write_still=True)
shutil.copy(p_wave, os.path.join(artifact_dir, "proof_01_wave.png"))
print("Rendered proof_01_wave.png")

# 2. TEST POINT (Right arm extended straight forward pointing)
reset_all()
pb_uarm_r.rotation_euler = (math.radians(85), 0, math.radians(15))
pb_farm_r.rotation_euler = (math.radians(15), 0, 0)
pb_hand_r.rotation_euler = (math.radians(10), 0, math.radians(-10))

p_point = os.path.join(output_dir, "proof_02_point.png")
scene.render.filepath = p_point
bpy.ops.render.render(write_still=True)
shutil.copy(p_point, os.path.join(artifact_dir, "proof_02_point.png"))
print("Rendered proof_02_point.png")

# 3. TEST SUCCESS (BOTH arms raised high in victory V-pose)
reset_all()
pb_uarm_l = arm_obj.pose.bones["UpperArm.L"]
pb_farm_l = arm_obj.pose.bones["Forearm.L"]

pb_uarm_l.rotation_euler = (math.radians(115), math.radians(-20), math.radians(-55))
pb_farm_l.rotation_euler = (math.radians(30), 0, math.radians(-20))
pb_uarm_r.rotation_euler = (math.radians(115), math.radians(20), math.radians(55))
pb_farm_r.rotation_euler = (math.radians(30), 0, math.radians(20))
mesh_obj.data.shape_keys.key_blocks["Smile"].value = 1.0

p_success = os.path.join(output_dir, "proof_03_success.png")
scene.render.filepath = p_success
bpy.ops.render.render(write_still=True)
shutil.copy(p_success, os.path.join(artifact_dir, "proof_03_success.png"))
print("Rendered proof_03_success.png")

# 4. TEST BLINK (Eyes fully closed on visor)
reset_all()
# Move camera close to face
cam_obj.location = (0.0, -1.3, 0.65)
cam_obj.rotation_euler = (math.radians(88), 0, 0)
mesh_obj.data.shape_keys.key_blocks["Blink"].value = 1.0

p_blink = os.path.join(output_dir, "proof_04_blink.png")
scene.render.filepath = p_blink
bpy.ops.render.render(write_still=True)
shutil.copy(p_blink, os.path.join(artifact_dir, "proof_04_blink.png"))
print("Rendered proof_04_blink.png")

# 5. TEST SPEAKING (Mouth dropped open speaking)
reset_all()
mesh_obj.data.shape_keys.key_blocks["Speaking"].value = 1.0

p_speak = os.path.join(output_dir, "proof_05_speaking.png")
scene.render.filepath = p_speak
bpy.ops.render.render(write_still=True)
shutil.copy(p_speak, os.path.join(artifact_dir, "proof_05_speaking.png"))
print("Rendered proof_05_speaking.png")

# 6. TEST EYE TRACKING LOOK LEFT
reset_all()
arm_obj.pose.bones["Eye_L"].rotation_euler = (0, 0, math.radians(25))
arm_obj.pose.bones["Eye_R"].rotation_euler = (0, 0, math.radians(25))

p_eye_l = os.path.join(output_dir, "proof_06_eye_left.png")
scene.render.filepath = p_eye_l
bpy.ops.render.render(write_still=True)
shutil.copy(p_eye_l, os.path.join(artifact_dir, "proof_06_eye_left.png"))
print("Rendered proof_06_eye_left.png")

print("ALL PROOFS RENDERED SUCCESSFULLY!")
