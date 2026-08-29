import bpy
import os
import shutil

print("=================================================================")
print("REMOVING EXTRA FLOATING HELPER MESHES FROM COOPBOT")
print("=================================================================")

if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')

# List of extra helper mesh names to remove
extra_objects = [
    "CoopBot_Eye_L", "CoopBot_Eye_R",
    "CoopBot_Pupil_L", "CoopBot_Pupil_R",
    "CoopBot_Eyelid_L", "CoopBot_Eyelid_R",
    "CoopBot_Mouth", "CoopBot_Eyes", "CoopBot_Eyelids"
]

removed_count = 0
for obj_name in extra_objects:
    obj = bpy.data.objects.get(obj_name)
    if obj:
        print(f"Removing extra object: {obj_name}")
        bpy.data.objects.remove(obj, do_unlink=True)
        removed_count += 1

# Also check for any objects that are not CoopBot_Mesh, Armature_CoopBot, or lighting/camera
for obj in list(bpy.data.objects):
    if obj.name not in ["CoopBot_Mesh", "Armature_CoopBot", "StudioCam", "KeyLight", "FillLight", "RimLight", "ProofCam", "ProofLight", "VideoCam"]:
        if obj.type == 'MESH':
            print(f"Removing unneeded mesh object: {obj.name}")
            bpy.data.objects.remove(obj, do_unlink=True)
            removed_count += 1

print(f"Removed {removed_count} extra helper objects. Only original CoopBot_Mesh and Armature remain.")

# Save master blend
blend_path = os.path.join(os.getcwd(), "3d-hero", "CoopBot_3D_Hero.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Saved clean blend file to: {blend_path}")

# Re-export clean GLB
export_glb_path = os.path.join(os.getcwd(), "3d-hero", "exports", "CoopBot_Animated.glb")
public_glb_path = os.path.join(os.getcwd(), "public", "assets", "3d", "CoopBot_Animated.glb")

bpy.ops.export_scene.gltf(
    filepath=export_glb_path,
    export_format='GLB',
    use_selection=False,
    export_animations=True,
    export_morph=True,
    export_skins=True,
    export_all_influences=True
)
print(f"Exported clean production GLB to: {export_glb_path}")
shutil.copy(export_glb_path, public_glb_path)
print(f"Copied clean GLB to runtime path: {public_glb_path}")

print("=================================================================")
print("CLEANUP COMPLETE! GLB UPDATED.")
