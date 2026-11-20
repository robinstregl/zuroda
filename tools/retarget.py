#!/usr/bin/env python3
"""Retarget clips from Quaternius' Universal Animation Library (CC0) onto Zuroda's code-built hero.

The hero has no skeleton: it is a tree of pivot groups (hips, spine, neck, sh/el/hand, leg/knee/foot)
whose limbs hang along -Y and who faces +Z (its left side is +X). For every frame we read the mannequin's
joint positions and turn them into local rotations of those pivots:
  * hips / torso / head: a full frame built from the side axis (left-right joints) and an up axis
  * limbs: the smallest rotation that points the segment (-Y at rest) along the mannequin's bone
Output: src/anims.js with `const ANIM_DATA={clip:{fps,n,loop,d:<base64 int8>}}`.
Per frame: hips q, hips dy, spine q, neck q, then sh,el,hand,leg,knee,foot for [right, left] – 61 values.
"""
import sys, json, base64, numpy as np
from pygltflib import GLTF2
from scipy.spatial.transform import Rotation as Rot, Slerp

FPS = 24

def accessor(g, idx, blob):
    a = g.accessors[idx]; bv = g.bufferViews[a.bufferView]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a.type]
    dt = np.dtype({5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a.componentType])
    off = (bv.byteOffset or 0) + (a.byteOffset or 0); stride = bv.byteStride or n * dt.itemsize
    if stride == n * dt.itemsize: return np.frombuffer(blob, dt, a.count * n, off).astype(np.float64).reshape(a.count, n)
    return np.array([np.frombuffer(blob, dt, n, off + i * stride) for i in range(a.count)], np.float64)

class Lib:
    def __init__(self, path):
        g = GLTF2().load(path); self.g = g; blob = g.binary_blob()
        self.names = [n.name for n in g.nodes]
        self.parent = [-1] * len(g.nodes)
        for i, n in enumerate(g.nodes):
            for c in (n.children or []): self.parent[c] = i
        self.T0 = [np.array(n.translation or [0, 0, 0], float) for n in g.nodes]
        self.R0 = [np.array(n.rotation or [0, 0, 0, 1], float) for n in g.nodes]
        self.S0 = [np.array(n.scale or [1, 1, 1], float) for n in g.nodes]
        self.clips = {}
        for a in g.animations:
            ch = []
            for c in a.channels:
                s = a.samplers[c.sampler]
                t = accessor(g, s.input, blob)[:, 0]; v = accessor(g, s.output, blob)
                ch.append((c.target.node, c.target.path, t, v, s.interpolation or 'LINEAR'))
            self.clips[a.name] = ch
        self.order = sorted(range(len(g.nodes)), key=self.depth)

    def depth(self, i):
        d = 0
        while self.parent[i] >= 0: i = self.parent[i]; d += 1
        return d

    def duration(self, clip): return max(c[2][-1] for c in self.clips[clip])

    def positions(self, clip, time):
        T = [t.copy() for t in self.T0]; R = [r.copy() for r in self.R0]; S = [s.copy() for s in self.S0]
        if clip:
            for node, path, t, v, interp in self.clips[clip]:
                if len(t) == 1 or time <= t[0]: val = v[0]
                elif time >= t[-1]: val = v[-1]
                else:
                    k = np.searchsorted(t, time) - 1; f = (time - t[k]) / (t[k + 1] - t[k])
                    if interp == 'STEP': val = v[k]
                    elif path == 'rotation': val = Slerp([0, 1], Rot.from_quat([v[k], v[k + 1]]))(f).as_quat()
                    else: val = v[k] * (1 - f) + v[k + 1] * f
                {'translation': T, 'rotation': R, 'scale': S}[path][node] = np.array(val, float)
        G = [None] * len(T)
        for i in self.order:
            M = np.eye(4); M[:3, :3] = Rot.from_quat(R[i]).as_matrix() * S[i]; M[:3, 3] = T[i]
            G[i] = M if self.parent[i] < 0 else G[self.parent[i]] @ M
        return {self.names[i]: G[i][:3, 3] for i in range(len(T))}

def nrm(v): return v / (np.linalg.norm(v) + 1e-12)
def basis(side, up):
    X = nrm(side); Z = nrm(np.cross(X, up)); Y = np.cross(Z, X)
    return Rot.from_matrix(np.stack([X, Y, Z], 1))
def from_units(a, b):
    a = nrm(a); b = nrm(b); v = np.cross(a, b); w = 1 + np.dot(a, b)
    if w < 1e-6: return Rot.from_rotvec(np.array([0, 0, np.pi]))
    return Rot.from_quat(np.append(v, w) / np.linalg.norm(np.append(v, w)))

DOWN = np.array([0, -1, 0.0])

def pose(P, M0, foot_rest=None):
    P = {k: M0.T @ v for k, v in P.items()}
    d = lambda a, b: P[b] - P[a]
    hipsW = basis(d('thigh_r', 'thigh_l'), d('pelvis', 'spine_02'))
    spineW = basis(d('upperarm_r', 'upperarm_l'), d('spine_01', 'neck_01'))
    headW = basis(d('upperarm_r', 'upperarm_l'), d('neck_01', 'Head'))
    out = {'hips': hipsW, 'spine': hipsW.inv() * spineW, 'neck': spineW.inv() * headW, 'y': P['pelvis'][1]}
    fr = {}
    for side, s in (('r', 0), ('l', 1)):
        q = from_units(DOWN, spineW.inv().apply(d('upperarm_' + side, 'lowerarm_' + side))); W = spineW * q; out['sh', s] = q
        q = from_units(DOWN, W.inv().apply(d('lowerarm_' + side, 'hand_' + side))); W = W * q; out['el', s] = q
        out['hand', s] = from_units(DOWN, W.inv().apply(d('hand_' + side, 'middle_01_' + side)))
        q = from_units(DOWN, hipsW.inv().apply(d('thigh_' + side, 'calf_' + side))); W = hipsW * q; out['leg', s] = q
        q = from_units(DOWN, W.inv().apply(d('calf_' + side, 'foot_' + side))); W = W * q; out['knee', s] = q
        fd = W.inv().apply(d('foot_' + side, 'ball_' + side)); fr[s] = fd
        out['foot', s] = from_units(foot_rest[s], fd) if foot_rest else Rot.identity()
    return out, fr

ORDER = ['sh', 'el', 'hand', 'leg', 'knee', 'foot']

def main():
    libs = {'1': Lib(sys.argv[1]), '2': Lib(sys.argv[2])}
    clips = json.loads(sys.argv[3])  # {"walk": ["1","Walk_Loop",true], ...}
    L = libs['1']
    P0 = L.positions('A_TPose', 0.0)
    M0 = basis(P0['thigh_l'] - P0['thigh_r'], P0['spine_01'] - P0['pelvis']).as_matrix()
    _, foot_rest = pose(P0, M0)
    y0 = (M0.T @ P0['pelvis'])[1]
    res = {}
    for key, (li, name, loop) in clips.items():
        lib = libs[li]; dur = lib.duration(name); n = max(2, int(round(dur * FPS)) + (0 if loop else 1))
        rows = []; prev = None
        for f in range(n):
            t = min(dur, f / FPS)
            o, _ = pose(lib.positions(name, t), M0, foot_rest)
            qs = [o['hips'], o['spine'], o['neck']] + [o[k, s] for k in ORDER for s in (0, 1)]
            q = np.array([r.as_quat() for r in qs])
            if prev is not None: q[(q * prev).sum(1) < 0] *= -1
            prev = q
            dy = (o['y'] / y0 - 1) * 0.93
            rows.append(np.concatenate([q[0], [dy / 0.93], q[1:].ravel()]))
        a = np.clip(np.round(np.array(rows) * 127), -127, 127).astype(np.int8)
        res[key] = {'fps': FPS, 'n': n, 'loop': bool(loop), 'd': base64.b64encode(a.tobytes()).decode()}
        print(key, name, round(dur, 2), 's', n, 'frames', file=sys.stderr)
    with open(sys.argv[4], 'w') as fo:
        fo.write('// Hero animations retargeted from Quaternius Universal Animation Library (CC0) by tools/retarget.py\n')
        fo.write('const ANIM_DATA=' + json.dumps(res, separators=(',', ':')) + ';\n')

if __name__ == '__main__': main()
