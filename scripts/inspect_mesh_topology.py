import bpy
import bmesh

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")

print("--- TOPOLOGY INSPECTION OF HANDS & POCKETS ---")
# Let's inspect vertices around X > 0.20, Z between -0.25 and 0.05, Y between -0.15 and 0.05
# Check connected faces and edges to see if the hand is a separate shell or connected to the pants/torso
bm = bmesh.new()
bm.from_mesh(mesh_obj.data)
bm.verts.ensure_lookup_table()

hand_r_verts = [v for v in bm.verts if v.co.x > 0.20 and -0.25 < v.co.z < 0.05 and v.co.y < 0.05]
print(f"Total hand/pocket candidate vertices in box: {len(hand_r_verts)}")

# Check connectivity: find connected components (island check)
visited = set()
islands = []

for v in bm.verts:
    if v in visited:
        continue
    # BFS
    island = []
    queue = [v]
    visited.add(v)
    while queue:
        curr = queue.pop(0)
        island.append(curr)
        for edge in curr.link_edges:
            other = edge.other_vert(curr)
            if other not in visited:
                visited.add(other)
                queue.append(other)
    islands.append(island)

print(f"Total mesh islands (discrete geometry parts): {len(islands)}")
for idx, isl in enumerate(islands):
    # Find bounding box of island
    min_x = min(v.co.x for v in isl)
    max_x = max(v.co.x for v in isl)
    min_z = min(v.co.z for v in isl)
    max_z = max(v.co.z for v in isl)
    min_y = min(v.co.y for v in isl)
    max_y = max(v.co.y for v in isl)
    print(f"Island {idx}: {len(isl)} vertices, X=[{min_x:.3f}, {max_x:.3f}], Y=[{min_y:.3f}, {max_y:.3f}], Z=[{min_z:.3f}, {max_z:.3f}]")

bm.free()
