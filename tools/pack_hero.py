#!/usr/bin/env python3
"""Pack the Quaternius mannequins (Universal Animation Library, CC0) into src/hero.js for the skinned hero.

  python3 tools/pack_hero.py MALE.glb FEMALE.glb UAL1.glb UAL2.glb '{"idle":["1","Idle_Loop",true],...}' src/hero.js

Per mannequin: skeleton (65 bones, rest TRS + inverse bind matrices) and the body mesh with skin weights.
The head is cut away (the game puts its own big stylised head on the Head bone) and every vertex gets a
"part" id (skin, tunic, sleeve, pants, wraps, shoes, belt) so the game can paint the outfit with its palette.
Animations: bone rotations sampled at 20 fps (int16), pelvis position, shared by both mannequins."""
import sys, json, base64, numpy as np
from pygltflib import GLTF2
from scipy.spatial.transform import Rotation as Rot, Slerp
FPS = 20

def acc(g, i, blob):
    a = g.accessors[i]; bv = g.bufferViews[a.bufferView]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a.type]
    dt = np.dtype({5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a.componentType])
    off = (bv.byteOffset or 0) + (a.byteOffset or 0); st = bv.byteStride or n * dt.itemsize
    if st == n * dt.itemsize: out = np.frombuffer(blob, dt, a.count * n, off).reshape(a.count, n)
    else: out = np.array([np.frombuffer(blob, dt, n, off + k * st) for k in range(a.count)])
    if a.normalized and dt == np.uint8: return out.astype(np.float64) / 255
    if a.normalized and dt == np.uint16: return out.astype(np.float64) / 65535
    return out.astype(np.float64)
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()

PART = {'skin': 0, 'tunic': 1, 'sleeve': 2, 'pants': 3, 'wraps': 4, 'shoe': 5, 'belt': 6}

def pack_body(path):
    g = GLTF2().load(path); blob = g.binary_blob(); sk = g.skins[0]; J = sk.joints; names = [g.nodes[j].name for j in J]
    parent = {}
    for i, n in enumerate(g.nodes):
        for c in (n.children or []): parent[c] = i
    bones = []
    for j in J:
        n = g.nodes[j]; p = parent.get(j, -1)
        bones.append({'n': n.name, 'p': J.index(p) if p in J else -1, 't': [round(x, 6) for x in (n.translation or [0, 0, 0])],
                      'r': [round(x, 7) for x in (n.rotation or [0, 0, 0, 1])], 's': [round(x, 5) for x in (n.scale or [1, 1, 1])]})
    ibm = acc(g, sk.inverseBindMatrices, blob).astype(np.float32)
    P = []; JI = []; JW = []; I = []; base = 0
    for prim in g.meshes[0].primitives:
        pos = acc(g, prim.attributes.POSITION, blob); ji = acc(g, prim.attributes.JOINTS_0, blob).astype(int); jw = acc(g, prim.attributes.WEIGHTS_0, blob)
        idx = acc(g, prim.indices, blob).ravel().astype(int)
        P.append(pos); JI.append(ji); JW.append(jw); I.append(idx + base); base += len(pos)
    P = np.vstack(P); JI = np.vstack(JI); JW = np.vstack(JW); I = np.concatenate(I).reshape(-1, 3)
    # weld seams (same position) so the game can compute smooth normals
    key = np.round(P * 2000).astype(np.int64); _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.ravel(); P = P[first]; JI = JI[first]; JW = JW[first]; I = inv[I]
    dom = JI[np.arange(len(JI)), JW.argmax(1)]; dn = np.array(names)[dom]
    head = names.index('Head'); drop = np.all(dom[I] == head, axis=1); I = I[~drop]
    I = I[(I[:, 0] != I[:, 1]) & (I[:, 1] != I[:, 2]) & (I[:, 0] != I[:, 2])]
    used = np.unique(I); remap = -np.ones(len(P), int); remap[used] = np.arange(len(used)); P = P[used]; JI = JI[used]; JW = JW[used]; dn = dn[used]; I = remap[I]
    y = P[:, 1]; part = np.full(len(P), PART['tunic'], np.uint8)
    for k, nm in enumerate(dn):
        if nm.startswith(('hand', 'thumb', 'index', 'middle', 'ring', 'pinky', 'neck', 'Head')): part[k] = PART['skin']
        elif nm.startswith('lowerarm'): part[k] = PART['skin'] if y[k] < 1.2 else PART['sleeve']
        elif nm.startswith(('upperarm', 'clavicle')): part[k] = PART['sleeve']
        elif nm.startswith(('foot', 'ball')): part[k] = PART['shoe']
        elif nm.startswith('calf'): part[k] = PART['wraps'] if y[k] < 0.32 else PART['pants']
        elif nm.startswith('thigh'): part[k] = PART['tunic'] if y[k] > 0.8 else PART['pants']
        elif nm in ('pelvis', 'spine_01'): part[k] = PART['belt'] if 0.93 < y[k] < 1.0 else PART['tunic']
    s = float(np.abs(P).max()); q = np.round(P / s * 32767).astype(np.int16)
    w = np.round(JW / np.maximum(JW.sum(1, keepdims=True), 1e-9) * 255).astype(np.int16); w[:, 0] += 255 - w.sum(1)
    print(path.split('/')[-1], len(P), 'verts', len(I), 'tris', file=sys.stderr)
    return {'bones': bones, 'ibm': b64(ibm), 's': round(s, 5), 'p': b64(q), 'j': b64(JI.astype(np.uint8)), 'w': b64(w.astype(np.uint8)),
            'part': b64(part), 'i': b64(I.astype(np.uint16).ravel())}, names

def sample_clips(libs, clips, names):
    out = {}
    for key, (li, cname, loop) in clips.items():
        g = libs[li]; blob = g.binary_blob(); a = next(x for x in g.animations if x.name == cname)
        nodes = {n.name: i for i, n in enumerate(g.nodes)}; ch = {}
        dur = 0
        for c in a.channels:
            s = a.samplers[c.sampler]; t = acc(g, s.input, blob)[:, 0]; v = acc(g, s.output, blob); dur = max(dur, t[-1])
            ch[(g.nodes[c.target.node].name, c.target.path)] = (t, v)
        n = max(2, int(round(dur * FPS)) + (0 if loop else 1)); T = np.minimum(np.arange(n) / FPS, dur)
        tracks = []
        for bi, nm in enumerate(names):
            if (nm, 'rotation') not in ch: continue
            t, v = ch[(nm, 'rotation')]
            Q = v[[0] * n] if len(t) == 1 else Slerp(t, Rot.from_quat(v))(np.clip(T, t[0], t[-1])).as_quat()
            for k in range(1, n):
                if np.dot(Q[k], Q[k - 1]) < 0: Q[k] = -Q[k]
            if np.abs(Q - Q[0]).max() < 2e-3: Q = Q[:1]
            tracks.append([bi, len(Q), b64(np.round(Q * 32767).astype(np.int16))])
        pt, pv = ch.get(('pelvis', 'translation'), (None, None)); pos = None
        if pt is not None:
            Pp = np.array([np.interp(T, pt, pv[:, k]) for k in range(3)]).T
            pos = b64(np.round(Pp * 16383).astype(np.int16))
        out[key] = {'fps': FPS, 'n': n, 'loop': bool(loop), 'tr': tracks, 'pos': pos}
        print(key, cname, round(dur, 2), 's', len(tracks), 'tracks', file=sys.stderr)
    return out

if __name__ == '__main__':
    male, names = pack_body(sys.argv[1]); fem, names2 = pack_body(sys.argv[2]); assert names == names2
    libs = {'1': GLTF2().load(sys.argv[3]), '2': GLTF2().load(sys.argv[4])}
    anims = sample_clips(libs, json.loads(sys.argv[5]), names)
    open(sys.argv[6], 'w').write('// Skinned hero: Quaternius Universal Animation Library mannequins + animations (CC0), packed by tools/pack_hero.py\nconst HERO_DATA=' +
                                 json.dumps({'m': male, 'f': fem, 'anims': anims}, separators=(',', ':')) + ';\n')
