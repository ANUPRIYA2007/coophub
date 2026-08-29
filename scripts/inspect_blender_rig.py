import bpy
import os

print("========================================")
print("INSPECTING COOPBOT_3D_HERO.BLEND RIG & MESH")
print("========================================")

for obj in bpy.data.objects:
    print(f"Object: {obj.name}, Type: {obj.type}")
    if obj.type == 'MESH':
        print(f"  Vertices: {len(obj.data.vertices)}")
        print(f"  Modifiers: {[m.name + ' (' + m.type + ')' for m in obj.modifiers]}")
        print(f"  Vertex Groups ({len(obj.vertex_groups)}): {[vg.name for vg in obj.vertex_groups]}")
        if obj.data.shape_keys:
            print(f"  Shape Keys ({len(obj.data.shape_keys.key_blocks)}): {[kb.name for kb in obj.data.shape_keys.key_blocks]}")
            for kb in obj.data.shape_keys.key_blocks:
                diff_count = 0
                for i, v in enumerate(obj.data.vertices):
                    diff = (kb.data[i].co - v.co).length
                    if diff > 0.001:
                        diff_count += 1
                print(f"    Key '{kb.name}': {diff_count} vertices displaced")
        else:
            print("  NO Shape Keys found on mesh data!")

    if obj.type == 'ARMATURE':
        arm = obj.data
        print(f"  Bones ({len(arm.bones)}): {[b.name for b in arm.bones]}")
        if obj.animation_data:
            print(f"  Current Action: {obj.animation_data.action.name if obj.animation_data.action else 'None'}")
            print(f"  NLA Tracks: {[t.name for t in obj.animation_data.nla_tracks]}")

print("========================================")
print("ALL ACTIONS IN BLENDER FILE:")
for act in bpy.data.actions:
    print(f"  Action: {act.name}, F-Curves: {len(act.fcurves)}, Frame Range: {act.frame_range}")
    for fc in act.fcurves:
        print(f"    Curve: {fc.data_path}[{fc.array_index}], Keyframes: {len(fc.keyframe_points)}")
