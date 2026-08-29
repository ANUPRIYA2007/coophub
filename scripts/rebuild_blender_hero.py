import bpy
import math
import numpy as np
import os
import shutil

print("=================================================================")
print("REBUILDING COOPBOT RIG, MORPHS, AND ANIMATIONS IN BLENDER")
print("=================================================================")

# Ensure we are in Object mode
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

if not mesh_obj or not arm_obj:
    raise RuntimeError("Missing CoopBot_Mesh or Armature_CoopBot in scene!")

# Deselect all
bpy.ops.object.select_all(action='DESELECT')
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj

# Switch Armature to Edit Mode to align bones accurately to mesh anatomy
bpy.ops.object.mode_set(mode='EDIT')
edit_bones = arm_obj.data.edit_bones

# -------------------------------------------------------------
# 1. PRECISE BONE ANATOMICAL ALIGNMENT
# -------------------------------------------------------------
# Character coordinates:
# Front = -Y, Back = +Y, Up = +Z, Down = -Z, Left (screen -X) = -X, Right (screen +X) = +X

# Central Spine & Head
edit_bones['Root'].head = (0.0, 0.0, -0.999)
edit_bones['Root'].tail = (0.0, 0.0, -0.80)

edit_bones['Hips'].head = (0.0, 0.0, -0.50)
edit_bones['Hips'].tail = (0.0, 0.0, -0.22)

edit_bones['Spine'].head = (0.0, 0.0, -0.22)
edit_bones['Spine'].tail = (0.0, 0.0, 0.12)

edit_bones['Chest'].head = (0.0, 0.0, 0.12)
edit_bones['Chest'].tail = (0.0, 0.0, 0.46)

edit_bones['Neck'].head = (0.0, 0.0, 0.46)
edit_bones['Neck'].tail = (0.0, -0.02, 0.62)

edit_bones['Head'].head = (0.0, -0.02, 0.62)
edit_bones['Head'].tail = (0.0, -0.02, 0.99)

# Eyes (Pointing FORWARD out of the visor towards -Y)
edit_bones['Eye_L'].head = (-0.171, -0.20, 0.687)
edit_bones['Eye_L'].tail = (-0.171, -0.35, 0.687)

edit_bones['Eye_R'].head = (0.182, -0.20, 0.688)
edit_bones['Eye_R'].tail = (0.182, -0.35, 0.688)

# Left Arm (Screen Left -X, in rest pose hands near pocket)
edit_bones['Shoulder.L'].head = (-0.10, 0.0, 0.38)
edit_bones['Shoulder.L'].tail = (-0.24, -0.02, 0.36)

edit_bones['UpperArm.L'].head = (-0.24, -0.02, 0.36)
edit_bones['UpperArm.L'].tail = (-0.31, -0.03, 0.12)

edit_bones['Forearm.L'].head = (-0.31, -0.03, 0.12)
edit_bones['Forearm.L'].tail = (-0.286, -0.046, -0.128)

edit_bones['Hand.L'].head = (-0.286, -0.046, -0.128)
edit_bones['Hand.L'].tail = (-0.25, -0.06, -0.24)

# Right Arm (Screen Right +X, in rest pose hands near pocket)
edit_bones['Shoulder.R'].head = (0.10, 0.0, 0.38)
edit_bones['Shoulder.R'].tail = (0.24, -0.02, 0.36)

edit_bones['UpperArm.R'].head = (0.24, -0.02, 0.36)
edit_bones['UpperArm.R'].tail = (0.31, -0.03, 0.12)

edit_bones['Forearm.R'].head = (0.31, -0.03, 0.12)
edit_bones['Forearm.R'].tail = (0.286, -0.041, -0.128)

edit_bones['Hand.R'].head = (0.286, -0.041, -0.128)
edit_bones['Hand.R'].tail = (0.25, -0.06, -0.24)

# Legs
edit_bones['Thigh.L'].head = (-0.16, 0.0, -0.45)
edit_bones['Thigh.L'].tail = (-0.18, 0.0, -0.72)

edit_bones['Shin.L'].head = (-0.18, 0.0, -0.72)
edit_bones['Shin.L'].tail = (-0.18, 0.0, -0.95)

edit_bones['Foot.L'].head = (-0.18, 0.0, -0.95)
edit_bones['Foot.L'].tail = (-0.18, -0.18, -0.999)

edit_bones['Thigh.R'].head = (0.16, 0.0, -0.45)
edit_bones['Thigh.R'].tail = (0.18, 0.0, -0.72)

edit_bones['Shin.R'].head = (0.18, 0.0, -0.72)
edit_bones['Shin.R'].tail = (0.18, 0.0, -0.95)

edit_bones['Foot.R'].head = (0.18, 0.0, -0.95)
edit_bones['Foot.R'].tail = (0.18, -0.18, -0.999)

bpy.ops.object.mode_set(mode='OBJECT')
print("Bones aligned to anatomical landmarks successfully!")

# -------------------------------------------------------------
# 2. PRECISE VERTEX WEIGHT DISTRIBUTION
# -------------------------------------------------------------
# We will compute geodesic-aware weights for each vertex
bpy.context.view_layer.objects.active = mesh_obj
mesh = mesh_obj.data
coords = np.array([v.co for v in mesh.vertices])

# Ensure all 22 vertex groups exist
bone_names = [b.name for b in arm_obj.data.bones]
vg_map = {}
for name in bone_names:
    vg = mesh_obj.vertex_groups.get(name)
    if not vg:
        vg = mesh_obj.vertex_groups.new(name=name)
    vg_map[name] = vg

# Clear old weights for clean weight calculation
for vg in mesh_obj.vertex_groups:
    vg.remove(range(len(mesh.vertices)))

print("Assigning anatomically isolated vertex weights...")

for i, v in enumerate(mesh.vertices):
    x, y, z = v.co

    # HEAD & VISOR
    if z >= 0.55:
        # Check if Eye_L or Eye_R
        # Left Eye (screen left -X)
        d_eye_l = math.sqrt((x - (-0.171))**2 + (y - (-0.243))**2 + (z - 0.687)**2)
        # Right Eye (screen right +X)
        d_eye_r = math.sqrt((x - 0.182)**2 + (y - (-0.262))**2 + (z - 0.688)**2)

        if y < -0.16 and d_eye_l < 0.10:
            w_eye_l = max(0.0, 1.0 - (d_eye_l / 0.10)**2)
            vg_map['Eye_L'].add([i], w_eye_l * 0.9, 'REPLACE')
            vg_map['Head'].add([i], 1.0 - (w_eye_l * 0.9), 'REPLACE')
        elif y < -0.16 and d_eye_r < 0.10:
            w_eye_r = max(0.0, 1.0 - (d_eye_r / 0.10)**2)
            vg_map['Eye_R'].add([i], w_eye_r * 0.9, 'REPLACE')
            vg_map['Head'].add([i], 1.0 - (w_eye_r * 0.9), 'REPLACE')
        else:
            w_head = min(1.0, (z - 0.55) / 0.10)
            vg_map['Head'].add([i], w_head, 'REPLACE')
            if w_head < 1.0:
                vg_map['Neck'].add([i], 1.0 - w_head, 'REPLACE')

    # NECK
    elif 0.44 <= z < 0.55 and abs(x) < 0.22:
        w_neck = (z - 0.44) / 0.11
        vg_map['Neck'].add([i], w_neck, 'REPLACE')
        vg_map['Chest'].add([i], 1.0 - w_neck, 'REPLACE')

    # LEFT ARM & HAND (Screen Left -X, x < -0.18)
    elif x < -0.18 and -0.28 <= z < 0.50:
        # Hand region: z < 0.02, x < -0.22, y < 0.08
        if z < 0.02 and x < -0.22 and y < 0.08:
            vg_map['Hand.L'].add([i], 1.0, 'REPLACE')
        # Forearm region: 0.02 <= z < 0.22
        elif 0.02 <= z < 0.22:
            t = (z - 0.02) / 0.20
            vg_map['Forearm.L'].add([i], 1.0 - t * 0.4, 'REPLACE')
            vg_map['Hand.L'].add([i], t * 0.4 if z < 0.08 else 0.0, 'ADD')
            if t > 0.6:
                vg_map['UpperArm.L'].add([i], (t - 0.6) / 0.4 * 0.5, 'ADD')
        # UpperArm region: 0.22 <= z < 0.42
        elif 0.22 <= z < 0.42:
            t = (z - 0.22) / 0.20
            vg_map['UpperArm.L'].add([i], 1.0 - t * 0.4, 'REPLACE')
            vg_map['Forearm.L'].add([i], (1.0 - t) * 0.4, 'ADD')
            vg_map['Shoulder.L'].add([i], t * 0.5, 'ADD')
        else: # Shoulder
            vg_map['Shoulder.L'].add([i], 0.7, 'REPLACE')
            vg_map['Chest'].add([i], 0.3, 'REPLACE')

    # RIGHT ARM & HAND (Screen Right +X, x > 0.18)
    elif x > 0.18 and -0.28 <= z < 0.50:
        # Hand region: z < 0.02, x > 0.22, y < 0.08
        if z < 0.02 and x > 0.22 and y < 0.08:
            vg_map['Hand.R'].add([i], 1.0, 'REPLACE')
        # Forearm region: 0.02 <= z < 0.22
        elif 0.02 <= z < 0.22:
            t = (z - 0.02) / 0.20
            vg_map['Forearm.R'].add([i], 1.0 - t * 0.4, 'REPLACE')
            vg_map['Hand.R'].add([i], t * 0.4 if z < 0.08 else 0.0, 'ADD')
            if t > 0.6:
                vg_map['UpperArm.R'].add([i], (t - 0.6) / 0.4 * 0.5, 'ADD')
        # UpperArm region: 0.22 <= z < 0.42
        elif 0.22 <= z < 0.42:
            t = (z - 0.22) / 0.20
            vg_map['UpperArm.R'].add([i], 1.0 - t * 0.4, 'REPLACE')
            vg_map['Forearm.R'].add([i], (1.0 - t) * 0.4, 'ADD')
            vg_map['Shoulder.R'].add([i], t * 0.5, 'ADD')
        else: # Shoulder
            vg_map['Shoulder.R'].add([i], 0.7, 'REPLACE')
            vg_map['Chest'].add([i], 0.3, 'REPLACE')

    # TORSO: CHEST / SPINE / HIPS
    elif -0.45 <= z < 0.44:
        if z >= 0.15:
            t = (z - 0.15) / 0.29
            vg_map['Chest'].add([i], t, 'REPLACE')
            vg_map['Spine'].add([i], 1.0 - t, 'REPLACE')
        elif -0.20 <= z < 0.15:
            t = (z - (-0.20)) / 0.35
            vg_map['Spine'].add([i], t, 'REPLACE')
            vg_map['Hips'].add([i], 1.0 - t, 'REPLACE')
        else: # -0.45 <= z < -0.20
            vg_map['Hips'].add([i], 1.0, 'REPLACE')

    # LEGS & FEET
    else: # z < -0.45
        is_left = (x < 0)
        prefix = '.L' if is_left else '.R'
        if z >= -0.72:
            t = (z - (-0.72)) / 0.27
            vg_map['Thigh' + prefix].add([i], t, 'REPLACE')
            vg_map['Shin' + prefix].add([i], 1.0 - t, 'REPLACE')
        elif -0.92 <= z < -0.72:
            t = (z - (-0.92)) / 0.20
            vg_map['Shin' + prefix].add([i], t, 'REPLACE')
            vg_map['Foot' + prefix].add([i], 1.0 - t, 'REPLACE')
        else:
            vg_map['Foot' + prefix].add([i], 1.0, 'REPLACE')

print("Vertex weights assigned cleanly to all 22 bones!")

# -------------------------------------------------------------
# 3. HIGH-EXPRESSION SHAPE KEYS (Blink, Smile, Speaking, Thinking, Alert)
# -------------------------------------------------------------
# Remove old shape keys to create clean, mathematically precise morph targets
if mesh_obj.data.shape_keys:
    mesh_obj.shape_key_clear()

# Add Basis
basis = mesh_obj.shape_key_add(name="Basis", from_mix=False)

# Shape Key 1: BLINK (Visually closes the eye apertures on the visor)
key_blink = mesh_obj.shape_key_add(name="Blink", from_mix=False)
for i, v in enumerate(mesh.vertices):
    x, y, z = v.co
    # Both eyes on front visor (y < -0.16, 0.58 < z < 0.75, 0.04 < |x| < 0.27)
    if y < -0.16 and 0.58 < z < 0.76 and (0.04 < abs(x) < 0.27):
        # Calculate eye center Z = 0.687
        rel_z = z - 0.687
        if rel_z > 0: # Upper eyelid moves down
            shift_z = -rel_z * 0.95
        else: # Lower eyelid moves up slightly
            shift_z = -rel_z * 0.85
        key_blink.data[i].co.z += shift_z

# Shape Key 2: SMILE (Visor corners and cheeks curl upward joyfully)
key_smile = mesh_obj.shape_key_add(name="Smile", from_mix=False)
for i, v in enumerate(mesh.vertices):
    x, y, z = v.co
    if y < -0.16 and 0.48 < z < 0.72 and abs(x) < 0.30:
        # Center mouth lifts up, corners widen
        d_center = math.sqrt(x**2 + (z - 0.53)**2)
        if d_center < 0.20:
            factor = max(0.0, 1.0 - (d_center / 0.20))
            key_smile.data[i].co.z += 0.035 * factor
            if abs(x) > 0.04:
                key_smile.data[i].co.x += 0.02 * (1.0 if x > 0 else -1.0) * factor

# Shape Key 3: SPEAKING (Visible opening and pulsing of mouth/speaker cavity)
key_speaking = mesh_obj.shape_key_add(name="Speaking", from_mix=False)
for i, v in enumerate(mesh.vertices):
    x, y, z = v.co
    if y < -0.16 and 0.48 < z < 0.60 and abs(x) < 0.18:
        # Mouth drops open
        d_mouth = math.sqrt(x**2 + (z - 0.53)**2)
        if d_mouth < 0.14:
            factor = max(0.0, 1.0 - (d_mouth / 0.14)**2)
            key_speaking.data[i].co.z -= 0.045 * factor # drops open 4.5 cm
            key_speaking.data[i].co.y -= 0.020 * factor # expands forward 2 cm
            key_speaking.data[i].co.x += 0.015 * (1.0 if x > 0 else -1.0) * factor

# Shape Key 4: THINKING (Right brow raises high, left brow furrows down)
key_thinking = mesh_obj.shape_key_add(name="Thinking", from_mix=False)
for i, v in enumerate(mesh.vertices):
    x, y, z = v.co
    if y < -0.16 and 0.68 < z < 0.82 and abs(x) < 0.30:
        if x > 0.04: # Right eye brow (screen right +X)
            factor = max(0.0, 1.0 - math.sqrt((x - 0.18)**2 + (z - 0.74)**2) / 0.16)
            key_thinking.data[i].co.z += 0.045 * factor # Arch up high
        elif x < -0.04: # Left eye brow (screen left -X)
            factor = max(0.0, 1.0 - math.sqrt((x - (-0.17))**2 + (z - 0.74)**2) / 0.16)
            key_thinking.data[i].co.z -= 0.025 * factor # Furrow down

# Shape Key 5: ALERT (Eyes widen and upper visor expands)
key_alert = mesh_obj.shape_key_add(name="Alert", from_mix=False)
for i, v in enumerate(mesh.vertices):
    x, y, z = v.co
    if y < -0.16 and 0.58 < z < 0.80 and abs(x) < 0.30:
        factor = max(0.0, 1.0 - math.sqrt(x**2 + (z - 0.69)**2) / 0.28)
        key_alert.data[i].co.z += 0.040 * factor
        key_alert.data[i].co.y -= 0.015 * factor

print("5 High-Expression Shape Keys created successfully!")

# -------------------------------------------------------------
# 4. KEYFRAME ALL 11 ANIMATION ACTIONS (FULL ARM/HAND FREEDOM)
# -------------------------------------------------------------
# Clear all previous actions
for act in list(bpy.data.actions):
    bpy.data.actions.remove(act)

bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='POSE')
pose_bones = arm_obj.pose.bones

def reset_pose():
    for pb in pose_bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)

def key_bone(pb, frame, loc=None, rot_deg=None):
    if loc is not None:
        pb.location = loc
        pb.keyframe_insert(data_path="location", frame=frame)
    if rot_deg is not None:
        pb.rotation_euler = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))
        pb.keyframe_insert(data_path="rotation_euler", frame=frame)

# -------------------------------------------------------------
# Action 1: Action_Idle (Floating harmonic breathing)
# -------------------------------------------------------------
act_idle = bpy.data.actions.new(name="Action_Idle")
arm_obj.animation_data_create()
arm_obj.animation_data.action = act_idle
reset_pose()

for f, (bz, hx, ay) in [(0, (0.0, 0.0, 0.0)), (30, (0.04, -2.0, 3.0)), (60, (0.0, 0.0, 0.0))]:
    key_bone(pose_bones['Root'], f, loc=(0, 0, bz))
    key_bone(pose_bones['Spine'], f, rot_deg=(hx, 0, 0))
    key_bone(pose_bones['UpperArm.L'], f, rot_deg=(0, 0, ay))
    key_bone(pose_bones['UpperArm.R'], f, rot_deg=(0, 0, -ay))

# -------------------------------------------------------------
# Action 2: Action_Greeting / Action_Wave (Right Hand Lifts and Waves Joyfully)
# -------------------------------------------------------------
for act_name in ["Action_Greeting", "Action_Wave"]:
    act = bpy.data.actions.new(name=act_name)
    arm_obj.animation_data.action = act
    reset_pose()

    # Frame 0: Rest pose
    key_bone(pose_bones['UpperArm.R'], 0, rot_deg=(0, 0, 0))
    key_bone(pose_bones['Forearm.R'], 0, rot_deg=(0, 0, 0))
    key_bone(pose_bones['Hand.R'], 0, rot_deg=(0, 0, 0))
    key_bone(pose_bones['Head'], 0, rot_deg=(0, 0, 0))

    # Frame 15: Arm raises up high
    key_bone(pose_bones['UpperArm.R'], 15, rot_deg=(75, 15, 60))
    key_bone(pose_bones['Forearm.R'], 15, rot_deg=(45, 0, 30))
    key_bone(pose_bones['Hand.R'], 15, rot_deg=(0, 0, -25))
    key_bone(pose_bones['Head'], 15, rot_deg=(-4, 6, 8))

    # Frame 25: Wave right
    key_bone(pose_bones['Forearm.R'], 25, rot_deg=(55, 0, 45))
    key_bone(pose_bones['Hand.R'], 25, rot_deg=(0, 0, 35))

    # Frame 35: Wave left
    key_bone(pose_bones['Forearm.R'], 35, rot_deg=(40, 0, 20))
    key_bone(pose_bones['Hand.R'], 35, rot_deg=(0, 0, -35))

    # Frame 45: Wave right again
    key_bone(pose_bones['Forearm.R'], 45, rot_deg=(55, 0, 45))
    key_bone(pose_bones['Hand.R'], 45, rot_deg=(0, 0, 30))

    # Frame 60: Return to rest pose
    key_bone(pose_bones['UpperArm.R'], 60, rot_deg=(0, 0, 0))
    key_bone(pose_bones['Forearm.R'], 60, rot_deg=(0, 0, 0))
    key_bone(pose_bones['Hand.R'], 60, rot_deg=(0, 0, 0))
    key_bone(pose_bones['Head'], 60, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 3: Action_Point (Right Arm Extends Directly Forward to Point)
# -------------------------------------------------------------
act_point = bpy.data.actions.new(name="Action_Point")
arm_obj.animation_data.action = act_point
reset_pose()

key_bone(pose_bones['UpperArm.R'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['Hand.R'], 0, rot_deg=(0, 0, 0))

key_bone(pose_bones['UpperArm.R'], 18, rot_deg=(85, 0, 15)) # Extends forward
key_bone(pose_bones['Forearm.R'], 18, rot_deg=(15, 0, 0))
key_bone(pose_bones['Hand.R'], 18, rot_deg=(10, 0, -10))
key_bone(pose_bones['Spine'], 18, rot_deg=(4, 0, 6))

key_bone(pose_bones['UpperArm.R'], 42, rot_deg=(85, 0, 15))
key_bone(pose_bones['Forearm.R'], 42, rot_deg=(15, 0, 0))
key_bone(pose_bones['Hand.R'], 42, rot_deg=(10, 0, -10))

key_bone(pose_bones['UpperArm.R'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['Hand.R'], 60, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 4: Action_Success (BOTH Arms Raise High in Victory V-Pose)
# -------------------------------------------------------------
act_success = bpy.data.actions.new(name="Action_Success")
arm_obj.animation_data.action = act_success
reset_pose()

key_bone(pose_bones['Root'], 0, loc=(0, 0, 0))
key_bone(pose_bones['UpperArm.L'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 0, rot_deg=(0, 0, 0))

# Jump bounce and arms up
key_bone(pose_bones['Root'], 16, loc=(0, 0, 0.12)) # Jump
key_bone(pose_bones['UpperArm.L'], 16, rot_deg=(115, -20, -55)) # Raised high
key_bone(pose_bones['Forearm.L'], 16, rot_deg=(30, 0, -20))
key_bone(pose_bones['UpperArm.R'], 16, rot_deg=(115, 20, 55)) # Raised high
key_bone(pose_bones['Forearm.R'], 16, rot_deg=(30, 0, 20))
key_bone(pose_bones['Head'], 16, rot_deg=(-12, 0, 0)) # Looks up in joy

key_bone(pose_bones['Root'], 32, loc=(0, 0, 0.0))
key_bone(pose_bones['UpperArm.L'], 32, rot_deg=(105, -15, -45))
key_bone(pose_bones['UpperArm.R'], 32, rot_deg=(105, 15, 45))

key_bone(pose_bones['Root'], 48, loc=(0, 0, 0.08))
key_bone(pose_bones['UpperArm.L'], 48, rot_deg=(115, -20, -55))
key_bone(pose_bones['UpperArm.R'], 48, rot_deg=(115, 20, 55))

key_bone(pose_bones['Root'], 66, loc=(0, 0, 0.0))
key_bone(pose_bones['UpperArm.L'], 66, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 66, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.L'], 66, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 66, rot_deg=(0, 0, 0))
key_bone(pose_bones['Head'], 66, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 5: Action_Listening (Attentive tilt forward + Headset touch)
# -------------------------------------------------------------
act_listen = bpy.data.actions.new(name="Action_Listening")
arm_obj.animation_data.action = act_listen
reset_pose()

key_bone(pose_bones['Head'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['Head'], 25, rot_deg=(8, -6, -10)) # Attentive tilt
key_bone(pose_bones['UpperArm.R'], 25, rot_deg=(40, 10, 30))
key_bone(pose_bones['Forearm.R'], 25, rot_deg=(75, 0, 35)) # Hand near headset
key_bone(pose_bones['Head'], 50, rot_deg=(10, -4, -8))
key_bone(pose_bones['Head'], 75, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 75, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 75, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 6: Action_Thinking (Hand on Chin + Inquisitive Head Tilt)
# -------------------------------------------------------------
act_think = bpy.data.actions.new(name="Action_Thinking")
arm_obj.animation_data.action = act_think
reset_pose()

key_bone(pose_bones['Head'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 0, rot_deg=(0, 0, 0))

# Hand brings up to chin
key_bone(pose_bones['Head'], 25, rot_deg=(-6, 12, 14)) # Looks up and tilted
key_bone(pose_bones['UpperArm.R'], 25, rot_deg=(65, 0, 35))
key_bone(pose_bones['Forearm.R'], 25, rot_deg=(95, 0, 45))
key_bone(pose_bones['Hand.R'], 25, rot_deg=(15, 0, 20))

key_bone(pose_bones['Head'], 60, rot_deg=(-4, 10, 12))
key_bone(pose_bones['Head'], 90, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 90, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 90, rot_deg=(0, 0, 0))
key_bone(pose_bones['Hand.R'], 90, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 7: Action_Speaking (Conversational Gesticulation & Head Nodding)
# -------------------------------------------------------------
act_speak = bpy.data.actions.new(name="Action_Speaking")
arm_obj.animation_data.action = act_speak
reset_pose()

for f, (hx, rz, ly, ry) in [
    (0, (0, 0, 0, 0)),
    (15, (6, 0, 20, 25)),
    (30, (-4, 2, 10, 15)),
    (45, (8, -2, 25, 30)),
    (60, (0, 0, 0, 0))
]:
    key_bone(pose_bones['Head'], f, rot_deg=(hx, rz, 0))
    key_bone(pose_bones['UpperArm.L'], f, rot_deg=(ly, 0, -10))
    key_bone(pose_bones['Forearm.L'], f, rot_deg=(ly * 1.5, 0, 0))
    key_bone(pose_bones['UpperArm.R'], f, rot_deg=(ry, 0, 10))
    key_bone(pose_bones['Forearm.R'], f, rot_deg=(ry * 1.5, 0, 0))

# -------------------------------------------------------------
# Action 8: Action_Error (Horizontal Head Shake 'No')
# -------------------------------------------------------------
act_error = bpy.data.actions.new(name="Action_Error")
arm_obj.animation_data.action = act_error
reset_pose()

key_bone(pose_bones['Head'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['Head'], 10, rot_deg=(0, 24, 0)) # Shake right
key_bone(pose_bones['Head'], 22, rot_deg=(0, -24, 0)) # Shake left
key_bone(pose_bones['Head'], 34, rot_deg=(0, 18, 0)) # Shake right
key_bone(pose_bones['Head'], 46, rot_deg=(0, -18, 0)) # Shake left
key_bone(pose_bones['Head'], 60, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 9: Action_Warning (Hand up in Caution / Stop Gesture)
# -------------------------------------------------------------
act_warn = bpy.data.actions.new(name="Action_Warning")
arm_obj.animation_data.action = act_warn
reset_pose()

key_bone(pose_bones['UpperArm.R'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['Spine'], 0, rot_deg=(0, 0, 0))

# Palm up caution gesture
key_bone(pose_bones['UpperArm.R'], 20, rot_deg=(55, 0, 20))
key_bone(pose_bones['Forearm.R'], 20, rot_deg=(65, 0, 25))
key_bone(pose_bones['Hand.R'], 20, rot_deg=(-35, 0, 0)) # Palm faces forward
key_bone(pose_bones['Spine'], 20, rot_deg=(-8, 0, 0)) # Leans back

key_bone(pose_bones['UpperArm.R'], 45, rot_deg=(55, 0, 20))
key_bone(pose_bones['Forearm.R'], 45, rot_deg=(65, 0, 25))
key_bone(pose_bones['Hand.R'], 45, rot_deg=(-35, 0, 0))

key_bone(pose_bones['UpperArm.R'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['Hand.R'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['Spine'], 60, rot_deg=(0, 0, 0))

# -------------------------------------------------------------
# Action 10: Action_Confirmation (Affirmative Nod + Thumbs Up Gesture)
# -------------------------------------------------------------
act_confirm = bpy.data.actions.new(name="Action_Confirmation")
arm_obj.animation_data.action = act_confirm
reset_pose()

key_bone(pose_bones['Head'], 0, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 0, rot_deg=(0, 0, 0))

key_bone(pose_bones['Head'], 15, rot_deg=(14, 0, 0)) # Nod down
key_bone(pose_bones['UpperArm.R'], 15, rot_deg=(45, 0, 25))
key_bone(pose_bones['Forearm.R'], 15, rot_deg=(75, 0, 15))

key_bone(pose_bones['Head'], 30, rot_deg=(-4, 0, 0)) # Nod up
key_bone(pose_bones['Head'], 45, rot_deg=(12, 0, 0)) # Nod down second time
key_bone(pose_bones['Head'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['UpperArm.R'], 60, rot_deg=(0, 0, 0))
key_bone(pose_bones['Forearm.R'], 60, rot_deg=(0, 0, 0))

# Set default action back to Idle
arm_obj.animation_data.action = act_idle
reset_pose()
bpy.ops.object.mode_set(mode='OBJECT')

print("All 11 actions keyframed with full body, arm, and hand movements!")

# -------------------------------------------------------------
# 5. SAVE BLENDER FILE AND EXPORT GLB
# -------------------------------------------------------------
blend_path = os.path.join(os.getcwd(), "3d-hero", "CoopBot_3D_Hero.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Saved Master Blender file to: {blend_path}")

# Export high-fidelity GLB with all animations and morph targets
export_dir = os.path.join(os.getcwd(), "3d-hero", "exports")
os.makedirs(export_dir, exist_ok=True)
glb_path = os.path.join(export_dir, "CoopBot_Animated.glb")
public_glb_path = os.path.join(os.getcwd(), "public", "assets", "3d", "CoopBot_Animated.glb")

bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    export_cameras=False,
    export_lights=False,
    export_yup=True,
    export_apply=False,
    export_morph=True,
    export_morph_normal=True,
    export_morph_tangent=False,
    export_animations=True,
    export_all_influences=True,
    export_def_bones=True,
    export_current_frame=False,
)
print(f"Exported Animated GLB to: {glb_path}")

shutil.copy(glb_path, public_glb_path)
print(f"Copied to public runtime path: {public_glb_path}")
print("=================================================================")
print("REBUILD COMPLETE!")
