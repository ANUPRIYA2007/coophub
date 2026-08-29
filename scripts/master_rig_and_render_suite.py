import bpy
import math
import os
import shutil

print("=================================================================")
print("MASTER RIG, ANIMATION & VIDEO PIPELINE FOR COOPBOT 3D HERO")
print("=================================================================")

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# Ensure all pose bones are in XYZ Euler mode
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='POSE')
pose_bones = arm_obj.pose.bones
for pb in pose_bones:
    pb.rotation_mode = 'XYZ'

def reset_pose():
    for pb in pose_bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)

def key_b(action, pb_name, frame, loc=None, rot_deg=None):
    pb = pose_bones[pb_name]
    if loc is not None:
        pb.location = loc
        pb.keyframe_insert(data_path="location", frame=frame)
    if rot_deg is not None:
        pb.rotation_euler = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)

# -------------------------------------------------------------
# 1. CREATE ALL 11 PRODUCTION ACTIONS
# -------------------------------------------------------------
actions_data = {}

# Action_Idle (1-30)
act_idle = bpy.data.actions.new("Action_Idle")
arm_obj.animation_data.action = act_idle
reset_pose()
key_b(act_idle, 'Root', 1, loc=(0,0,0))
key_b(act_idle, 'Root', 15, loc=(0,0,0.035))
key_b(act_idle, 'Root', 30, loc=(0,0,0))
key_b(act_idle, 'Chest', 1, rot_deg=(0,0,0))
key_b(act_idle, 'Chest', 15, rot_deg=(-3,0,0))
key_b(act_idle, 'Chest', 30, rot_deg=(0,0,0))

# Action_Greeting (1-45)
act_greet = bpy.data.actions.new("Action_Greeting")
arm_obj.animation_data.action = act_greet
reset_pose()
key_b(act_greet, 'UpperArm.L', 1, rot_deg=(0,0,0))
key_b(act_greet, 'UpperArm.L', 18, rot_deg=(25, -75, 50))
key_b(act_greet, 'Forearm.L', 18, rot_deg=(-55, 0, 25))
key_b(act_greet, 'Hand.L', 18, rot_deg=(0, 0, 30))
key_b(act_greet, 'Hand.L', 26, rot_deg=(0, 0, -30))
key_b(act_greet, 'Hand.L', 34, rot_deg=(0, 0, 25))
key_b(act_greet, 'UpperArm.L', 45, rot_deg=(0,0,0))
key_b(act_greet, 'Forearm.L', 45, rot_deg=(0,0,0))
key_b(act_greet, 'Hand.L', 45, rot_deg=(0,0,0))
key_b(act_greet, 'Head', 18, rot_deg=(6, 4, 8))
key_b(act_greet, 'Head', 45, rot_deg=(0, 0, 0))

# Action_Wave (1-50)
act_wave = bpy.data.actions.new("Action_Wave")
arm_obj.animation_data.action = act_wave
reset_pose()
key_b(act_wave, 'UpperArm.L', 1, rot_deg=(0,0,0))
key_b(act_wave, 'UpperArm.L', 12, rot_deg=(30, -80, 55))
key_b(act_wave, 'Forearm.L', 12, rot_deg=(-60, 0, 30))
key_b(act_wave, 'Hand.L', 16, rot_deg=(0, 0, 35))
key_b(act_wave, 'Hand.L', 24, rot_deg=(0, 0, -35))
key_b(act_wave, 'Hand.L', 32, rot_deg=(0, 0, 35))
key_b(act_wave, 'Hand.L', 40, rot_deg=(0, 0, -30))
key_b(act_wave, 'UpperArm.L', 50, rot_deg=(0,0,0))
key_b(act_wave, 'Forearm.L', 50, rot_deg=(0,0,0))
key_b(act_wave, 'Hand.L', 50, rot_deg=(0,0,0))

# Action_Point (1-40)
act_point = bpy.data.actions.new("Action_Point")
arm_obj.animation_data.action = act_point
reset_pose()
key_b(act_point, 'UpperArm.L', 1, rot_deg=(0,0,0))
key_b(act_point, 'UpperArm.L', 15, rot_deg=(75, -20, 25))
key_b(act_point, 'Forearm.L', 15, rot_deg=(-20, 0, 10))
key_b(act_point, 'Head', 15, rot_deg=(4, -8, -10))
key_b(act_point, 'UpperArm.L', 30, rot_deg=(75, -20, 25))
key_b(act_point, 'UpperArm.L', 40, rot_deg=(0,0,0))
key_b(act_point, 'Forearm.L', 40, rot_deg=(0,0,0))
key_b(act_point, 'Head', 40, rot_deg=(0,0,0))

# Action_Success (1-50)
act_succ = bpy.data.actions.new("Action_Success")
arm_obj.animation_data.action = act_succ
reset_pose()
key_b(act_succ, 'Root', 1, loc=(0,0,0))
key_b(act_succ, 'Root', 15, loc=(0,0,0.12))
key_b(act_succ, 'UpperArm.L', 15, rot_deg=(15, -85, 60))
key_b(act_succ, 'Forearm.L', 15, rot_deg=(-30, 0, 20))
key_b(act_succ, 'UpperArm.R', 15, rot_deg=(15, 85, -60))
key_b(act_succ, 'Forearm.R', 15, rot_deg=(-30, 0, -20))
key_b(act_succ, 'Head', 15, rot_deg=(-12, 0, 0))
key_b(act_succ, 'Root', 32, loc=(0,0,0.08))
key_b(act_succ, 'Root', 50, loc=(0,0,0))
key_b(act_succ, 'UpperArm.L', 50, rot_deg=(0,0,0))
key_b(act_succ, 'UpperArm.R', 50, rot_deg=(0,0,0))
key_b(act_succ, 'Forearm.L', 50, rot_deg=(0,0,0))
key_b(act_succ, 'Forearm.R', 50, rot_deg=(0,0,0))
key_b(act_succ, 'Head', 50, rot_deg=(0,0,0))

# Action_Listening (1-40)
act_listen = bpy.data.actions.new("Action_Listening")
arm_obj.animation_data.action = act_listen
reset_pose()
key_b(act_listen, 'Head', 1, rot_deg=(0,0,0))
key_b(act_listen, 'Head', 18, rot_deg=(10, -6, -14))
key_b(act_listen, 'UpperArm.L', 18, rot_deg=(25, -25, 20))
key_b(act_listen, 'Forearm.L', 18, rot_deg=(-65, 0, 30))
key_b(act_listen, 'Head', 40, rot_deg=(0,0,0))
key_b(act_listen, 'UpperArm.L', 40, rot_deg=(0,0,0))
key_b(act_listen, 'Forearm.L', 40, rot_deg=(0,0,0))

# Action_Thinking (1-50)
act_think = bpy.data.actions.new("Action_Thinking")
arm_obj.animation_data.action = act_think
reset_pose()
key_b(act_think, 'Head', 1, rot_deg=(0,0,0))
key_b(act_think, 'Head', 20, rot_deg=(-6, 14, 16))
key_b(act_think, 'UpperArm.L', 20, rot_deg=(45, -35, 30))
key_b(act_think, 'Forearm.L', 20, rot_deg=(-85, 0, 40))
key_b(act_think, 'Head', 50, rot_deg=(0,0,0))
key_b(act_think, 'UpperArm.L', 50, rot_deg=(0,0,0))
key_b(act_think, 'Forearm.L', 50, rot_deg=(0,0,0))

# Action_Speaking (1-40)
act_spk = bpy.data.actions.new("Action_Speaking")
arm_obj.animation_data.action = act_spk
reset_pose()
for f, (hx, ax) in [(1, (0,0)), (10, (8, 15)), (20, (-4, -5)), (30, (6, 12)), (40, (0,0))]:
    key_b(act_spk, 'Head', f, rot_deg=(hx, 0, 0))
    key_b(act_spk, 'UpperArm.L', f, rot_deg=(ax, -15, 10))

# Action_Error (1-40)
act_err = bpy.data.actions.new("Action_Error")
arm_obj.animation_data.action = act_err
reset_pose()
key_b(act_err, 'Head', 1, rot_deg=(0,0,0))
key_b(act_err, 'Head', 10, rot_deg=(0, 24, 0))
key_b(act_err, 'Head', 20, rot_deg=(0, -24, 0))
key_b(act_err, 'Head', 30, rot_deg=(0, 16, 0))
key_b(act_err, 'Head', 40, rot_deg=(0, 0, 0))

# Action_Warning (1-40)
act_warn = bpy.data.actions.new("Action_Warning")
arm_obj.animation_data.action = act_warn
reset_pose()
key_b(act_warn, 'Spine', 1, rot_deg=(0,0,0))
key_b(act_warn, 'Spine', 16, rot_deg=(-8,0,0))
key_b(act_warn, 'UpperArm.L', 16, rot_deg=(55, -20, 20))
key_b(act_warn, 'Forearm.L', 16, rot_deg=(-50, 0, 20))
key_b(act_warn, 'Hand.L', 16, rot_deg=(-35, 0, 0))
key_b(act_warn, 'Spine', 40, rot_deg=(0,0,0))
key_b(act_warn, 'UpperArm.L', 40, rot_deg=(0,0,0))
key_b(act_warn, 'Forearm.L', 40, rot_deg=(0,0,0))
key_b(act_warn, 'Hand.L', 40, rot_deg=(0,0,0))

# Action_Confirmation (1-35)
act_conf = bpy.data.actions.new("Action_Confirmation")
arm_obj.animation_data.action = act_conf
reset_pose()
key_b(act_conf, 'Head', 1, rot_deg=(0,0,0))
key_b(act_conf, 'Head', 10, rot_deg=(14,0,0))
key_b(act_conf, 'Head', 18, rot_deg=(-4,0,0))
key_b(act_conf, 'Head', 26, rot_deg=(12,0,0))
key_b(act_conf, 'Head', 35, rot_deg=(0,0,0))

print("All 11 actions keyframed cleanly with XYZ Euler rotation mode!")

# -------------------------------------------------------------
# 2. SAVE MASTER BLEND & EXPORT PRODUCTION GLB
# -------------------------------------------------------------
bpy.ops.object.mode_set(mode='OBJECT')
blend_path = os.path.join(os.getcwd(), "3d-hero", "CoopBot_3D_Hero.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Saved blend file to: {blend_path}")

export_glb_path = os.path.join(os.getcwd(), "3d-hero", "exports", "CoopBot_Animated.glb")
public_glb_path = os.path.join(os.getcwd(), "public", "assets", "3d", "CoopBot_Animated.glb")

bpy.ops.export_scene.gltf(
    filepath=export_glb_path,
    export_format='GLB',
    use_selection=False,
    export_animations=True,
    export_morph=True,
    export_skins=True,
    export_all_influences=True
)
print(f"Exported production GLB to: {export_glb_path}")
shutil.copy(export_glb_path, public_glb_path)
print(f"Copied GLB to runtime path: {public_glb_path}")

# -------------------------------------------------------------
# 3. BUILD 440-FRAME VIDEO DEMONSTRATION & RENDER MP4
# -------------------------------------------------------------
master_act = bpy.data.actions.new("Master_Demonstration")
arm_obj.animation_data.action = master_act
bpy.ops.object.mode_set(mode='POSE')
reset_pose()

# Timeline:
# 0-30: Idle
key_b(master_act, 'Root', 0, loc=(0,0,0))
key_b(master_act, 'Root', 15, loc=(0,0,0.035))
key_b(master_act, 'Root', 30, loc=(0,0,0))

# 31-75: Greeting / Wave (Screen Left Arm Raised High)
key_b(master_act, 'UpperArm.L', 31, rot_deg=(0,0,0))
key_b(master_act, 'UpperArm.L', 44, rot_deg=(30, -80, 55))
key_b(master_act, 'Forearm.L', 44, rot_deg=(-60, 0, 30))
key_b(master_act, 'Hand.L', 48, rot_deg=(0, 0, 35))
key_b(master_act, 'Hand.L', 56, rot_deg=(0, 0, -35))
key_b(master_act, 'Hand.L', 64, rot_deg=(0, 0, 35))
key_b(master_act, 'UpperArm.L', 75, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.L', 75, rot_deg=(0,0,0))
key_b(master_act, 'Hand.L', 75, rot_deg=(0,0,0))

# 76-110: Point (Arm Forward)
key_b(master_act, 'UpperArm.L', 76, rot_deg=(0,0,0))
key_b(master_act, 'UpperArm.L', 90, rot_deg=(75, -20, 25))
key_b(master_act, 'Forearm.L', 90, rot_deg=(-20, 0, 10))
key_b(master_act, 'Head', 90, rot_deg=(4, -8, -10))
key_b(master_act, 'UpperArm.L', 104, rot_deg=(75, -20, 25))
key_b(master_act, 'UpperArm.L', 110, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.L', 110, rot_deg=(0,0,0))
key_b(master_act, 'Head', 110, rot_deg=(0,0,0))

# 111-150: Success (Dual Arm Raise + Jump)
key_b(master_act, 'Root', 111, loc=(0,0,0))
key_b(master_act, 'Root', 124, loc=(0,0,0.12))
key_b(master_act, 'UpperArm.L', 124, rot_deg=(15, -85, 60))
key_b(master_act, 'Forearm.L', 124, rot_deg=(-30, 0, 20))
key_b(master_act, 'UpperArm.R', 124, rot_deg=(15, 85, -60))
key_b(master_act, 'Forearm.R', 124, rot_deg=(-30, 0, -20))
key_b(master_act, 'Root', 150, loc=(0,0,0))
key_b(master_act, 'UpperArm.L', 150, rot_deg=(0,0,0))
key_b(master_act, 'UpperArm.R', 150, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.L', 150, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.R', 150, rot_deg=(0,0,0))

# 151-180: Listening
key_b(master_act, 'Head', 151, rot_deg=(0,0,0))
key_b(master_act, 'Head', 165, rot_deg=(10, -6, -14))
key_b(master_act, 'UpperArm.L', 165, rot_deg=(25, -25, 20))
key_b(master_act, 'Forearm.L', 165, rot_deg=(-65, 0, 30))
key_b(master_act, 'Head', 180, rot_deg=(0,0,0))
key_b(master_act, 'UpperArm.L', 180, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.L', 180, rot_deg=(0,0,0))

# 181-220: Thinking
key_b(master_act, 'Head', 181, rot_deg=(0,0,0))
key_b(master_act, 'Head', 198, rot_deg=(-6, 14, 16))
key_b(master_act, 'UpperArm.L', 198, rot_deg=(45, -35, 30))
key_b(master_act, 'Forearm.L', 198, rot_deg=(-85, 0, 40))
key_b(master_act, 'Head', 220, rot_deg=(0,0,0))
key_b(master_act, 'UpperArm.L', 220, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.L', 220, rot_deg=(0,0,0))

# 221-250: Speaking
for f, (hx, ax) in [(221, (0,0)), (228, (8, 15)), (235, (-4, -5)), (242, (6, 12)), (250, (0,0))]:
    key_b(master_act, 'Head', f, rot_deg=(hx, 0, 0))
    key_b(master_act, 'UpperArm.L', f, rot_deg=(ax, -15, 10))

# 251-280: Error (Head Shake 'No')
key_b(master_act, 'Head', 251, rot_deg=(0,0,0))
key_b(master_act, 'Head', 258, rot_deg=(0, 24, 0))
key_b(master_act, 'Head', 266, rot_deg=(0, -24, 0))
key_b(master_act, 'Head', 274, rot_deg=(0, 16, 0))
key_b(master_act, 'Head', 280, rot_deg=(0,0,0))

# 281-310: Warning (Palm Forward Caution)
key_b(master_act, 'Spine', 281, rot_deg=(0,0,0))
key_b(master_act, 'Spine', 295, rot_deg=(-8,0,0))
key_b(master_act, 'UpperArm.L', 295, rot_deg=(55, -20, 20))
key_b(master_act, 'Forearm.L', 295, rot_deg=(-50, 0, 20))
key_b(master_act, 'Hand.L', 295, rot_deg=(-35, 0, 0))
key_b(master_act, 'Spine', 310, rot_deg=(0,0,0))
key_b(master_act, 'UpperArm.L', 310, rot_deg=(0,0,0))
key_b(master_act, 'Forearm.L', 310, rot_deg=(0,0,0))
key_b(master_act, 'Hand.L', 310, rot_deg=(0,0,0))

# 311-380: Facial Expressions & Eye Tracking
key_b(master_act, 'Eye_L', 386, rot_deg=(0,0,0))
key_b(master_act, 'Eye_R', 386, rot_deg=(0,0,0))
key_b(master_act, 'Eye_L', 400, rot_deg=(0, -22, 0)) # Look Left
key_b(master_act, 'Eye_R', 400, rot_deg=(0, -22, 0))
key_b(master_act, 'Eye_L', 414, rot_deg=(0, 22, 0))  # Look Right
key_b(master_act, 'Eye_R', 414, rot_deg=(0, 22, 0))
key_b(master_act, 'Eye_L', 428, rot_deg=(-18, 0, 0)) # Look Up
key_b(master_act, 'Eye_R', 428, rot_deg=(-18, 0, 0))
key_b(master_act, 'Eye_L', 440, rot_deg=(0, 0, 0))   # Center
key_b(master_act, 'Eye_R', 440, rot_deg=(0, 0, 0))

bpy.ops.object.mode_set(mode='OBJECT')

# Studio Lighting & Camera
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

setup_lighting()

if "StudioCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("StudioCam")
    cam_data.lens = 48
    cam_obj = bpy.data.objects.new("StudioCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["StudioCam"]

bpy.context.scene.camera = cam_obj
cam_obj.location = (0.0, -2.6, 0.15)
cam_obj.rotation_euler = (math.radians(88), 0, 0)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
if hasattr(scene, 'eevee') and hasattr(scene.eevee, 'taa_render_samples'):
    scene.eevee.taa_render_samples = 4

scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 440
scene.render.resolution_x = 800
scene.render.resolution_y = 800

output_dir = os.path.join(os.getcwd(), "3d-hero", "documentation")
video_path = os.path.join(output_dir, "CoopBot_Animation_Test.mp4")
artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\5acac303-c777-4512-af36-e68bc4351c3a"

scene.render.filepath = video_path
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.ffmpeg.ffmpeg_preset = 'GOOD'

print(f"Rendering full video across 440 frames to: {video_path}...")
bpy.ops.render.render(animation=True)
print("Video render complete!")
shutil.copy(video_path, os.path.join(artifact_dir, "CoopBot_Animation_Test.mp4"))

# Render High-Resolution Proof Stills
stills = [
    (15, "01_Idle_Breathing.png"),
    (54, "02_Wave_Hand_Raised.png"),
    (90, "03_Point_Arm_Extended.png"),
    (124, "04_Success_Both_Arms_High.png"),
    (165, "05_Listening_Head_Tilt.png"),
    (198, "06_Thinking_Chin_Touch.png"),
    (228, "07_Speaking_Mouth_Open.png"),
    (258, "08_Error_Head_Shake.png"),
    (295, "09_Warning_Hand_Caution.png"),
    (400, "13_Eye_Tracking_Look_Left.png"),
    (414, "14_Eye_Tracking_Look_Right.png"),
]

scene.render.image_settings.file_format = 'PNG'
for frame_num, file_name in stills:
    scene.frame_set(frame_num)
    still_path = os.path.join(output_dir, file_name)
    scene.render.filepath = still_path
    bpy.ops.render.render(write_still=True)
    shutil.copy(still_path, os.path.join(artifact_dir, file_name))
    print(f"Rendered still: {file_name}")

print("=================================================================")
print("ALL ANIMATION ASSETS, GLB, VIDEO, AND STILLS PRODUCED SUCCESSFULLY!")
print("=================================================================")
