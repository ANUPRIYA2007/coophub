import bpy
import math
import os

print("--- RENDERING 3D HERO PREVIEWS ---")

# Setup Scene Camera
camera_data = bpy.data.cameras.new(name="RenderCamera")
camera_data.lens = 65
camera_obj = bpy.data.objects.new("RenderCamera", camera_data)
bpy.context.scene.collection.objects.link(camera_obj)
bpy.context.scene.camera = camera_obj

# Position camera for full-body 3/4 perspective shot
camera_obj.location = (1.8, -3.2, 0.4)
camera_obj.rotation_euler = (math.radians(82), 0, math.radians(28))

# Setup 3-Point Studio Lights
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("StudioWorld")
    bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs[0].default_value = (0.04, 0.07, 0.12, 1.0) # Deep Navy Studio Background
    bg_node.inputs[1].default_value = 1.0

# Key Light
key_light_data = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light_data.energy = 450
key_light_data.size = 1.8
key_light_data.color = (1.0, 0.95, 0.88)
key_light_obj = bpy.data.objects.new(name="KeyLight", object_data=key_light_data)
key_light_obj.location = (2.2, -2.5, 2.0)
key_light_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(40))
bpy.context.scene.collection.objects.link(key_light_obj)

# Fill Light
fill_light_data = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light_data.energy = 220
fill_light_data.size = 2.5
fill_light_data.color = (0.7, 0.85, 1.0)
fill_light_obj = bpy.data.objects.new(name="FillLight", object_data=fill_light_data)
fill_light_obj.location = (-2.5, -2.0, 1.2)
bpy.context.scene.collection.objects.link(fill_light_obj)

# Rim Light (Orange highlight)
rim_light_data = bpy.data.lights.new(name="RimLight", type='SPOT')
rim_light_data.energy = 600
rim_light_data.spot_size = math.radians(60)
rim_light_data.color = (1.0, 0.48, 0.0) # Orange Rim
rim_light_obj = bpy.data.objects.new(name="RimLight", object_data=rim_light_data)
rim_light_obj.location = (-0.8, 2.5, 2.2)
rim_light_obj.rotation_euler = (math.radians(-135), 0, math.radians(20))
bpy.context.scene.collection.objects.link(rim_light_obj)

# Render settings (EEVEE)
bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.types, 'RenderSettings') and 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
bpy.context.scene.render.resolution_x = 1200
bpy.context.scene.render.resolution_y = 1200
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = 'PNG'

# Render 1: Full Body 3D Studio Shot
output_dir = os.path.join(os.getcwd(), "3d-hero", "documentation")
os.makedirs(output_dir, exist_ok=True)
output_path1 = os.path.join(output_dir, "CoopBot_3D_Studio_Full.png")
bpy.context.scene.render.filepath = output_path1
bpy.ops.render.render(write_still=True)
print(f"Rendered: {output_path1}")

# Render 2: Close-up Head & Visor
camera_obj.location = (0.7, -1.4, 0.65)
camera_obj.rotation_euler = (math.radians(84), 0, math.radians(24))
output_path2 = os.path.join(output_dir, "CoopBot_3D_Studio_Closeup.png")
bpy.context.scene.render.filepath = output_path2
bpy.ops.render.render(write_still=True)
print(f"Rendered: {output_path2}")

# Copy to artifact directory for presentation
artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\5acac303-c777-4512-af36-e68bc4351c3a"
import shutil
shutil.copy(output_path1, os.path.join(artifact_dir, "coopbot_3d_full.png"))
shutil.copy(output_path2, os.path.join(artifact_dir, "coopbot_3d_closeup.png"))
print("Copied renders to artifact directory successfully!")
