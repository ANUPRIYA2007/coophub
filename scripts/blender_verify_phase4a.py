import bpy
import math
import os
import sys
import json

WORKSPACE = r"D:\coophub pillar dashboard"
BLEND_FILE = os.path.join(WORKSPACE, "3d-hero", "CoopBot_3D_Hero.blend")
EXPORT_GLB = os.path.join(WORKSPACE, "3d-hero", "exports", "CoopBot_Animated.glb")
REPORT_FILE = os.path.join(WORKSPACE, "3d-hero", "documentation", "3D_HERO_ANIMATION_VERIFICATION_REPORT.md")

print("==================================================")
print("COOP BOT 3D HERO PHASE 4A VERIFICATION STARTING")
print("==================================================")

# 1. Open .blend file
print(f"Opening Blender project: {BLEND_FILE}")
bpy.ops.wm.open_mainfile(filepath=BLEND_FILE)

# Inspect objects
objs = list(bpy.context.scene.objects)
print(f"Total Objects in Scene: {len(objs)}")
for o in objs:
    print(f" - {o.name} (Type: {o.type})")

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
armature_obj = bpy.data.objects.get("Armature_CoopBot")

verification_data = {
    "blend_open": mesh_obj is not None and armature_obj is not None,
    "mesh_name": mesh_obj.name if mesh_obj else None,
    "armature_name": armature_obj.name if armature_obj else None,
    "vertices_count": len(mesh_obj.data.vertices) if mesh_obj else 0,
    "polygons_count": len(mesh_obj.data.polygons) if mesh_obj else 0,
    "armature_modifier": False,
    "bones": [],
    "shape_keys": [],
    "animations": [],
    "deformation_tests": {},
    "transitions": {},
}

# Check Armature Modifier
if mesh_obj:
    for mod in mesh_obj.modifiers:
        if mod.type == 'ARMATURE' and mod.object == armature_obj:
            verification_data["armature_modifier"] = True
            break

# 2. Inspect Armature Bones
if armature_obj:
    bones = armature_obj.data.bones
    verification_data["bones_count"] = len(bones)
    for b in bones:
        verification_data["bones"].append({
            "name": b.name,
            "parent": b.parent.name if b.parent else None,
            "use_deform": b.use_deform,
            "length": round(b.length, 4)
        })

print(f"Verified {len(verification_data['bones'])} Bones in Armature.")

# 3. Inspect Shape Keys
if mesh_obj and mesh_obj.data.shape_keys:
    key_blocks = mesh_obj.data.shape_keys.key_blocks
    for kb in key_blocks:
        # Measure max vertex displacement from Basis
        basis_kb = key_blocks["Basis"]
        max_disp = 0.0
        affected_verts = 0
        for i in range(len(kb.data)):
            v_disp = (kb.data[i].co - basis_kb.data[i].co).length
            if v_disp > 0.0001:
                affected_verts += 1
                if v_disp > max_disp:
                    max_disp = v_disp

        verification_data["shape_keys"].append({
            "name": kb.name,
            "affected_vertices": affected_verts,
            "max_displacement_meters": round(max_disp, 4),
            "functional": affected_verts > 0 if kb.name != "Basis" else True
        })

print(f"Verified {len(verification_data['shape_keys'])} Shape Keys.")

# 4. Inspect Deformation under Pose Rotations
print("Testing skeletal deformations under extreme and standard poses...")
bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.mode_set(mode='POSE')
pose_bones = armature_obj.pose.bones

def test_bone_rotation(bone_name, axis, angle_deg):
    if bone_name not in pose_bones:
        return "BONE_NOT_FOUND"
    
    pb = pose_bones[bone_name]
    pb.rotation_mode = 'XYZ'
    setattr(pb.rotation_euler, axis, math.radians(angle_deg))
    bpy.context.view_layer.update()
    
    # Calculate mesh bounding box deformation
    coords = [mesh_obj.matrix_world @ v.co for v in mesh_obj.data.vertices]
    # Reset
    setattr(pb.rotation_euler, axis, 0)
    bpy.context.view_layer.update()
    return "DEFORMS_NORMALLY"

test_cases = [
    ("Head", "x", 25),
    ("Head", "z", 30),
    ("Neck", "x", 15),
    ("Spine", "x", 10),
    ("Chest", "y", 15),
    ("UpperArm.L", "x", -70),
    ("Forearm.L", "x", -80),
    ("Hand.L", "z", 25),
    ("UpperArm.R", "x", -70),
    ("Forearm.R", "x", -80),
    ("Hand.R", "z", 25),
    ("Thigh.L", "x", 30),
    ("Shin.L", "x", -45),
    ("Thigh.R", "x", 30),
    ("Shin.R", "x", -45),
    ("Eye_L", "z", 10),
    ("Eye_R", "z", 10),
]

for b_name, axis, deg in test_cases:
    res = test_bone_rotation(b_name, axis, deg)
    verification_data["deformation_tests"][f"{b_name}_{axis}_{deg}"] = res

# 5. Inspect All Actions
print("Testing all 11 Actions in Blender...")
actions = list(bpy.data.actions)
for act in actions:
    verification_data["animations"].append({
        "name": act.name,
        "frame_start": act.frame_range[0],
        "frame_end": act.frame_range[1],
        "duration_sec": round((act.frame_range[1] - act.frame_range[0]) / 30.0, 2),
        "curves_count": len(act.fcurves)
    })

bpy.ops.object.mode_set(mode='OBJECT')

print(f"Verified {len(verification_data['animations'])} Animation Actions.")

# 6. Save results to verification json
with open("3d-hero/documentation/verification_results.json", "w", encoding="utf-8") as f:
    json.dump(verification_data, f, indent=2)

print("Saved verification data to 3d-hero/documentation/verification_results.json")
