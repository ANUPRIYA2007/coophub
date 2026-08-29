import bpy
import math

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

# Find front visor vertices in local head bone space
head_bone = arm_obj.data.bones.get("Head")
print(f"Head Bone in Armature: Head={head_bone.head_local}, Tail={head_bone.tail_local}")

# Visor vertices on mesh
visor_verts = [v for v in mesh_obj.data.vertices if v.co.y < -0.20 and 0.50 < v.co.z < 0.85 and abs(v.co.x) < 0.28]
print(f"Total front visor vertices: {len(visor_verts)}")

min_x = min(v.co.x for v in visor_verts)
max_x = max(v.co.x for v in visor_verts)
min_y = min(v.co.y for v in visor_verts)
max_y = max(v.co.y for v in visor_verts)
min_z = min(v.co.z for v in visor_verts)
max_z = max(v.co.z for v in visor_verts)

print(f"Visor Bounding Box: X=[{min_x:.3f}, {max_x:.3f}], Y=[{min_y:.3f}, {max_y:.3f}], Z=[{min_z:.3f}, {max_z:.3f}]")
print(f"Visor Center: ({(min_x+max_x)/2:.3f}, {(min_y+max_y)/2:.3f}, {(min_z+max_z)/2:.3f})")
print(f"Visor Dimensions: Width={max_x - min_x:.3f}m, Height={max_z - min_z:.3f}m, Depth={max_y - min_y:.3f}m")
