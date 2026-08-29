import bpy
import math
import os
import shutil

print("--- TESTING CLEAR FRONT-FACING ARM GESTURES ---")
mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# Setup Camera
if "WaveCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("WaveCam")
    cam_data.lens = 45
    cam_obj = bpy.data.objects.new("WaveCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["WaveCam"]

bpy.context.scene.camera = cam_obj
cam_obj.location = (0.0, -2.5, 0.15)
cam_obj.rotation_euler = (math.radians(88), 0, 0)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 4
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.image_settings.file_format = 'PNG'

output_dir = os.path.join(os.getcwd(), "3d-hero", "documentation", "proofs")
os.makedirs(output_dir, exist_ok=True)
artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\5acac303-c777-4512-af36-e68bc4351c3a"

def reset_all():
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'XYZ'
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
    if mesh_obj.data.shape_keys:
        for kb in mesh_obj.data.shape_keys.key_blocks:
            kb.value = 0.0

# 1. Clear Wave (Character Left Arm, Screen Left -X) Raised High & Waving to Camera
reset_all()
pb_uarm_l = arm_obj.pose.bones["UpperArm.L"]
pb_farm_l = arm_obj.pose.bones["Forearm.L"]
pb_hand_l = arm_obj.pose.bones["Hand.L"]

# Raise arm to side and up, bend forearm toward head
pb_uarm_l.rotation_euler = (math.radians(20), math.radians(-70), math.radians(45))
pb_farm_l.rotation_euler = (math.radians(-60), 0, math.radians(30))
pb_hand_l.rotation_euler = (0, 0, math.radians(25))

p_wave_l = os.path.join(output_dir, "proof_arm_wave_left.png")
scene.render.filepath = p_wave_l
bpy.ops.render.render(write_still=True)
shutil.copy(p_wave_l, os.path.join(artifact_dir, "proof_arm_wave_left.png"))
print("Rendered proof_arm_wave_left.png")

# 2. Clear Wave (Character Right Arm, Screen Right +X) Raised High & Waving to Camera
reset_all()
pb_uarm_r = arm_obj.pose.bones["UpperArm.R"]
pb_farm_r = arm_obj.pose.bones["Forearm.R"]
pb_hand_r = arm_obj.pose.bones["Hand.R"]

pb_uarm_r.rotation_euler = (math.radians(20), math.radians(70), math.radians(-45))
pb_farm_r.rotation_euler = (math.radians(-60), 0, math.radians(-30))
pb_hand_r.rotation_euler = (0, 0, math.radians(-25))

p_wave_r = os.path.join(output_dir, "proof_arm_wave_right.png")
scene.render.filepath = p_wave_r
bpy.ops.render.render(write_still=True)
shutil.copy(p_wave_r, os.path.join(artifact_dir, "proof_arm_wave_right.png"))
print("Rendered proof_arm_wave_right.png")

# 3. Double High-Five / Victory Celebration (BOTH arms high in V shape)
reset_all()
arm_obj.pose.bones["Root"].location = (0, 0, 0.10)
pb_uarm_l.rotation_euler = (math.radians(15), math.radians(-85), math.radians(60))
pb_farm_l.rotation_euler = (math.radians(-30), 0, math.radians(20))
pb_uarm_r.rotation_euler = (math.radians(15), math.radians(85), math.radians(-60))
pb_farm_r.rotation_euler = (math.radians(-30), 0, math.radians(-20))

p_vic = os.path.join(output_dir, "proof_victory_both_arms.png")
scene.render.filepath = p_vic
bpy.ops.render.render(write_still=True)
shutil.copy(p_vic, os.path.join(artifact_dir, "proof_victory_both_arms.png"))
print("Rendered proof_victory_both_arms.png")

print("ALL FRONT-FACING ARM PROOFS COMPLETE!")
