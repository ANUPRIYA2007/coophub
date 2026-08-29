import bpy
import math
import os
import shutil

print("--- RENDERING ADDITIONAL POSES ---")

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.image_settings.file_format = 'PNG'

# Setup Camera if needed
if not scene.camera:
    cam_data = bpy.data.cameras.new("RenderCam")
    cam_obj = bpy.data.objects.new("RenderCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

camera = scene.camera

output_dir = os.path.join(os.getcwd(), "3d-hero", "documentation")
artifact_dir = r"C:\Users\hp\.gemini\antigravity-ide\brain\5acac303-c777-4512-af36-e68bc4351c3a"

# Key Light
if "KeyLight" not in bpy.data.objects:
    light_data = bpy.data.lights.new(name="KeyLight", type='AREA')
    light_data.energy = 400
    light_data.size = 2.0
    light_obj = bpy.data.objects.new(name="KeyLight", object_data=light_data)
    light_obj.location = (2.0, -2.5, 2.0)
    scene.collection.objects.link(light_obj)

# Render 1: Close-up Face & Visor Headshot
camera.location = (0.35, -1.35, 0.65)
camera.rotation_euler = (math.radians(85), 0, math.radians(15))
p1 = os.path.join(output_dir, "CoopBot_3D_Face_Closeup.png")
scene.render.filepath = p1
bpy.ops.render.render(write_still=True)
shutil.copy(p1, os.path.join(artifact_dir, "coopbot_3d_face_closeup.png"))

# Render 2: Front Standing Full View
camera.location = (0.0, -3.1, 0.1)
camera.rotation_euler = (math.radians(88), 0, 0)
p2 = os.path.join(output_dir, "CoopBot_3D_Front_Full.png")
scene.render.filepath = p2
bpy.ops.render.render(write_still=True)
shutil.copy(p2, os.path.join(artifact_dir, "coopbot_3d_front_full.png"))

print("ALL RENDERS FINISHED!")
