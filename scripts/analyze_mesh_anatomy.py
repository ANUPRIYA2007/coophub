import bpy
import mathutils

mesh_obj = bpy.data.objects.get("CoopBot_Mesh")
arm_obj = bpy.data.objects.get("Armature_CoopBot")

print("--- DETAILED VERTEX AND BONE COORDINATE ANALYSIS ---")
bpy.context.view_layer.objects.active = arm_obj

# Let's inspect the rest positions of bones
for b in arm_obj.data.bones:
    print(f"Bone '{b.name}': head={b.head_local}, tail={b.tail_local}, length={b.length:.3f}, parent={b.parent.name if b.parent else 'None'}")

# Let's inspect the visor / face coordinates
visor_verts = []
mouth_verts = []
eye_l_verts = []
eye_r_verts = []
hand_l_verts = []
hand_r_verts = []

for i, v in enumerate(mesh_obj.data.vertices):
    # Head area: Z > 0.45
    # Visor front: Y < 0.0, Z between 0.45 and 0.85
    co = v.co
    if co.z > 0.50 and co.z < 0.78 and co.y < -0.10 and abs(co.x) < 0.35:
        visor_verts.append((i, co))
    # Mouth area: Z between 0.50 and 0.58, Y < -0.15, abs(X) < 0.15
    if co.z > 0.50 and co.z < 0.58 and co.y < -0.12 and abs(co.x) < 0.15:
        mouth_verts.append((i, co))
    # Left eye area: Z between 0.58 and 0.74, Y < -0.12, X between 0.06 and 0.25
    if co.z > 0.58 and co.z < 0.74 and co.y < -0.12 and co.x > 0.05 and co.x < 0.25:
        eye_l_verts.append((i, co))
    # Right eye area: Z between 0.58 and 0.74, Y < -0.12, X between -0.25 and -0.05
    if co.z > 0.58 and co.z < 0.74 and co.y < -0.12 and co.x < -0.05 and co.x > -0.25:
        eye_r_verts.append((i, co))
    # Right hand: X < -0.20, Y between -0.15 and 0.15, Z between -0.05 and 0.25
    if co.x < -0.18 and co.z > -0.05 and co.z < 0.25:
        hand_r_verts.append((i, co))
    # Left hand: X > 0.18, Y between -0.15 and 0.15, Z between -0.05 and 0.25
    if co.x > 0.18 and co.z > -0.05 and co.z < 0.25:
        hand_l_verts.append((i, co))

print(f"Detected {len(visor_verts)} visor verts, {len(mouth_verts)} mouth verts, {len(eye_l_verts)} Eye.L verts, {len(eye_r_verts)} Eye.R verts")
print(f"Detected {len(hand_r_verts)} Hand.R verts, {len(hand_l_verts)} Hand.L verts")
