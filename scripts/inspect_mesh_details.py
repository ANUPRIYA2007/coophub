import bpy

print("--- MESH DETAILS INSPECTION ---")
mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

print(f"Mesh Object: {mesh_obj}")
print(f"Armature Object: {arm_obj}")

if mesh_obj:
    print(f"Modifiers on Mesh:")
    for mod in mesh_obj.modifiers:
        print(f"  - {mod.name}: type={mod.type}, show_viewport={mod.show_viewport}, show_render={mod.show_render}")
        if mod.type == 'ARMATURE':
            print(f"    object={mod.object}, use_vertex_groups={mod.use_vertex_groups}")

    print(f"Vertex Groups count: {len(mesh_obj.vertex_groups)}")
    for vg in mesh_obj.vertex_groups:
        # count how many vertices have weight > 0
        w_count = 0
        max_w = 0.0
        for v in mesh_obj.data.vertices:
            for g in v.groups:
                if g.group == vg.index and g.weight > 0.01:
                    w_count += 1
                    if g.weight > max_w: max_w = g.weight
        print(f"  Group '{vg.name}': {w_count} vertices, max weight: {max_w:.2f}")

    if mesh_obj.data.shape_keys:
        print(f"Shape Keys:")
        for kb in mesh_obj.data.shape_keys.key_blocks:
            displaced = []
            for i, v in enumerate(mesh_obj.data.vertices):
                diff = (kb.data[i].co - v.co).length
                if diff > 0.005:
                    displaced.append((i, diff, v.co))
            print(f"  ShapeKey '{kb.name}': {len(displaced)} vertices displaced > 5mm")
            if displaced:
                print(f"    Sample displaced vert co: {displaced[0][2]}, max displacement: {max(d[1] for d in displaced):.4f}")
