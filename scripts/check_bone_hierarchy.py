import bpy

arm_obj = bpy.data.objects.get("Armature_CoopBot")
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='EDIT')

print("--- BONE HIERARCHY & PARENT CHECK ---")
for b in arm_obj.data.edit_bones:
    parent_name = b.parent.name if b.parent else "None"
    print(f"Bone '{b.name}': Parent='{parent_name}', Head={b.head}, Tail={b.tail}")

bpy.ops.object.mode_set(mode='OBJECT')
