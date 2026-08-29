import bpy
import bmesh
import math
import os

print("--- ANALYZING ARM & HAND TOPOLOGY ---")
mesh_obj = bpy.data.objects.get("CoopBot_Mesh")

bm = bmesh.new()
bm.from_mesh(mesh_obj.data)
bm.verts.ensure_lookup_table()
bm.faces.ensure_lookup_table()

# Right Arm (screen right +X > 0.20, Z < 0.45)
# Find faces belonging to the arm and hand
arm_r_verts = [v for v in bm.verts if v.co.x > 0.21 and -0.25 < v.co.z < 0.44]
arm_r_faces = [f for f in bm.faces if any(v in arm_r_verts for v in f.verts)]

# Find faces belonging to the pocket / torso (X between 0.15 and 0.28, Z between -0.25 and 0.0, Y between -0.20 and 0.05)
pocket_r_verts = [v for v in bm.verts if 0.14 < v.co.x < 0.26 and -0.25 < v.co.z < 0.02 and v.co.y < 0.02]

print(f"Total Right Arm Verts: {len(arm_r_verts)}, Faces: {len(arm_r_faces)}")
print(f"Total Pocket Area Verts: {len(pocket_r_verts)}")

# Let's inspect the boundary edges where arm meets torso/pocket
boundary_edges = []
for v in arm_r_verts:
    for e in v.link_edges:
        other = e.other_vert(v)
        if other not in arm_r_verts and other.co.x < 0.21:
            boundary_edges.append(e)

print(f"Total boundary edges connecting Right Arm to Torso/Pocket: {len(boundary_edges)}")

bm.free()
