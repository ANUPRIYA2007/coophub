import bpy
import mathutils
import math

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

print("--- ROTATION MODE & DEFORMATION CHECK ---")
for pb in arm_obj.pose.bones:
    print(f"Pose Bone '{pb.name}': rotation_mode = '{pb.rotation_mode}'")

# Let's test rotating UpperArm.R by 90 degrees with QUATERNION and checking mesh vertex displacement!
pb_arm = arm_obj.pose.bones.get("UpperArm.R")
pb_arm.rotation_mode = 'XYZ'
pb_arm.rotation_euler = (math.radians(90), 0, 0)
bpy.context.view_layer.update()

# Let's inspect hand vertices after update
hand_v = mesh_obj.data.vertices[100] # let's check a hand vertex
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_mesh_obj = mesh_obj.evaluated_get(depsgraph)
eval_mesh = eval_mesh_obj.to_mesh()

print(f"Original vertex 100 co: {mesh_obj.data.vertices[100].co}")
print(f"Evaluated vertex 100 co: {eval_mesh.vertices[100].co}")

# Let's find vertices with highest displacement
max_disp = 0
for i in range(len(mesh_obj.data.vertices)):
    disp = (eval_mesh.vertices[i].co - mesh_obj.data.vertices[i].co).length
    if disp > max_disp:
        max_disp = disp

print(f"Max mesh vertex displacement when UpperArm.R rotated 90 deg: {max_disp:.4f} meters")
