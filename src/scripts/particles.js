/**
 * Particle hero: one cloud of points that morphs between scenes as the page scrolls.
 * Scenes: 0 name, 1 cloud architecture, 2 analog photos, 3 crochet, 4 globe, 5 name (contact).
 * Static site, no framework: Three.js only, loaded by Astro on the home page.
 */
import * as THREE from 'three';

// ---------- film grain overlay ----------
function startGrain(reduce) {
  const el = document.getElementById('grain');
  if (!el) return;
  const tiles = [];
  for (let t = 0; t < 4; t++) {
    const c = document.createElement('canvas');
    c.width = c.height = 180;
    const g = c.getContext('2d');
    const d = g.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    tiles.push(`url(${c.toDataURL()})`);
  }
  let k = 0;
  el.style.backgroundImage = tiles[0];
  if (!reduce)
    setInterval(() => {
      el.style.backgroundImage = tiles[k++ % 4];
      el.style.transform = `translate(${Math.random() * 40}px,${Math.random() * 40}px)`;
    }, 90);
}

async function main() {
  const canvas = document.getElementById('gl');
  if (!canvas) return;
  const small = matchMedia('(max-width:700px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  startGrain(reduce);
  const N = small ? 9000 : 16000;
  const STATES = 6;

  // ---------- three setup ----------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const PR = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 10;
  const group = new THREE.Group();
  scene.add(group);

  const cur = new Float32Array(N * 3),
    curC = new Float32Array(N * 3),
    aSize = new Float32Array(N);
  const jit = new Float32Array(N * 3),
    phase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    aSize[i] = 0.8 + Math.random() * 0.4;
    phase[i] = Math.random() * 6.283;
    const u = Math.random() * 2 - 1,
      a = Math.random() * 6.283,
      s = Math.sqrt(1 - u * u);
    jit[i * 3] = s * Math.cos(a);
    jit[i * 3 + 1] = s * Math.sin(a);
    jit[i * 3 + 2] = u;
    cur[i * 3] = (Math.random() - 0.5) * 20;
    cur[i * 3 + 1] = (Math.random() - 0.5) * 12;
    cur[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(cur, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(curC, 3);
  colAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aColor', colAttr);
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: 2.3 }, uPR: { value: PR } },
    vertexShader: `attribute vec3 aColor;attribute float aSize;uniform float uSize;uniform float uPR;varying vec3 vC;
    void main(){vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uSize*aSize*uPR*(10./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 vC;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;gl_FragColor=vec4(vC,smoothstep(.5,.12,d));}`,
    transparent: true,
    depthWrite: false,
  });
  scene.add(group);
  group.add(new THREE.Points(geo, mat));

  // ---------- helpers ----------
  const hex = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const mk = () => ({ pos: new Float32Array(N * 3), col: new Float32Array(N * 3) });
  const S = [];
  const sizes = [2.3, 2.3, 4.6, 2.5, 2.0, 2.2].map((v) => (small ? v * 1.25 : v));

  // ---------- 0 + 5: name ----------
  async function textPoints() {
    try {
      await Promise.race([
        document.fonts.load('700 150px "Space Grotesk"'),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch (e) {}
    const W = 1000,
      H = 380,
      c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.font = '700 150px "Space Grotesk", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('FRANCESCO', W / 2, H * 0.27);
    g.fillText('TRANZILLO', W / 2, H * 0.75);
    const d = g.getImageData(0, 0, W, H).data,
      pts = [];
    for (let y = 0; y < H; y += 2)
      for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    return pts;
  }
  function nameState(pts, sc, oy, warm) {
    const st = mk(),
      n = pts.length / 2;
    for (let i = 0; i < N; i++) {
      const k = ((Math.random() * n) | 0) * 2;
      st.pos[i * 3] = ((pts[k] + Math.random() * 2) / 1000 - 0.5) * 8.4 * sc;
      st.pos[i * 3 + 1] = (0.5 - (pts[k + 1] + Math.random() * 2) / 380) * 3.2 * sc + oy;
      st.pos[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
      let c = Math.random() < 0.07 ? hex('#ff9a3c') : warm ? [1, 0.86, 0.7] : [0.9, 0.95, 1];
      const b = 0.75 + Math.random() * 0.25;
      st.col[i * 3] = c[0] * b;
      st.col[i * 3 + 1] = c[1] * b;
      st.col[i * 3 + 2] = c[2] * b;
    }
    return st;
  }

  // ---------- 1: architecture ----------
  const nodes = [
    { n: 'Users', p: [-4.3, 0.1, 0.4], c: '#eef2f7' },
    { n: 'Route 53', p: [-2.5, 1.9, -0.4], c: '#8c7cff' },
    { n: 'CloudFront', p: [-2.3, 0, 0], c: '#8c7cff' },
    { n: 'S3', p: [-0.2, 1.4, 0.3], c: '#5fd38d' },
    { n: 'API Gateway', p: [-0.2, -1.3, -0.3], c: '#ff5f8f' },
    { n: 'Lambda', p: [1.8, -1.3, 0.4], c: '#ff9a3c' },
    { n: 'DynamoDB', p: [3.9, -1.3, -0.2], c: '#5ee7ff' },
    { n: 'Bedrock', p: [1.8, 0.9, -0.6], c: '#5ee7ff' },
  ];
  const edges = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [4, 5],
    [5, 6],
    [5, 7],
  ];
  const arch = mk();
  const eIdx = new Int16Array(N),
    eS = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (Math.random() < 0.52) {
      eIdx[i] = -1;
      const nd = nodes[i % nodes.length],
        r = 0.36 * (0.8 + 0.2 * Math.random());
      arch.pos[i * 3] = nd.p[0] + jit[i * 3] * r;
      arch.pos[i * 3 + 1] = nd.p[1] + jit[i * 3 + 1] * r;
      arch.pos[i * 3 + 2] = nd.p[2] + jit[i * 3 + 2] * r;
      const c = hex(nd.c),
        b = 0.7 + Math.random() * 0.3;
      arch.col[i * 3] = c[0] * b;
      arch.col[i * 3 + 1] = c[1] * b;
      arch.col[i * 3 + 2] = c[2] * b;
    } else {
      eIdx[i] = i % edges.length;
      eS[i] = Math.random();
    }
  }
  arch.dyn = (t) => {
    for (let i = 0; i < N; i++) {
      const e = eIdx[i];
      if (e < 0) continue;
      const A = nodes[edges[e][0]].p,
        B = nodes[edges[e][1]].p,
        s = (eS[i] + t * 0.14) % 1,
        j = 0.045;
      arch.pos[i * 3] = A[0] + (B[0] - A[0]) * s + jit[i * 3] * j;
      arch.pos[i * 3 + 1] = A[1] + (B[1] - A[1]) * s + jit[i * 3 + 1] * j;
      arch.pos[i * 3 + 2] = A[2] + (B[2] - A[2]) * s + jit[i * 3 + 2] * j;
      const b = 0.25 + 0.75 * Math.pow(s, 3);
      arch.col[i * 3] = 0.37 * b + 0.1;
      arch.col[i * 3 + 1] = 0.9 * b + 0.1;
      arch.col[i * 3 + 2] = 1 * b + 0.12;
    }
  };

  // ---------- 2: analog photos (real scans, cycling) ----------
  const PHOTOS = JSON.parse(canvas.dataset.photos || '[]');
  const photo = mk(),
    phPos = [],
    phCol = [];
  // Photos are laid out on a regular grid (one particle = one pixel of a cols x rows thumbnail),
  // so the picture reads like a halftone print instead of random noise.
  const PW = 7.2,
    PHh = 4.8,
    ptop = PHh / 2;
  const nFrame = Math.floor(N * 0.9);
  const cols = Math.round(Math.sqrt((nFrame * PW) / PHh)),
    rows = Math.floor(nFrame / cols),
    nGrid = cols * rows,
    cell = PW / cols;

  // Film-strip borders: regular dots with clean sprocket holes.
  const borderPts = [];
  {
    const step = cell * 1.15;
    for (const band of [1, -1])
      for (let yy = ptop + 0.1; yy < ptop + 0.68; yy += step)
        for (let x = -PW / 2 - 0.4; x < PW / 2 + 0.4; x += step) {
          const hx = (((x + 10) % 0.5) + 0.5) % 0.5;
          const hole = hx > 0.14 && hx < 0.36 && yy > ptop + 0.24 && yy < ptop + 0.5;
          if (!hole) borderPts.push(x, band * yy);
        }
  }

  async function loadPhotos() {
    const c = document.createElement('canvas');
    c.width = cols;
    c.height = rows;
    const g = c.getContext('2d', { willReadFrequently: true });
    for (const src of PHOTOS) {
      const img = new Image();
      img.src = src;
      await img.decode();
      g.drawImage(img, 0, 0, cols, rows); // the browser averages pixels: smooth, no aliasing
      const d = g.getImageData(0, 0, cols, rows).data;
      const P = new Float32Array(N * 3),
        C = new Float32Array(N * 3);
      const tone = (v) => Math.min(1, Math.max(0, (v / 255 - 0.02) * 1.3));
      for (let i = 0; i < N; i++) {
        const o3 = i * 3;
        if (i < nGrid) {
          const cx = i % cols,
            cy = (i / cols) | 0,
            o = i * 4,
            gn = (Math.random() - 0.5) * 0.05;
          P[o3] = (cx + 0.5) * cell - PW / 2 + (Math.random() - 0.5) * cell * 0.2;
          P[o3 + 1] = PHh / 2 - (cy + 0.5) * cell + (Math.random() - 0.5) * cell * 0.2;
          P[o3 + 2] = (Math.random() - 0.5) * 0.03;
          C[o3] = tone(d[o]) + gn;
          C[o3 + 1] = tone(d[o + 1]) + gn;
          C[o3 + 2] = tone(d[o + 2]) + gn;
        } else {
          const k = ((i - nGrid) * 2) % borderPts.length;
          P[o3] = borderPts[k];
          P[o3 + 1] = borderPts[k + 1];
          P[o3 + 2] = 0;
          const bb = 0.75 + Math.random() * 0.25;
          C[o3] = 0.42 * bb;
          C[o3 + 1] = 0.22 * bb;
          C[o3 + 2] = 0.1 * bb;
        }
      }
      phPos.push(P);
      phCol.push(C);
    }
  }
  let phIdx = 0;
  const PH_HOLD = 4.5,
    PH_MIX = 1.4;
  photo.dyn = (t) => {
    if (!phPos.length) return;
    const cyc = PH_HOLD + PH_MIX,
      k = Math.floor(t / cyc) % phPos.length,
      nx = (k + 1) % phPos.length;
    phIdx = k;
    const r = (t % cyc) - PH_HOLD;
    const m = r > 0 ? (reduce ? 1 : r / PH_MIX) : 0,
      e = m < 0.5 ? 4 * m * m * m : 1 - Math.pow(-2 * m + 2, 3) / 2;
    const A = phPos[k],
      B = phPos[nx],
      AC = phCol[k],
      BC = phCol[nx],
      burst = Math.sin(e * Math.PI) * 0.9;
    for (let i = 0; i < N * 3; i++) {
      photo.pos[i] = A[i] + (B[i] - A[i]) * e + jit[i] * burst;
      photo.col[i] = AC[i] + (BC[i] - AC[i]) * e;
    }
  };

  // ---------- 3: crochet ----------
  const croch = mk(),
    crBase = new Float32Array(N * 3);
  (function () {
    const pal = ['#e8b84a', '#d0643c', '#8fae8b', '#f2e6d0', '#c6577a', '#5a8fb0'].map(hex);
    const R = 6,
      TM = R * 2 * Math.PI;
    let end = [0, 0, 0];
    {
      const th = TM,
        r = 0.3 + 0.38 * R,
        rr = r + 0.13;
      end = [rr * Math.cos(th), rr * Math.sin(th), 0];
    }
    for (let i = 0; i < N; i++) {
      let x, y, z, c;
      if (Math.random() < 0.91) {
        const s = Math.random(),
          th = s * TM,
          r = 0.3 + (0.38 * th) / (2 * Math.PI),
          ph = th * (9 + (1.6 * th) / (2 * Math.PI)),
          rho = 0.13,
          rr = r + rho * Math.cos(ph);
        x = rr * Math.cos(th);
        y = rr * Math.sin(th);
        z = rho * Math.sin(ph) * 1.3;
        c = pal[Math.min(R - 1, (th / (2 * Math.PI)) | 0)];
      } else {
        const s = Math.random(),
          p0 = end,
          p1 = [3.4, 0.2, 0.6],
          p2 = [2.6, -2.6, 0.2],
          p3 = [4.2, -2.9, 0.4],
          m = 1 - s;
        x = m * m * m * p0[0] + 3 * m * m * s * p1[0] + 3 * m * s * s * p2[0] + s * s * s * p3[0];
        y = m * m * m * p0[1] + 3 * m * m * s * p1[1] + 3 * m * s * s * p2[1] + s * s * s * p3[1];
        z = m * m * m * p0[2] + 3 * m * m * s * p1[2] + 3 * m * s * s * p2[2] + s * s * s * p3[2];
        c = pal[R - 1];
      }
      const j = 0.03;
      crBase[i * 3] = x + jit[i * 3] * j;
      crBase[i * 3 + 1] = y + jit[i * 3 + 1] * j;
      crBase[i * 3 + 2] = z + jit[i * 3 + 2] * j;
      const b = 0.7 + Math.random() * 0.3;
      croch.col[i * 3] = c[0] * b;
      croch.col[i * 3 + 1] = c[1] * b;
      croch.col[i * 3 + 2] = c[2] * b;
    }
  })();
  croch.dyn = (t) => {
    const a = reduce ? 0 : t * 0.08,
      ca = Math.cos(a),
      sa = Math.sin(a),
      tl = 0.35,
      ct = Math.cos(tl),
      stl = Math.sin(tl);
    for (let i = 0; i < N; i++) {
      const x = crBase[i * 3],
        y = crBase[i * 3 + 1],
        z = crBase[i * 3 + 2];
      const x2 = x * ca - y * sa,
        y2 = x * sa + y * ca;
      croch.pos[i * 3] = x2;
      croch.pos[i * 3 + 1] = y2 * ct - z * stl;
      croch.pos[i * 3 + 2] = y2 * stl + z * ct;
    }
  };

  // ---------- 4: globe ----------
  const globe = mk(),
    gLat = new Float32Array(N),
    gLon = new Float32Array(N),
    gR = new Float32Array(N),
    gArc = new Int8Array(N),
    gS = new Float32Array(N);
  const D = Math.PI / 180,
    GR = 2.4,
    TILT = 0.72;
  const land = [
    [50, 10, 13],
    [43, 0, 8],
    [60, 22, 11],
    [64, 12, 7],
    [5, 20, 22],
    [-20, 25, 14],
    [20, 10, 15],
    [28, 30, 9],
    [50, 90, 30],
    [30, 100, 20],
    [20, 78, 10],
    [62, 120, 25],
    [36, 138, 5],
    [45, -100, 22],
    [60, -110, 20],
    [35, -90, 15],
    [20, -100, 10],
    [-10, -60, 18],
    [-30, -65, 12],
    [-25, 134, 13],
    [72, -40, 10],
    [24, 45, 9],
  ];
  const cities = [
    { n: 'Lioni', la: 40.88, lo: 15.18 },
    { n: 'Torino', la: 45.07, lo: 7.69 },
    { n: 'Berlin', la: 52.52, lo: 13.4 },
    { n: 'Marrakech', la: 31.63, lo: -7.99 },
    { n: 'Fès', la: 34.03, lo: -5.0 },
    { n: 'Chefchaouen', la: 35.17, lo: -5.27 },
    { n: 'Merzouga', la: 31.1, lo: -4.01 },
  ];
  const regions = [
    [50.11, 8.68],
    [45.46, 9.19],
    [38.9, -77.4],
    [35.7, 139.7],
    [-23.5, -46.6],
    [-33.9, 151.2],
    [53.3, -6.3],
    [1.35, 103.8],
    [37.4, -122],
  ];
  function angDist(a1, o1, a2, o2) {
    const s =
      Math.sin(a1 * D) * Math.sin(a2 * D) + Math.cos(a1 * D) * Math.cos(a2 * D) * Math.cos((o1 - o2) * D);
    return Math.acos(Math.max(-1, Math.min(1, s))) / D;
  }
  (function () {
    const nF = Math.floor(N * 0.84),
      ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      let c;
      gArc[i] = -1;
      gR[i] = 1;
      if (i < nF) {
        const y = 1 - (i / (nF - 1)) * 2;
        gLat[i] = Math.asin(y) / D;
        gLon[i] = (((i * ga) / D) % 360) - 180;
        const isLand = land.some((l) => angDist(gLat[i], gLon[i], l[0], l[1]) < l[2]);
        c = isLand ? [0.85, 0.94, 1] : [0.07, 0.12, 0.22];
        if (!isLand && Math.random() < 0.4) c = [0.04, 0.07, 0.13];
      } else if (i < nF + Math.floor(N * 0.05)) {
        const r = Math.random() < 0.5 ? cities[i % cities.length] : null;
        if (r) {
          gLat[i] = r.la + (Math.random() - 0.5) * 1.4;
          gLon[i] = r.lo + (Math.random() - 0.5) * 1.8;
          c = hex('#ff9a3c');
          gR[i] = 1.01 + Math.random() * 0.03;
        } else {
          const g = regions[i % regions.length];
          gLat[i] = g[0] + (Math.random() - 0.5) * 2;
          gLon[i] = g[1] + (Math.random() - 0.5) * 2.5;
          c = hex('#5ee7ff');
          gR[i] = 1.01;
        }
      } else {
        gArc[i] = i % 3;
        gS[i] = Math.random();
        c = hex('#ffb877');
      }
      const b = 0.75 + Math.random() * 0.25;
      globe.col[i * 3] = c[0] * b;
      globe.col[i * 3 + 1] = c[1] * b;
      globe.col[i * 3 + 2] = c[2] * b;
    }
  })();
  function ll(la, lo, r, rot, out, o) {
    const cl = Math.cos(la * D),
      x = cl * Math.sin(lo * D + rot),
      y = Math.sin(la * D),
      z = cl * Math.cos(lo * D + rot);
    out[o] = x * r * GR + 0.6;
    out[o + 1] = (y * Math.cos(TILT) - z * Math.sin(TILT)) * r * GR - 0.2;
    out[o + 2] = (y * Math.sin(TILT) + z * Math.cos(TILT)) * r * GR;
  }
  let gRot = 0;
  const arcs = [
    [cities[0], cities[1]],
    [cities[1], cities[2]],
    [cities[2], cities[3]],
  ];
  globe.dyn = (t) => {
    gRot = -12 * D + (reduce ? 0 : Math.sin(t * 0.18) * 0.55);
    for (let i = 0; i < N; i++) {
      if (gArc[i] < 0) {
        ll(gLat[i], gLon[i], gR[i], gRot, globe.pos, i * 3);
        continue;
      }
      const [A, B] = arcs[gArc[i]],
        s = (gS[i] + t * 0.12) % 1;
      ll(
        A.la + (B.la - A.la) * s,
        A.lo + (B.lo - A.lo) * s,
        1.02 + Math.sin(Math.PI * s) * 0.22,
        gRot,
        globe.pos,
        i * 3,
      );
      const j = 0.02;
      globe.pos[i * 3] += jit[i * 3] * j;
      globe.pos[i * 3 + 1] += jit[i * 3 + 1] * j;
    }
  };

  // ---------- labels ----------
  const labels = [];
  function addLabel(text, state, get, cls, occl) {
    const el = document.createElement('div');
    el.className = 'lbl' + (cls ? ' ' + cls : '');
    el.textContent = text;
    document.body.appendChild(el);
    labels.push({ el, state, get, occl });
  }
  nodes.forEach((nd) => addLabel(nd.n, 1, () => [nd.p[0], nd.p[1] - 0.62, nd.p[2]]));
  const tmp = new Float32Array(3);
  cities.slice(0, 4).forEach((c) =>
    addLabel(
      c.n,
      4,
      () => {
        ll(c.la, c.lo, 1.06, gRot, tmp, 0);
        return [tmp[0] + 0.25, tmp[1] + 0.12, tmp[2]];
      },
      'city',
      true,
    ),
  );

  // ---------- dots ----------
  const dots = document.getElementById('dots');
  for (let i = 0; i < STATES; i++) {
    const a = document.createElement('a');
    a.href = '#';
    a.onclick = (e) => {
      e.preventDefault();
      scrollTo({ top: i * innerHeight, behavior: 'smooth' });
    };
    dots.appendChild(a);
  }

  // ---------- build & loop ----------
  const pts = await textPoints();
  await loadPhotos();
  S.push(nameState(pts, 1, 0, false), arch, photo, croch, globe, nameState(pts, 0.62, 0.9, true));
  for (let i = 0; i < N * 3; i++) curC[i] = 0;

  let W = 0,
    H = 0,
    halfW = 0,
    halfH = 0,
    shapeScale = 1;
  function resize() {
    W = innerWidth;
    H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    halfH = Math.tan(25 * D) * 10;
    halfW = halfH * camera.aspect;
    shapeScale = Math.min(1, (halfW * 2) / 9.8);
    group.scale.setScalar(shapeScale);
  }
  addEventListener('resize', resize);
  resize();

  let mx = 0,
    my = 0,
    mOn = false;
  addEventListener('pointermove', (e) => {
    mx = (e.clientX / W) * 2 - 1;
    my = -((e.clientY / H) * 2 - 1);
    mOn = true;
  });
  addEventListener('pointerleave', () => (mOn = false));

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clock = new THREE.Clock();
  const v3 = new THREE.Vector3();
  let lastDot = -1;

  function frame() {
    const t = clock.getElapsedTime();
    const p = Math.max(0, Math.min(STATES - 1, scrollY / innerHeight));
    const a = Math.floor(p),
      b = Math.min(a + 1, STATES - 1);
    const f = ease(Math.max(0, Math.min(1, (p - a - 0.3) / 0.4)));
    const A = S[a],
      B = S[b];
    if (A.dyn) A.dyn(t);
    if (B !== A && B.dyn) B.dyn(t);
    const amp = reduce ? 0 : Math.sin(f * Math.PI) * 1.1;
    const k = reduce ? 1 : 0.085;
    const rmx = (mx * halfW) / shapeScale,
      rmy = (my * halfH) / shapeScale,
      RR = 1.1;
    const AP = A.pos,
      BP = B.pos,
      AC = A.col,
      BC = B.col,
      g = 1 - f;
    for (let i = 0; i < N; i++) {
      const o = i * 3;
      const w = amp * (0.6 + 0.4 * Math.sin(t * 2 + phase[i]));
      let tx = AP[o] * g + BP[o] * f + jit[o] * w,
        ty = AP[o + 1] * g + BP[o + 1] * f + jit[o + 1] * w,
        tz = AP[o + 2] * g + BP[o + 2] * f + jit[o + 2] * w;
      if (mOn && !reduce) {
        const dx = tx - rmx,
          dy = ty - rmy,
          d2 = dx * dx + dy * dy;
        if (d2 < RR * RR) {
          const d = Math.sqrt(d2) + 1e-4,
            push = (1 - d / RR) * 0.7;
          tx += (dx / d) * push;
          ty += (dy / d) * push;
          tz += push * 0.6;
        }
      }
      cur[o] += (tx - cur[o]) * k;
      cur[o + 1] += (ty - cur[o + 1]) * k;
      cur[o + 2] += (tz - cur[o + 2]) * k;
      curC[o] += (AC[o] * g + BC[o] * f - curC[o]) * 0.1;
      curC[o + 1] += (AC[o + 1] * g + BC[o + 1] * f - curC[o + 1]) * 0.1;
      curC[o + 2] += (AC[o + 2] * g + BC[o + 2] * f - curC[o + 2]) * 0.1;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    mat.uniforms.uSize.value = sizes[a] * g + sizes[b] * f;
    const tr = reduce ? 0 : 1;
    group.rotation.y += ((mOn ? mx * 0.28 : Math.sin(t * 0.3) * 0.08) * tr - group.rotation.y) * 0.05;
    group.rotation.x += ((mOn ? -my * 0.18 : 0) * tr - group.rotation.x) * 0.05;
    group.updateMatrixWorld();
    for (const L of labels) {
      const wgt = L.state === a ? g : L.state === b ? f : 0;
      const vis = Math.max(0, (wgt - 0.6) / 0.4);
      if (vis <= 0) {
        L.el.style.opacity = 0;
        continue;
      }
      const q = L.get();
      v3.set(q[0], q[1], q[2]).applyMatrix4(group.matrixWorld);
      const front = !L.occl || v3.z > -0.3;
      v3.project(camera);
      L.el.style.opacity = front ? vis : vis * 0.15;
      L.el.style.left = ((v3.x + 1) / 2) * W + 'px';
      L.el.style.top = ((1 - v3.y) / 2) * H + 'px';
    }
    const di = Math.round(p);
    if (di !== lastDot) {
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === di));
      lastDot = di;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}

main();
