#!/usr/bin/env python3
"""Pack small glTF models (Quaternius Stylized Nature MegaKit, CC0) into src/nature.js.
Only geometry is kept: positions quantized to int16 and triangle indices – the game paints them with its own
toon materials and pattern shader, so the kit's textures are not needed."""
import sys, json, base64, numpy as np
from pygltflib import GLTF2
def acc(g, i, blob):
    a = g.accessors[i]; bv = g.bufferViews[a.bufferView]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a.type]
    dt = np.dtype({5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a.componentType])
    off = (bv.byteOffset or 0) + (a.byteOffset or 0)
    return np.frombuffer(blob, dt, a.count * n, off).reshape(a.count, n)
out = {}
for spec in sys.argv[2:]:
    key, path = spec.split('=', 1)
    g = GLTF2().load(path); blob = g.get_data_from_buffer_uri(g.buffers[0].uri) if g.buffers[0].uri else g.binary_blob()
    P = []; I = []; base = 0
    for m in g.meshes:
        for p in m.primitives:
            pos = acc(g, p.attributes.POSITION, blob).astype(np.float64); idx = acc(g, p.indices, blob).ravel().astype(np.int64)
            P.append(pos); I.append(idx + base); base += len(pos)
    P = np.vstack(P); I = np.concatenate(I)
    s = float(np.abs(P).max()); q = np.round(P / s * 32767).astype(np.int16)
    q, inv = np.unique(q, axis=0, return_inverse=True); I = inv.ravel()[I]  # weld UV seams – the game computes its own normals
    I = I.reshape(-1, 3); I = I[(I[:, 0] != I[:, 1]) & (I[:, 1] != I[:, 2]) & (I[:, 0] != I[:, 2])].ravel(); P = q
    out[key] = {'s': round(s, 4), 'p': base64.b64encode(q.tobytes()).decode(), 'i': base64.b64encode(I.astype(np.uint16).tobytes()).decode()}
    print(key, len(P), 'verts', len(I) // 3, 'tris', file=sys.stderr)
open(sys.argv[1], 'w').write('// Props from Quaternius Stylized Nature MegaKit (CC0), packed by tools/pack_models.py\nconst NATURE=' + json.dumps(out, separators=(',', ':')) + ';\n')
