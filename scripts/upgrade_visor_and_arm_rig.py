import bpy
import bmesh
import math
import numpy as np
import os
import shutil

print("=================================================================")
print("UPGRADING COOPBOT VISOR FACE & ARM RIG FOR TRUE VISIBLE MOTION")
print("=================================================================")

# Switch to object mode
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# 1. Cleanly isolate arm and hand weights from hips/torso
print("1. Assigning 100% arm authority to UpperArm, Forearm, and Hand bones...")
bpy.context.view_layer.objects.active = mesh_obj

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

for i, v in enumerate(mesh_obj.data.vertices):
    x, y, z = v.co

    # RIGHT ARM (Screen Right +X, x > 0.20, z < 0.45)
    if x > 0.21 and z > -0.22 and z < 0.44:
        # Strip all torso/hip weights completely
        if vg_hips: vg_hips.remove([i])
        if vg_spine: vg_spine.remove([i])
        if vg_thigh_r: vg_thigh_r.remove([i])

        if z < 0.0: # Hand
            vg_hand_r.add([i], 1.0, 'REPLACE')
            vg_farm_r.add([i], 0.0, 'REPLACE')
            vg_uarm_r.add([i], 0.0, 'REPLACE')
        elif 0.0 <= z < 0.20: # Forearm
            t = z / 0.20
            vg_hand_r.add([i], (1.0 - t) * 0.4, 'REPLACE')
            vg_farm_r.add([i], 1.0 - (1.0 - t) * 0.4, 'REPLACE')
            vg_uarm_r.add([i], t * 0.4, 'ADD')
        else: # UpperArm
            t = (z - 0.20) / 0.24
            vg_farm_r.add([i], (1.0 - t) * 0.4, 'REPLACE')
            vg_uarm_r.add([i], 1.0 - (1.0 - t) * 0.4, 'REPLACE')

    # LEFT ARM (Screen Left -X, x < -0.20, z < 0.45)
    if x < -0.21 and z > -0.22 and z < 0.44:
        if vg_hips: vg_hips.remove([i])
        if vg_spine: vg_spine.remove([i])
        if vg_thigh_l: vg_thigh_l.remove([i])

        if z < 0.0: # Hand
            vg_hand_l.add([i], 1.0, 'REPLACE')
            vg_farm_l.add([i], 0.0, 'REPLACE')
            vg_uarm_l.add([i], 0.0, 'REPLACE')
        elif 0.0 <= z < 0.20: # Forearm
            t = z / 0.20
            vg_hand_l.add([i], (1.0 - t) * 0.4, 'REPLACE')
            vg_farm_l.add([i], 1.0 - (1.0 - t) * 0.4, 'REPLACE')
            vg_uarm_l.add([i], t * 0.4, 'ADD')
        else: # UpperArm
            t = (z - 0.20) / 0.24
            vg_farm_l.add([i], (1.0 - t) * 0.4, 'REPLACE')
            vg_uarm_l.add([i], 1.0 - (1.0 - t) * 0.4, 'REPLACE')

print("Arm and hand weights isolated successfully!")

# -------------------------------------------------------------
# 2. CREATE DIGITAL VISOR FACE SYSTEM (EYES, EYELIDS, MOUTH)
# -------------------------------------------------------------
# Remove any existing face helper objects
for obj_name in ["CoopBot_Eyes", "CoopBot_Eyelids", "CoopBot_Mouth"]:
    if obj_name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[obj_name], do_unlink=True)

# Create Emissive Materials for Visor Screen Elements
mat_black_visor = bpy.data.materials.new("Mat_Black_Visor")
mat_black_visor.use_nodes = True
bsdf_visor = mat_black_visor.node_tree.nodes.get("Principled BSDF")
if bsdf_visor:
    bsdf_visor.inputs["Base Color"].default_value = (0.02, 0.02, 0.03, 1.0)
    bsdf_visor.inputs["Roughness"].default_value = 0.15

mat_glow_cyan = bpy.data.materials.new("Mat_Glow_Cyan")
mat_glow_cyan.use_nodes = True
bsdf_cyan = mat_glow_cyan.node_tree.nodes.get("Principled BSDF")
if bsdf_cyan:
    bsdf_cyan.inputs["Base Color"].default_value = (0.9, 0.96, 1.0, 1.0)
    bsdf_cyan.inputs["Emission Color"].default_value = (0.2, 0.75, 1.0, 1.0)
    bsdf_cyan.inputs["Emission Strength"].default_value = 4.0

mat_glow_white = bpy.data.materials.new("Mat_Glow_White")
mat_glow_white.use_nodes = True
bsdf_white = mat_glow_white.node_tree.nodes.get("Principled BSDF")
if bsdf_white:
    bsdf_white.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf_white.inputs["Emission Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf_white.inputs["Emission Strength"].default_value = 5.0

mat_glow_mouth = bpy.data.materials.new("Mat_Glow_Mouth")
mat_glow_mouth.use_nodes = True
bsdf_mouth = mat_glow_mouth.node_tree.nodes.get("Principled BSDF")
if bsdf_mouth:
    bsdf_mouth.inputs["Base Color"].default_value = (1.0, 0.95, 0.95, 1.0)
    bsdf_mouth.inputs["Emission Color"].default_value = (0.9, 0.95, 1.0, 1.0)
    bsdf_mouth.inputs["Emission Strength"].default_value = 3.5

# Build Eyelids for Left and Right Eye (disks curved on visor at Y = -0.27, Z = 0.687)
# When Blink = 0, scale.z = 0 (hidden); When Blink = 1, scale.z = 1 (closes eye completely with black visor surface)
# Build Left Eye on visor (Screen Left -X)
bpy.ops.mesh.primitive_cylinder_add(radius=0.088, depth=0.015, vertices=24, location=(-0.171, -0.275, 0.687), rotation=(math.radians(90), 0, 0))
eye_l = bpy.context.object
eye_l.name = "CoopBot_Eye_L"
eye_l.data.materials.append(mat_glow_white)

# Build Right Eye on visor (Screen Right +X)
bpy.ops.mesh.primitive_cylinder_add(radius=0.088, depth=0.015, vertices=24, location=(0.182, -0.275, 0.688), rotation=(math.radians(90), 0, 0))
eye_r = bpy.context.object
eye_r.name = "CoopBot_Eye_R"
eye_r.data.materials.append(mat_glow_white)

# Build Pupils inside Left & Right Eyes (Black circles)
bpy.ops.mesh.primitive_cylinder_add(radius=0.052, depth=0.018, vertices=24, location=(-0.171, -0.280, 0.687), rotation=(math.radians(90), 0, 0))
pupil_l = bpy.context.object
pupil_l.name = "CoopBot_Pupil_L"
pupil_l.data.materials.append(mat_black_visor)

bpy.ops.mesh.primitive_cylinder_add(radius=0.052, depth=0.018, vertices=24, location=(0.182, -0.280, 0.688), rotation=(math.radians(90), 0, 0))
pupil_r = bpy.context.object
pupil_r.name = "CoopBot_Pupil_R"
pupil_r.data.materials.append(mat_black_visor)

# Build Eyelids (Black visor caps that slide down on Blink = 1.0)
bpy.ops.mesh.primitive_cylinder_add(radius=0.092, depth=0.022, vertices=24, location=(-0.171, -0.282, 0.687), rotation=(math.radians(90), 0, 0))
eyelid_l = bpy.context.object
eyelid_l.name = "CoopBot_Eyelid_L"
eyelid_l.data.materials.append(mat_black_visor)

bpy.ops.mesh.primitive_cylinder_add(radius=0.092, depth=0.022, vertices=24, location=(0.182, -0.282, 0.688), rotation=(math.radians(90), 0, 0))
eyelid_r = bpy.context.object
eyelid_r.name = "CoopBot_Eyelid_R"
eyelid_r.data.materials.append(mat_black_visor)

# Build Digital Mouth (Curved smile arc that opens on Speaking = 1.0)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.005, -0.252, 0.531), rotation=(math.radians(90), 0, 0))
mouth = bpy.context.object
mouth.name = "CoopBot_Mouth"
mouth.scale = (0.13, 0.012, 0.035)
mouth.data.materials.append(mat_glow_mouth)

# Shape keys on Eyelids and Mouth
# Eyelid_L Shape Key
basis_el = eyelid_l.shape_key_add(name="Basis", from_mix=False)
blink_el = eyelid_l.shape_key_add(name="Blink", from_mix=False)
# At Basis (Blink=0): Eyelid is pulled up and flattened (eyes open)
for v in basis_el.data:
    v.co.z += 0.12 # Open high above eye
# At Blink=1: Eyelid covers eye completely
for v in blink_el.data:
    v.co.z += 0.0 # Covers eye

basis_er = eyelid_r.shape_key_add(name="Basis", from_mix=False)
blink_er = eyelid_r.shape_key_add(name="Blink", from_mix=False)
for v in basis_er.data:
    v.co.z += 0.12
for v in blink_er.data:
    v.co.z += 0.0

# Mouth Shape Keys (Speaking and Smile)
basis_m = mouth.shape_key_add(name="Basis", from_mix=False)
spk_m = mouth.shape_key_add(name="Speaking", from_mix=False)
smile_m = mouth.shape_key_add(name="Smile", from_mix=False)

# Speaking: Mouth scales open vertically by 3x
for i, v in enumerate(mouth.data.vertices):
    spk_m.data[i].co.z = v.co.z * 3.5 # Wide talking opening
    spk_m.data[i].co.x = v.co.x * 1.2
    smile_m.data[i].co.y += abs(v.co.x) * 0.4 # Curved smile corners

# Parent Eyes and Pupils to Eye_L and Eye_R bones
eye_l.parent = arm_obj
eye_l.parent_type = 'BONE'
eye_l.parent_bone = 'Eye_L'

pupil_l.parent = arm_obj
pupil_l.parent_type = 'BONE'
pupil_l.parent_bone = 'Eye_L'

eyelid_l.parent = arm_obj
eyelid_l.parent_type = 'BONE'
eyelid_l.parent_bone = 'Head'

eye_r.parent = arm_obj
eye_r.parent_type = 'BONE'
eye_r.parent_bone = 'Eye_R'

pupil_r.parent = arm_obj
pupil_r.parent_type = 'BONE'
pupil_r.parent_bone = 'Eye_R'

eyelid_r.parent = arm_obj
eyelid_r.parent_type = 'BONE'
eyelid_r.parent_bone = 'Head'

mouth.parent = arm_obj
mouth.parent_type = 'BONE'
mouth.parent_bone = 'Head'

print("Visor face elements (Eyes, Pupils, Eyelids, Mouth) created and rigged to Armature!")

# -------------------------------------------------------------
# 3. SAVE AND EXPORT
# -------------------------------------------------------------
blend_path = os.path.join(os.getcwd(), "3d-hero", "CoopBot_3D_Hero.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Saved blend file.")

print("=================================================================")
print("FACE RIG AND ARM WEIGHT REFINEMENT COMPLETE!")
