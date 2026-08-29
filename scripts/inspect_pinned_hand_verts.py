import bpy

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")

print("--- EXAMINING HAND VERTEX GROUP ASSIGNMENTS ---")
# Find vertices with X > 0.20 and Z < -0.05
pinned_verts = []
for i, v in enumerate(mesh_obj.data.vertices):
    if v.co.x > 0.22 and -0.25 < v.co.z < 0.0:
        groups = [(mesh_obj.vertex_groups[g.group].name, g.weight) for g in v.groups]
        pinned_verts.append((i, v.co, groups))

print(f"Total hand vertices found in pocket region: {len(pinned_verts)}")
for i, co, grps in pinned_verts[:20]:
    print(f"Vert {i}: co=({co.x:.3f}, {co.y:.3f}, {co.z:.3f}), groups={grps}")
