import bpy
import numpy as np

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
verts = mesh_obj.data.vertices

print("=== EXACT VERTEX REGION EXTRACTION ===")
print(f"Total Vertices: {len(verts)}")

# Find bounding box
coords = np.array([v.co for v in verts])
min_c = coords.min(axis=0)
max_c = coords.max(axis=0)
print(f"Mesh Bounds: min={min_c}, max={max_c}")

# Front Visor Vertices (Y < -0.12, Z between 0.48 and 0.82, |X| < 0.35)
visor_indices = [i for i, v in enumerate(verts) if v.co.y < -0.12 and 0.48 < v.co.z < 0.82 and abs(v.co.x) < 0.35]
print(f"Front Visor Vertices: {len(visor_indices)}")

# Left Eye Region (Character Left = +X or -X? Let's check X)
# In viewer's view facing character (looking from -Y to +Y):
# Screen Right is +X (Character's Right if looking towards -Y) or Screen Left is -X (Character's Left if looking towards -Y)
eye_screen_left = [i for i, v in enumerate(verts) if v.co.y < -0.16 and 0.58 < v.co.z < 0.74 and -0.26 < v.co.x < -0.04]
eye_screen_right = [i for i, v in enumerate(verts) if v.co.y < -0.16 and 0.58 < v.co.z < 0.74 and 0.04 < v.co.x < 0.26]
print(f"Eye Screen Left (-X): {len(eye_screen_left)} verts, Center Z={coords[eye_screen_left, 2].mean():.3f}, Y={coords[eye_screen_left, 1].mean():.3f}, X={coords[eye_screen_left, 0].mean():.3f}")
print(f"Eye Screen Right (+X): {len(eye_screen_right)} verts, Center Z={coords[eye_screen_right, 2].mean():.3f}, Y={coords[eye_screen_right, 1].mean():.3f}, X={coords[eye_screen_right, 0].mean():.3f}")

# Mouth Region (Z between 0.49 and 0.58, Y < -0.16, |X| < 0.14)
mouth_indices = [i for i, v in enumerate(verts) if v.co.y < -0.16 and 0.49 < v.co.z < 0.58 and abs(v.co.x) < 0.14]
print(f"Mouth Region Vertices: {len(mouth_indices)}, Center Z={coords[mouth_indices, 2].mean():.3f}, Y={coords[mouth_indices, 1].mean():.3f}")

# Eyebrows / Upper Visor Region (Z between 0.72 and 0.80, Y < -0.16)
brow_left = [i for i, v in enumerate(verts) if v.co.y < -0.16 and 0.72 < v.co.z < 0.80 and -0.24 < v.co.x < -0.04]
brow_right = [i for i, v in enumerate(verts) if v.co.y < -0.16 and 0.72 < v.co.z < 0.80 and 0.04 < v.co.x < 0.24]
print(f"Eyebrow Left: {len(brow_left)}, Eyebrow Right: {len(brow_right)}")

# Arm & Hand Geometry:
# Right Arm (screen left -X): X < -0.20
# Left Arm (screen right +X): X > 0.20
arm_left_verts = [i for i, v in enumerate(verts) if v.co.x < -0.22 and -0.30 < v.co.z < 0.45]
arm_right_verts = [i for i, v in enumerate(verts) if v.co.x > 0.22 and -0.30 < v.co.z < 0.45]
print(f"Arm Left (screen left -X) Vertices: {len(arm_left_verts)}")
print(f"Arm Right (screen right +X) Vertices: {len(arm_right_verts)}")

hand_left_verts = [i for i, v in enumerate(verts) if v.co.x < -0.20 and -0.25 < v.co.z < 0.05 and v.co.y < 0.05]
hand_right_verts = [i for i, v in enumerate(verts) if v.co.x > 0.20 and -0.25 < v.co.z < 0.05 and v.co.y < 0.05]
print(f"Hand Left (screen left -X): {len(hand_left_verts)}, Center: {coords[hand_left_verts].mean(axis=0)}")
print(f"Hand Right (screen right +X): {len(hand_right_verts)}, Center: {coords[hand_right_verts].mean(axis=0)}")
