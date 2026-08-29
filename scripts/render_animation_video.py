import bpy
import math
import os
import shutil

print("=================================================================")
print("GENERATING COOPBOT ANIMATION TEST VIDEO & VISUAL PROOF STILLS")
print("=================================================================")

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# Ensure Camera
if "VideoCam" not in bpy.data.objects:
    cam_data = bpy.data.cameras.new("VideoCam")
    cam_data.lens = 55
    cam_obj = bpy.data.objects.new("VideoCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
else:
    cam_obj = bpy.data.objects["VideoCam"]

bpy.context.scene.camera = cam_obj

# Position camera for full-body view showing head, visor, arms, hands, torso
cam_obj.location = (0.35, -2.4, 0.28)
cam_obj.rotation_euler = (math.radians(86), 0, math.radians(8))

# Studio Lights
if "KeyLight" not in bpy.data.objects:
    light_data = bpy.data.lights.new(name="KeyLight", type='AREA')
    light_data.energy = 600
    light_data.size = 2.0
    light_obj = bpy.data.objects.new(name="KeyLight", object_data=light_data)
    light_obj.location = (1.8, -2.0, 1.8)
    bpy.context.scene.collection.objects.link(light_obj)

if "FillLight" not in bpy.data.objects:
    fill_data = bpy.data.lights.new(name="FillLight", type='AREA')
    fill_data.energy = 300
    fill_data.size = 2.5
    fill_obj = bpy.data.objects.new(name="FillLight", object_data=fill_data)
    fill_obj.location = (-1.8, -1.8, 1.0)
    bpy.context.scene.collection.objects.link(fill_obj)

# Create Comprehensive Test Master Action
master_action = bpy.data.actions.new(name="Master_Animation_Test")
arm_obj.animation_data.action = master_action
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='POSE')
pose_bones = arm_obj.pose.bones

def reset_pose():
    for pb in pose_bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)

def key_b(pb, frame, loc=None, rot_deg=None):
    if loc is not None:
        pb.location = loc
        pb.keyframe_insert(data_path="location", frame=frame)
    if rot_deg is not None:
        pb.rotation_euler = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)

# Shape key keyframing on mesh
shape_keys = mesh_obj.data.shape_keys.key_blocks
def key_shape(name, frame, value):
    if name in shape_keys:
        shape_keys[name].value = value
        shape_keys[name].keyframe_insert(data_path="value", frame=frame)

reset_pose()

# Timeline Planning (24 fps):
# Sec 1: 0 - 30: Idle
# Sec 2: 31 - 75: Greeting / Wave (Right hand waves visibly in air)
# Sec 3: 76 - 110: Point (Right hand extends forward)
# Sec 4: 111 - 150: Success (Both arms raise high V-pose + jump)
# Sec 5: 151 - 180: Listening (Head attentive tilt + ear touch)
# Sec 6: 181 - 220: Thinking (Hand to chin + head tilt)
# Sec 7: 221 - 250: Speaking (Conversational arm gestures + speaking pulses)
# Sec 8: 251 - 280: Error (Head shake 'no')
# Sec 9: 281 - 310: Warning (Palm up caution)
# Sec 10: 311 - 380: Facial Morphs Test (Blink, Smile, Speaking, Thinking, Alert)
# Sec 11: 381 - 440: Eye Tracking Test (Left, Right, Up, Down, Center)

# --- SEC 1: IDLE (f: 0-30) ---
key_b(pose_bones['Root'], 0, loc=(0,0,0))
key_b(pose_bones['Root'], 15, loc=(0,0,0.03))
key_b(pose_bones['Root'], 30, loc=(0,0,0))

# --- SEC 2: WAVE / GREETING (f: 31-75) ---
key_b(pose_bones['UpperArm.R'], 31, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 31, rot_deg=(0,0,0))
key_b(pose_bones['Hand.R'], 31, rot_deg=(0,0,0))
key_shape('Smile', 31, 0.0)

# Arm raises up high
key_b(pose_bones['UpperArm.R'], 42, rot_deg=(80, 15, 60))
key_b(pose_bones['Forearm.R'], 42, rot_deg=(50, 0, 35))
key_b(pose_bones['Hand.R'], 42, rot_deg=(0, 0, -30))
key_shape('Smile', 42, 0.8)

# Waving
key_b(pose_bones['Hand.R'], 48, rot_deg=(0, 0, 35))
key_b(pose_bones['Hand.R'], 54, rot_deg=(0, 0, -35))
key_b(pose_bones['Hand.R'], 60, rot_deg=(0, 0, 30))

# Return
key_b(pose_bones['UpperArm.R'], 75, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 75, rot_deg=(0,0,0))
key_b(pose_bones['Hand.R'], 75, rot_deg=(0,0,0))
key_shape('Smile', 75, 0.0)

# --- SEC 3: POINT (f: 76-110) ---
key_b(pose_bones['UpperArm.R'], 76, rot_deg=(0,0,0))
key_b(pose_bones['UpperArm.R'], 88, rot_deg=(85, 0, 15)) # Extends forward
key_b(pose_bones['Forearm.R'], 88, rot_deg=(15, 0, 0))
key_b(pose_bones['Hand.R'], 88, rot_deg=(10, 0, -10))

key_b(pose_bones['UpperArm.R'], 102, rot_deg=(85, 0, 15))
key_b(pose_bones['UpperArm.R'], 110, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 110, rot_deg=(0,0,0))
key_b(pose_bones['Hand.R'], 110, rot_deg=(0,0,0))

# --- SEC 4: SUCCESS (f: 111-150) ---
key_b(pose_bones['Root'], 111, loc=(0,0,0))
key_b(pose_bones['UpperArm.L'], 111, rot_deg=(0,0,0))
key_b(pose_bones['UpperArm.R'], 111, rot_deg=(0,0,0))

# Victory raise
key_b(pose_bones['Root'], 122, loc=(0,0,0.12)) # Jump
key_b(pose_bones['UpperArm.L'], 122, rot_deg=(115, -20, -55))
key_b(pose_bones['Forearm.L'], 122, rot_deg=(30, 0, -20))
key_b(pose_bones['UpperArm.R'], 122, rot_deg=(115, 20, 55))
key_b(pose_bones['Forearm.R'], 122, rot_deg=(30, 0, 20))
key_shape('Smile', 122, 1.0)

key_b(pose_bones['Root'], 136, loc=(0,0,0.08))
key_b(pose_bones['UpperArm.L'], 136, rot_deg=(110, -15, -50))
key_b(pose_bones['UpperArm.R'], 136, rot_deg=(110, 15, 50))

key_b(pose_bones['Root'], 150, loc=(0,0,0))
key_b(pose_bones['UpperArm.L'], 150, rot_deg=(0,0,0))
key_b(pose_bones['UpperArm.R'], 150, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.L'], 150, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 150, rot_deg=(0,0,0))
key_shape('Smile', 150, 0.0)

# --- SEC 5: LISTENING (f: 151-180) ---
key_b(pose_bones['Head'], 151, rot_deg=(0,0,0))
key_b(pose_bones['Head'], 165, rot_deg=(10, -6, -12))
key_b(pose_bones['UpperArm.R'], 165, rot_deg=(40, 10, 30))
key_b(pose_bones['Forearm.R'], 165, rot_deg=(75, 0, 35))

key_b(pose_bones['Head'], 180, rot_deg=(0,0,0))
key_b(pose_bones['UpperArm.R'], 180, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 180, rot_deg=(0,0,0))

# --- SEC 6: THINKING (f: 181-220) ---
key_b(pose_bones['Head'], 181, rot_deg=(0,0,0))
key_b(pose_bones['Head'], 198, rot_deg=(-6, 12, 14))
key_b(pose_bones['UpperArm.R'], 198, rot_deg=(65, 0, 35))
key_b(pose_bones['Forearm.R'], 198, rot_deg=(95, 0, 45))
key_b(pose_bones['Hand.R'], 198, rot_deg=(15, 0, 20))
key_shape('Thinking', 198, 0.9)

key_b(pose_bones['Head'], 220, rot_deg=(0,0,0))
key_b(pose_bones['UpperArm.R'], 220, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 220, rot_deg=(0,0,0))
key_b(pose_bones['Hand.R'], 220, rot_deg=(0,0,0))
key_shape('Thinking', 220, 0.0)

# --- SEC 7: SPEAKING (f: 221-250) ---
for f, (hx, spk) in [(221, (0, 0.0)), (228, (8, 0.85)), (235, (-4, 0.2)), (242, (6, 0.9)), (250, (0, 0.0))]:
    key_b(pose_bones['Head'], f, rot_deg=(hx, 0, 0))
    key_shape('Speaking', f, spk)

# --- SEC 8: ERROR (f: 251-280) ---
key_b(pose_bones['Head'], 251, rot_deg=(0,0,0))
key_b(pose_bones['Head'], 258, rot_deg=(0, 24, 0))
key_b(pose_bones['Head'], 266, rot_deg=(0, -24, 0))
key_b(pose_bones['Head'], 274, rot_deg=(0, 18, 0))
key_b(pose_bones['Head'], 280, rot_deg=(0,0,0))

# --- SEC 9: WARNING (f: 281-310) ---
key_b(pose_bones['UpperArm.R'], 281, rot_deg=(0,0,0))
key_b(pose_bones['UpperArm.R'], 295, rot_deg=(55, 0, 20))
key_b(pose_bones['Forearm.R'], 295, rot_deg=(65, 0, 25))
key_b(pose_bones['Hand.R'], 295, rot_deg=(-35, 0, 0))
key_b(pose_bones['Spine'], 295, rot_deg=(-8, 0, 0))
key_shape('Alert', 295, 0.8)

key_b(pose_bones['UpperArm.R'], 310, rot_deg=(0,0,0))
key_b(pose_bones['Forearm.R'], 310, rot_deg=(0,0,0))
key_b(pose_bones['Hand.R'], 310, rot_deg=(0,0,0))
key_b(pose_bones['Spine'], 310, rot_deg=(0,0,0))
key_shape('Alert', 310, 0.0)

# --- SEC 10: FACIAL MORPHS EXPLICIT TEST (f: 311-380) ---
# Blink 0 -> 1 -> 0
key_shape('Blink', 311, 0.0)
key_shape('Blink', 320, 1.0)
key_shape('Blink', 330, 0.0)

# Smile 0 -> 1 -> 0
key_shape('Smile', 331, 0.0)
key_shape('Smile', 342, 1.0)
key_shape('Smile', 352, 0.0)

# Speaking 0 -> 1 -> 0
key_shape('Speaking', 353, 0.0)
key_shape('Speaking', 365, 1.0)
key_shape('Speaking', 375, 0.0)

# Alert 0 -> 1 -> 0
key_shape('Alert', 376, 0.0)
key_shape('Alert', 380, 1.0)
key_shape('Alert', 385, 0.0)

# --- SEC 11: EYE TRACKING TEST (f: 386-440) ---
# Look Left (-X)
key_b(pose_bones['Eye_L'], 386, rot_deg=(0,0,0))
key_b(pose_bones['Eye_R'], 386, rot_deg=(0,0,0))

key_b(pose_bones['Eye_L'], 398, rot_deg=(0, -22, 0))
key_b(pose_bones['Eye_R'], 398, rot_deg=(0, -22, 0))

# Look Right (+X)
key_b(pose_bones['Eye_L'], 410, rot_deg=(0, 22, 0))
key_b(pose_bones['Eye_R'], 410, rot_deg=(0, 22, 0))

# Look Up (+Z)
key_b(pose_bones['Eye_L'], 422, rot_deg=(-18, 0, 0))
key_b(pose_bones['Eye_R'], 422, rot_deg=(-18, 0, 0))

# Look Down (-Z)
key_b(pose_bones['Eye_L'], 432, rot_deg=(18, 0, 0))
key_b(pose_bones['Eye_R'], 432, rot_deg=(18, 0, 0))

# Center
key_b(pose_bones['Eye_L'], 440, rot_deg=(0, 0, 0))
key_b(pose_bones['Eye_R'], 440, rot_deg=(0, 0, 0))

bpy.ops.object.mode_set(mode='OBJECT')

# Render Settings for MP4 Video
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
if hasattr(scene, 'eevee'):
    if hasattr(scene.eevee, 'taa_render_samples'):
        scene.eevee.taa_render_samples = 4
    if hasattr(scene.eevee, 'shadow_ray_count'):
        scene.eevee.shadow_ray_count = 1

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

# Now render individual high-resolution stills of key action frames
stills = [
    (15, "01_Idle_Breathing.png"),
    (54, "02_Wave_Hand_Raised.png"),
    (88, "03_Point_Arm_Extended.png"),
    (122, "04_Success_Both_Arms_High.png"),
    (165, "05_Listening_Head_Tilt.png"),
    (198, "06_Thinking_Chin_Touch.png"),
    (228, "07_Speaking_Mouth_Open.png"),
    (258, "08_Error_Head_Shake.png"),
    (295, "09_Warning_Hand_Caution.png"),
    (320, "10_Blink_Eyes_Closed.png"),
    (342, "11_Smile_Cheeks_Lifted.png"),
    (365, "12_Speaking_Mouth_Morph.png"),
    (398, "13_Eye_Tracking_Look_Left.png"),
    (410, "14_Eye_Tracking_Look_Right.png"),
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
print("ALL ANIMATION PROOFS AND VIDEO GENERATED SUCCESSFULLY!")
