import bpy

# Load clean GLB and check morph targets
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="3d-hero/exports/CoopBot_Animated.glb")

print("--- GLB MORPH TARGETS & ACTIONS CHECK ---")
for obj in bpy.data.objects:
    print(f"Object: {obj.name}, Type: {obj.type}")
    if obj.data and hasattr(obj.data, "shape_keys") and obj.data.shape_keys:
        print(f"Shape keys found on {obj.name}: {[k.name for k in obj.data.shape_keys.key_blocks]}")

for action in bpy.data.actions:
    print(f"Action in GLB: {action.name}")
