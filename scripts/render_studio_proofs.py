import bpy
import math
import os
import shutil

print("=================================================================")
print("PRODUCING FULL VISUAL PROOF SUITE WITH STUDIO LIGHTING")
print("=================================================================")

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# Ensure Studio Lighting
def setup_lighting():
    for name in ["KeyLight", "FillLight", "RimLight"]:
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
            
    key_d = bpy.data.lights.new("KeyLight", 'AREA')
    key_d.energy = 800
    key_d.size = 2.0
    key_obj = bpy.data.objects.new("KeyLight", key_d)
    key_obj.location = (1.5, -2.0, 1.5)
    bpy.context.scene.collection.objects.link(key_obj)

    fill_d = bpy.data.lights.new("FillLight", 'AREA')
    fill_d.energy = 400
    fill_d.size = 2.5
    fill_obj = bpy.data.objects.new("FillLight", fill_d)
    fill_obj.location = (-1.5, -1.8, 1.0)
    bpy.context.scene.collection.objects.link(fill_obj)

    rim_d = bpy.data.lights.new("RimLight", 'SUN')
    rim_d.energy = 3.0
    rim_obj = bpy.data.objects.new("RimLight", rim_d)
    rim_obj.location = (0.0, 2.0, 2.0)
    rim_obj.rotation_euler = (math.radians(-45), 0, 0)
    bpy.context.scene.collection.objects.link(rim_obj)

setup_lighting()

# Camera
if "StudioCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("StudioCam")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("StudioCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["StudioCam"]

bpy.context.scene.camera = cam_obj

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

# 1. Full Body Idle Pose
reset_all()
cam_obj.location = (0.0, -2.6, 0.1)
cam_obj.rotation_euler = (math.radians(88), 0, 0)
p1 = os.path.join(output_dir, "proof_01_idle_studio.png")
scene.render.filepath = p1
bpy.ops.render.render(write_still=True)
shutil.copy(p1, os.path.join(artifact_dir, "proof_01_idle_studio.png"))
print("Rendered proof_01_idle_studio.png")

# 2. Wave Pose (Right hand raised high in air)
reset_all()
arm_obj.pose.bones["UpperArm.R"].rotation_euler = (math.radians(95), math.radians(20), math.radians(65))
arm_obj.pose.bones["Forearm.R"].rotation_euler = (math.radians(45), 0, math.radians(35))
arm_obj.pose.bones["Hand.R"].rotation_euler = (0, 0, math.radians(-30))
p2 = os.path.join(output_dir, "proof_02_wave_studio.png")
scene.render.filepath = p2
bpy.ops.render.render(write_still=True)
shutil.copy(p2, os.path.join(artifact_dir, "proof_02_wave_studio.png"))
print("Rendered proof_02_wave_studio.png")

# 3. Success Pose (Both arms raised high in victory V)
reset_all()
arm_obj.pose.bones["Root"].location = (0, 0, 0.12)
arm_obj.pose.bones["UpperArm.L"].rotation_euler = (math.radians(115), math.radians(-20), math.radians(-55))
arm_obj.pose.bones["Forearm.L"].rotation_euler = (math.radians(30), 0, math.radians(-20))
arm_obj.pose.bones["UpperArm.R"].rotation_euler = (math.radians(115), math.radians(20), math.radians(55))
arm_obj.pose.bones["Forearm.R"].rotation_euler = (math.radians(30), 0, math.radians(20))
p3 = os.path.join(output_dir, "proof_03_success_studio.png")
scene.render.filepath = p3
bpy.ops.render.render(write_still=True)
shutil.copy(p3, os.path.join(artifact_dir, "proof_03_success_studio.png"))
print("Rendered proof_03_success_studio.png")

# 4. Point Pose (Right arm pointing forward)
reset_all()
arm_obj.pose.bones["UpperArm.R"].rotation_euler = (math.radians(85), 0, math.radians(15))
arm_obj.pose.bones["Forearm.R"].rotation_euler = (math.radians(15), 0, 0)
arm_obj.pose.bones["Hand.R"].rotation_euler = (math.radians(10), 0, math.radians(-10))
p4 = os.path.join(output_dir, "proof_04_point_studio.png")
scene.render.filepath = p4
bpy.ops.render.render(write_still=True)
shutil.copy(p4, os.path.join(artifact_dir, "proof_04_point_studio.png"))
print("Rendered proof_04_point_studio.png")

# 5. Face Close-up: Smile & Eyes Open
reset_all()
cam_obj.location = (0.0, -1.35, 0.65)
cam_obj.rotation_euler = (math.radians(88), 0, 0)
if mesh_obj.data.shape_keys and "Smile" in mesh_obj.data.shape_keys.key_blocks:
    mesh_obj.data.shape_keys.key_blocks["Smile"].value = 1.0
p5 = os.path.join(output_dir, "proof_05_face_smile.png")
scene.render.filepath = p5
bpy.ops.render.render(write_still=True)
shutil.copy(p5, os.path.join(artifact_dir, "proof_05_face_smile.png"))
print("Rendered proof_05_face_smile.png")

# 6. Face Close-up: Speaking Mouth Open
reset_all()
if mesh_obj.data.shape_keys and "Speaking" in mesh_obj.data.shape_keys.key_blocks:
    mesh_obj.data.shape_keys.key_blocks["Speaking"].value = 1.0
p6 = os.path.join(output_dir, "proof_06_face_speaking.png")
scene.render.filepath = p6
bpy.ops.render.render(write_still=True)
shutil.copy(p6, os.path.join(artifact_dir, "proof_06_face_speaking.png"))
print("Rendered proof_06_face_speaking.png")

print("ALL STUDIO PROOFS COMPLETE!")
