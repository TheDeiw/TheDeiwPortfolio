// 3D-кільце ігор у #games: геймпад у центрі, «кишенькові консолі» ігор на орбіті.
// Three.js r128 (глобальний THREE), як і 3d_logo.js. Кольори без sRGB-конвертацій: так само, як у hero.
(function () {
    const wrap = document.getElementById("games-wrap");
    const stage = document.getElementById("games-stage");
    const fallback = document.getElementById("games-fallback");
    const card = document.getElementById("games-card");
    const links = document.getElementById("games-links");

    function showFallback() {
        if (wrap) wrap.hidden = true;
        if (fallback) fallback.hidden = false;
    }

    function webglOk() {
        try {
            const c = document.createElement("canvas");
            const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
            if (!gl) return false;
            const ext = gl.getExtension("WEBGL_lose_context");
            if (ext) ext.loseContext();
            return true;
        } catch (e) {
            return false;
        }
    }

    if (!wrap || !stage || !card || !links || typeof THREE === "undefined" || typeof GAMES === "undefined") {
        showFallback();
        return;
    }
    // ?games=list примусово вмикає запасний список (для тестів)
    if (new URLSearchParams(location.search).get("games") === "list" || !webglOk()) {
        showFallback();
        return;
    }

    const MAX_RING = 8;
    const FOV = 18;
    const AUTO_SPEED = (Math.PI * 2) / 45; // рад/с, повний оберт за ~45 с
    const DRAG = 0.007; // рад на піксель перетягування
    const CARD_W = 224;
    const OBJ_SCALE = 1.35; // розмір консолі: ширина 1 -> 1.35
    const PAD_SCALE = 1.5;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const mqStatic = matchMedia("(max-width: 767.98px)");
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    const motion = reduce ? 0 : 1;

    const tr = (k) => (translations[currentLang] && translations[currentLang][k]) || translations.en[k] || "";
    const lum = (hex) => {
        const n = parseInt(hex.slice(1), 16);
        return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    };

    // Які ігри потрапляють на кільце: спочатку featured, потім решта за порядком масиву, не більше MAX_RING.
    function ringIndices(list) {
        const idx = list.map((_, i) => i);
        const take = idx.filter((i) => list[i].featured).concat(idx.filter((i) => !list[i].featured)).slice(0, MAX_RING);
        return take.sort((a, b) => a - b);
    }
    // Підсвітка: власне поле glow, або колір гри, якщо він достатньо світлий, або світліша версія того ж відтінку.
    function glowOf(g) {
        const c = new THREE.Color(g.glow || g.color);
        if (!g.glow) {
            const hsl = {};
            c.getHSL(hsl);
            if (hsl.l < 0.4) c.setHSL(hsl.h, hsl.s, 0.55);
        }
        return c;
    }
    // Розкладка в «екранних» одиницях (ширина екрана-консолі = 1).
    function layout(aspect) {
        const compact = aspect < 1.15;
        const R = compact ? 2.6 : 3.7;
        const box = compact ? { x0: -R - 0.95, x1: R + 0.95, y0: -2.5, y1: 2.3 } : { x0: -R - 1.0, x1: R + 1.0, y0: -2.6, y1: 2.4 };
        // detail: куди їде відкрита консоль і наскільки збільшується
        const detail = compact ? { x: 0, y: 0.4, k: 1.2 } : { x: -2.8, y: 0.2, k: 1.0 };
        return { compact, R, box, detail, elev: ((compact ? 24 : 19) * Math.PI) / 180 };
    }

    // ---------- стан ----------
    let renderer, canvas, scene, camera, pad, lay, hintEl;
    const dp = new THREE.Vector3();
    let padT = 0;
    let W = 1, H = 1;
    const right = new THREE.Vector3(), up = new THREE.Vector3(), back = new THREE.Vector3(), target = new THREE.Vector3();
    const objs = [];
    const byGame = {};
    const hitMeshes = [];
    const vids = {};
    const selGlow = new THREE.Color(0x464fee);
    let ringIdx = [];
    let ringAngle = 0, vel = 0, t = 0, last = 0, raf = 0;
    let sel = -1, pinned = -1, hoverIdx = -1, focusIdx = -1, cardHover = false;
    let clearT = 0, playT = 0, lastType = "mouse";
    let ptr = null, down = null, dragging = false, autoStopped = false;
    let inView = false, lost = false, failed = false, cardStatic = mqStatic.matches, padGlow = 0;

    // ---------- геометрія й текстури ----------
    function roundedRect(w, h, r) {
        const s = new THREE.Shape();
        const x = -w / 2, y = -h / 2;
        s.moveTo(x + r, y);
        s.lineTo(x + w - r, y);
        s.quadraticCurveTo(x + w, y, x + w, y + r);
        s.lineTo(x + w, y + h - r);
        s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        s.lineTo(x + r, y + h);
        s.quadraticCurveTo(x, y + h, x, y + h - r);
        s.lineTo(x, y + r);
        s.quadraticCurveTo(x, y, x + r, y);
        return s;
    }
    function extrude(shape, depth, bevel) {
        const g = new THREE.ExtrudeGeometry(shape, {
            depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24,
        });
        g.translate(0, 0, -depth / 2);
        return g;
    }
    function frameShape(w, h, th) {
        const s = roundedRect(w, h, 0.04);
        s.holes.push(roundedRect(w - 2 * th, h - 2 * th, 0.02));
        return s;
    }
    function canvasTex(w, h, draw) {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        draw(c.getContext("2d"), w, h);
        return new THREE.CanvasTexture(c);
    }
    const haloTex = canvasTex(128, 128, (x, w, h) => {
        const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
    });
    const shadeHex = (hex, f) => {
        const n = parseInt(hex.slice(1), 16);
        return "rgb(" + [16, 8, 0].map((sh) => Math.round(((n >> sh) & 255) * f)).join(",") + ")";
    };
    // Екран: обкладинка цілком на сірому фоні (поки вантажиться, показуємо назву).
    function logoTex(g) {
        const W = 512, H = 288;
        const tex = canvasTex(W, H, () => {});
        const x = tex.image.getContext("2d");
        const bg = () => {
            x.fillStyle = "#222329";
            x.fillRect(0, 0, W, H);
        };
        bg();
        x.fillStyle = "#fff";
        x.font = '600 44px "Lexend Deca", sans-serif';
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(g.name, W / 2, H / 2);
        tex.needsUpdate = true;
        if (g.cover) {
            const img = new Image();
            img.onload = () => {
                bg();
                const k = Math.min(W / img.width, H / img.height); // повна обкладинка без обрізання
                x.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
                tex.needsUpdate = true;
            };
            img.src = g.cover;
        }
        return tex;
    }
    const sprite = (color, opacity, size, z) => {
        const s = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        s.scale.set(size, size, 1);
        s.position.z = z;
        return s;
    };
    const makeHit = (w, h, d, data) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
        m.userData = data;
        hitMeshes.push(m);
        return m;
    };
    const rotGroup = () => {
        const pivot = new THREE.Group();
        pivot.rotation.order = "YXZ";
        const group = new THREE.Group();
        group.add(pivot);
        return { group, pivot };
    };

    // ---------- об'єкти ----------
    const disc = (r, hgt, mat, x, y, z) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 28), mat);
        m.rotation.x = Math.PI / 2;
        m.position.set(x, y, z + hgt / 2);
        return m;
    };
    const slab = (w, h, d, mat, x, y, z) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z + d / 2);
        return m;
    };

    const ring = (r, tube, mat, x, y, z) => {
        const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 36), mat);
        m.position.set(x, y, z);
        return m;
    };
    // прямокутник з різними радіусами кутів: верхній лівий, верхній правий, нижній правий, нижній лівий
    function rrect(w, h, tl, tr, br, bl) {
        const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
        s.moveTo(x + bl, y);
        s.lineTo(x + w - br, y);
        s.quadraticCurveTo(x + w, y, x + w, y + br);
        s.lineTo(x + w, y + h - tr);
        s.quadraticCurveTo(x + w, y + h, x + w - tr, y + h);
        s.lineTo(x + tl, y + h);
        s.quadraticCurveTo(x, y + h, x, y + h - tl);
        s.lineTo(x, y + bl);
        s.quadraticCurveTo(x, y, x + bl, y);
        return s;
    }
    const decal = (w, h, tex, x, y, z) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
        m.position.set(x, y, z);
        return m;
    };
    const letterTex = (ch, col) =>
        canvasTex(64, 64, (x) => {
            x.fillStyle = col;
            x.font = '700 44px "Lexend Deca", sans-serif';
            x.textAlign = "center";
            x.textBaseline = "middle";
            x.fillText(ch, 32, 36);
        });
    const std = (color, roughness = 0.5) => new THREE.MeshStandardMaterial({ color, roughness });
    function collectTint(root) {
        const tint = [], seen = new Set();
        root.traverse((m) => {
            if (m.isMesh && m.material.color && !seen.has(m.material)) {
                seen.add(m.material);
                tint.push([m.material, m.material.color.clone()]);
            }
        });
        return tint;
    }

    // Кишенькова консоль: двошарове тіло з великим заокругленням знизу праворуч, екран, хрестовина, A/B, динамік, світлодіод.
    function makeHandheld(g, gi) {
        const { group, pivot } = rotGroup();
        const glow = glowOf(g);
        const D = 0.14, B = 0.02, zf = D / 2 + B;
        pivot.add(new THREE.Mesh(extrude(rrect(1, 0.92, 0.1, 0.1, 0.3, 0.1), D, B), new THREE.MeshStandardMaterial({ color: 0x383943, roughness: 0.55, metalness: 0.05 })));
        const plate = new THREE.Mesh(new THREE.ShapeGeometry(rrect(0.94, 0.86, 0.08, 0.08, 0.27, 0.08)), std(0x43444f, 0.6));
        plate.position.z = zf + 0.001;
        const dark = std(0x24252d), mid = std(0x2c2d36, 0.6);
        const bezel = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.54), new THREE.MeshBasicMaterial({ color: 0x101015 }));
        bezel.position.set(0, 0.15, zf + 0.003);
        pivot.add(plate, bezel);

        // верхній край: плечові кнопки, перемикач живлення
        pivot.add(slab(0.3, 0.05, 0.1, mid, -0.3, 0.46, -0.05), slab(0.3, 0.05, 0.1, mid, 0.3, 0.46, -0.05), slab(0.14, 0.035, 0.06, dark, 0, 0.465, -0.03));
        // світлодіод і підпис під екраном
        const led = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: 0xe24b4a }));
        led.position.set(-0.47, 0.3, zf + 0.003);
        const strip = decal(0.5, 0.05, canvasTex(256, 26, (x, w, h) => {
            x.fillStyle = "#8d8e99";
            x.font = '500 16px "Lexend Deca", sans-serif';
            x.textAlign = "center";
            x.textBaseline = "middle";
            x.fillText("THEDEIW  GAMES", w / 2, h / 2);
        }), 0, -0.17, zf + 0.003);
        pivot.add(led, strip);

        // хрестовина на заглибленні, кнопки A (кольору гри) і B із літерами, select/start, динамік
        const btnA = std(glow.clone(), 0.4), btnB = std(0xa8a9b3, 0.5);
        const A = disc(0.06, 0.03, btnA, 0.34, -0.2, zf), Bb = disc(0.06, 0.03, btnB, 0.2, -0.29, zf);
        const pills = [-0.05, 0.06].map((x) => {
            const m = slab(0.08, 0.025, 0.02, dark, x, -0.38, zf);
            m.rotation.z = 0.5;
            return m;
        });
        const slits = [0, 1, 2, 3, 4].map((k) => {
            const m = slab(0.1, 0.014, 0.012, dark, 0.26 + 0.04 * k, -0.42 + 0.025 * k, zf);
            m.rotation.z = 0.7;
            return m;
        });
        pivot.add(
            disc(0.11, 0.02, dark, -0.3, -0.26, zf), slab(0.17, 0.05, 0.03, mid, -0.3, -0.26, zf + 0.02), slab(0.05, 0.17, 0.03, mid, -0.3, -0.26, zf + 0.02),
            A, Bb, ...pills, ...slits,
            decal(0.06, 0.06, letterTex("A", "#24252d"), 0.34, -0.2, zf + 0.032), decal(0.06, 0.06, letterTex("B", "#24252d"), 0.2, -0.29, zf + 0.032)
        );
        const tint = collectTint(pivot);

        const rimMat = new THREE.MeshBasicMaterial({ color: glow.clone() });
        const rim = new THREE.Mesh(new THREE.ShapeGeometry(frameShape(0.92, 0.58, 0.02)), rimMat);
        rim.position.set(0, 0.15, zf + 0.002);
        const still = logoTex(g);
        const screenMat = new THREE.MeshBasicMaterial({ map: still });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), screenMat);
        screen.position.set(0, 0.15, zf + 0.004);
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 }));
        glass.position.set(0, 0.15, zf + 0.005);
        pivot.add(rim, screen, glass, makeHit(1.1, 1.0, 0.4, { gi }));

        return { gi, group, pivot, glow, screenMat, rimMat, still, tint, s: 0, h: 0, depth: 1, dim: 1 };
    }

    // Геймпад: оптимізована модель Xbox One (3.6k трикутників, текстура 1024, meshopt).
    function makePad() {
        const { group, pivot } = rotGroup();
        const flip = new THREE.Group(); // модель потрібно перевернути на 180° у площині екрана
        flip.rotation.z = 0;
        const inner = new THREE.Group();
        flip.add(inner);
        pivot.add(flip);
        const halo = sprite(0x464fee, 0.1, 3.2, -0.6);
        group.add(halo);
        group.scale.setScalar(PAD_SCALE);
        group.position.y = 0.35;
        const pad = { group, pivot, accent: new THREE.MeshStandardMaterial(), halo, tint: [], dim: 1, px: 0, py: 0 };
        const loader = new THREE.GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        loader.load("assets/3d/gamepad.glb", (gltf) => {
            const m = gltf.scene;
            const box = new THREE.Box3().setFromObject(m);
            const size = box.getSize(new THREE.Vector3());
            m.position.sub(box.getCenter(new THREE.Vector3()));
            inner.add(m);
            inner.rotation.set(Math.PI / 2, 0, 0); // лицьовий бік до камери, ширина вздовж X
            inner.scale.setScalar(2.4 / size.x);
            // сцена без sRGB-виводу: текстура теж лінійна, інакше модель виходить чорною
            m.traverse((o) => {
                if (o.isMesh && o.material.map) {
                    o.material.map.encoding = THREE.LinearEncoding;
                    o.material.map.needsUpdate = true;
                }
                if (o.isMesh) {
                    o.material.color.setScalar(0.75);
                }
            });
            pad.tint = collectTint(inner);
        });
        return pad;
    }

    // ---------- вибір гри, картка ----------
    function toPx(v) {
        const p = v.clone().project(camera);
        return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
    }
    function renderCard(i) {
        wrap.classList.toggle("is-open", i >= 0);
        if (i < 0) {
            card.innerHTML = cardStatic ? `<p class="games-card__hint">${tr("games_hint")}</p>` : "";
            card.hidden = !cardStatic;
            return;
        }
        const g = GAMES[i];
        card.hidden = false;
        const media = g.video && !saveData
            ? `<video class="games-card__media" src="${g.video}" poster="${g.cover}" autoplay muted loop playsinline></video>`
            : `<img class="games-card__media" src="${g.cover}" alt="">`;
        card.innerHTML =
            `<div class="project_block__gradient_color" style="--link-color:${g.color}"></div>` +
            media +
            `<div class="project_block__description_text_box">` +
            `<div class="project_block__name">${g.name}</div>` +
            `<div class="project_block__type">${tr(g.typeKey)}</div>` +
            `<div class="project_block__description_text">${tr(g.descKey)}</div></div>` +
            `<a class="project_block__link" style="--link-color:${g.color}" href="${g.url}" target="_blank" rel="noopener">${tr("view_game")}</a>`;
    }
    function apply(i) {
        if (i === sel) return;
        sel = i;
        if (byGame[i]) selGlow.copy(byGame[i].glow);
        renderCard(i);
    }
    function step(d) {
        const i = ringIdx.indexOf(sel);
        if (i < 0) return;
        pinned = ringIdx[(i + d + ringIdx.length) % ringIdx.length];
        resolve();
    }
    function resolve() {
        apply(pinned >= 0 ? pinned : focusIdx);
    }
    function track(id) {
        if (typeof gtag === "function") gtag("event", "select_content", { content_type: "game", item_id: id });
    }

    // ---------- вказівник ----------
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function pickAt(p) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((p.clientX - r.left) / r.width) * 2 - 1, -((p.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        // консолі позаду геймпада не інтерактивні
        const h = ray.intersectObjects(hitMeshes, false).find((x) => byGame[x.object.userData.gi].depth > 0.45);
        return h ? h.object.userData : null;
    }
    function setPtr(e) {
        const r = canvas.getBoundingClientRect();
        ptr = { clientX: e.clientX, clientY: e.clientY, type: e.pointerType, nx: ((e.clientX - r.left) / r.width) * 2 - 1, ny: ((e.clientY - r.top) / r.height) * 2 - 1 };
    }
    function updateHover() {
        if (!ptr || ptr.type === "touch" || dragging) return;
        const h = pickAt(ptr);
        canvas.style.cursor = h ? "pointer" : "";
        const gi = h ? h.gi : -1;
        if (gi !== hoverIdx) {
            hoverIdx = gi;
        }
    }
    function bindPointer() {
        canvas.addEventListener("pointerdown", (e) => {
            lastType = e.pointerType;
            cardHover = false; // курсор на канвасі, а не на картці (на випадок пропущеного pointerleave)
            down = { x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now() };
            if (e.pointerType !== "mouse") autoStopped = true; // на дотик автообертання зупиняється після першого торкання
            canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener("pointermove", (e) => {
            lastType = e.pointerType;
            cardHover = false;
            setPtr(e);
            if (!down) return;
            if (!dragging && sel < 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
                dragging = true;
                pinned = hoverIdx = -1;
                resolve();
            }
            if (dragging) {
                const now = performance.now();
                const dx = e.clientX - down.lx;
                ringAngle -= dx * DRAG;
                vel = vel * 0.5 + ((-dx * DRAG) / Math.max((now - down.lt) / 1000, 0.001)) * 0.5;
                down.lx = e.clientX;
                down.lt = now;
            }
        });
        const end = (e) => {
            if (!down) return;
            const wasDrag = dragging;
            down = null;
            dragging = false;
            try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            if (wasDrag || e.type === "pointercancel") return;
            const h = pickAt(e);
            pinned = h ? h.gi : -1;
            if (e.pointerType !== "mouse") hoverIdx = -1;
            resolve();
        };
        canvas.addEventListener("pointerup", end);
        canvas.addEventListener("pointercancel", end);
        canvas.addEventListener("pointerleave", (e) => {
            if (e.pointerType === "touch") return;
            ptr = null;
                canvas.style.cursor = "";
            hoverIdx = -1;
            resolve();
        });
        card.addEventListener("pointerenter", () => { cardHover = true; resolve(); });
        card.addEventListener("pointerleave", () => { cardHover = false; resolve(); });
        card.addEventListener("click", (e) => { if (e.target.closest("a") && sel >= 0) track(GAMES[sel].id); });
        stage.querySelectorAll(".games-arrow").forEach((b) => b.addEventListener("click", () => step(+b.dataset.dir)));
        stage.querySelector(".games-back").addEventListener("click", () => {
            pinned = focusIdx = -1;
            if (links.contains(document.activeElement)) document.activeElement.blur();
            resolve();
        });

        links.addEventListener("focusin", (e) => {
            const a = e.target.closest("a");
            if (!a) return;
            lastType = "key";
            focusIdx = byGame[+a.dataset.gi] ? +a.dataset.gi : -1;
            resolve();
        });
        links.addEventListener("focusout", () => { focusIdx = -1; resolve(); });
        document.addEventListener("keydown", (e) => {
            if (sel >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
                step(e.key === "ArrowRight" ? 1 : -1);
                e.preventDefault();
                return;
            }
            if (e.key !== "Escape") return;
            pinned = hoverIdx = focusIdx = -1;
            cardHover = false;
            if (links.contains(document.activeElement)) document.activeElement.blur();
            resolve();
        });
        document.addEventListener("pointerdown", (e) => {
            if (e.pointerType === "mouse" && pinned >= 0 && !wrap.contains(e.target)) { pinned = -1; resolve(); }
        });
        document.addEventListener("app:languagechange", () => {
            renderLinks();
            canvas.setAttribute("aria-label", tr("games_ring_label"));
            hintEl.textContent = tr("games_open");
            renderCard(sel);
        });
    }
    function renderLinks() {
        links.innerHTML = GAMES.map((g, i) => `<li><a href="${g.url}" target="_blank" rel="noopener" data-gi="${i}">${g.name}, ${tr(g.typeKey)}</a></li>`).join("");
    }

    // ---------- камера й розмір ----------
    function fit() {
        const { box, elev } = lay;
        const aspect = camera.aspect;
        const D = Math.max((box.y1 - box.y0) / 2, (box.x1 - box.x0) / 2 / aspect) / Math.tan((FOV * Math.PI) / 360);
        right.set(1, 0, 0);
        up.set(0, Math.cos(elev), -Math.sin(elev));
        back.set(0, Math.sin(elev), Math.cos(elev));
        target.copy(right).multiplyScalar((box.x0 + box.x1) / 2).addScaledVector(up, (box.y0 + box.y1) / 2);
        camera.position.copy(target).addScaledVector(back, D);
        camera.near = D * 0.4;
        camera.far = D * 2;
        camera.lookAt(target);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
    }
    function resize() {
        const w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        W = w;
        H = h;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        lay = layout(w / h);
        fit();
        cardStatic = mqStatic.matches;
        renderCard(sel);
    }

    // ---------- кадр ----------
    function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const f = 1 - Math.pow(0.001, dt); // згладжування ~ 0.11 за кадр при 60 fps

        if (sel < 0 && hoverIdx < 0 && !dragging) {
            const auto = autoStopped || reduce ? 0 : AUTO_SPEED;
            vel += (auto - vel) * (1 - Math.pow(0.05, dt)); // інерція після перетягування затухає до авто-швидкості
            ringAngle += vel * dt;
            t += dt;
        }
        if (!coarse) updateHover();

        const n = objs.length;
        dp.copy(right).multiplyScalar(lay.detail.x).addScaledVector(up, lay.detail.y);
        dp.sub(camera.position).multiplyScalar(0.7).add(camera.position); // ближче до камери за все на сцені
        objs.forEach((o, k) => {
            const a = ringAngle + (k * Math.PI * 2) / n;
            const sn = Math.sin(a);
            o.group.position.set(lay.R * Math.cos(a), 0, lay.R * sn + 0.9 * o.s); // вибрана консоль виїжджає вперед
            const depth = (sn + 1) / 2; // 1 = спереду
            o.depth = depth;
            o.s += ((sel === o.gi ? 1 : 0) - o.s) * f;
            o.h += ((hoverIdx === o.gi && sel < 0 ? 1 : 0) - o.h) * f;
            o.dim += ((sel >= 0 && sel !== o.gi ? 0.3 : 1) - o.dim) * f;
            o.group.position.set(lay.R * Math.cos(a), 0, lay.R * sn).lerp(dp, o.s);
            const b = (0.72 + 0.28 * Math.max(depth, o.s)) * o.dim;
            o.pivot.rotation.set(-lay.elev * 0.8, 0.38 * Math.sin(t * 1.1 + k) * motion * (1 - o.s) * (1 - 0.6 * o.h), 0);
            o.group.scale.setScalar((0.9 + 0.1 * depth) * OBJ_SCALE * (1 + 0.12 * o.h + lay.detail.k * o.s) * (1 - 0.3 * o.s)); // 0.7 компенсує наближення до камери
            o.tint.forEach(([m, base]) => m.color.copy(base).multiplyScalar(b));
            o.screenMat.color.setScalar(b * (0.85 + 0.15 * Math.max(o.s, o.h)));
            o.rimMat.color.copy(o.glow).multiplyScalar(b * (0.5 + 0.5 * Math.max(o.s, o.h)));
        });

        // мінімальна підказка під консоллю, на яку навели
        const ho = hoverIdx >= 0 && sel < 0 ? byGame[hoverIdx] : null;
        hintEl.hidden = !ho;
        if (ho) {
            const p = toPx(ho.group.position.clone().addScaledVector(up, -1.0));
            hintEl.style.left = p.x + "px";
            hintEl.style.top = p.y + "px";
        }

        // коли гру відкрито, геймпад темнішає й завмирає
        pad.dim += ((sel >= 0 ? 0.25 : 1) - pad.dim) * f;
        pad.tint.forEach(([m, base]) => m.color.copy(base).multiplyScalar(pad.dim));
        pad.halo.material.opacity = 0.1 * pad.dim;
        if (sel < 0) {
            if (!reduce) padT += dt;
            const tx = ptr && ptr.type !== "touch" && !reduce ? ptr : null;
            pad.px += ((tx ? tx.nx : 0) - pad.px) * f * 0.5;
            pad.py += ((tx ? tx.ny : 0) - pad.py) * f * 0.5;
            pad.pivot.rotation.set(-lay.elev - 0.12 + 0.09 * Math.sin(padT / 1.1) - pad.py * 0.12, 0.42 * Math.sin(padT / 1.5) + pad.px * 0.18, 0);
        }
        padGlow += ((sel >= 0 ? 1 : 0) - padGlow) * f;
        pad.accent.emissive.copy(selGlow).multiplyScalar(padGlow * pad.dim);

        renderer.render(scene, camera);
    }
    function start() {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
    }
    function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
    }
    function update() {
        if (renderer && lay && inView && !document.hidden && !lost) start();
        else stop();
    }

    // ---------- ініціалізація ----------
    function init() {
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !coarse });
        } catch (e) {
            failed = true;
            showFallback();
            return;
        }
        renderer.setClearColor(0x000000, 0);
        canvas = renderer.domElement;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", tr("games_ring_label"));
        stage.insertBefore(canvas, stage.firstChild);
        hintEl = document.createElement("div");
        hintEl.className = "games-click";
        hintEl.hidden = true;
        hintEl.textContent = tr("games_open");
        stage.appendChild(hintEl);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const sun = new THREE.DirectionalLight(0xffffff, 0.7);
        sun.position.set(-3, 6, 8);
        scene.add(sun);

        ringIdx = ringIndices(GAMES);
        ringIdx.forEach((gi) => {
            const o = makeHandheld(GAMES[gi], gi);
            objs.push(o);
            byGame[gi] = o;
            scene.add(o.group);
        });
        pad = makePad();
        scene.add(pad.group);
        hitMeshes.length = 0;
        scene.traverse((m) => { if (m.userData && m.userData.gi !== undefined) hitMeshes.push(m); });

        renderLinks();
        bindPointer();
        canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; update(); });
        canvas.addEventListener("webglcontextrestored", () => { lost = false; update(); });
        new ResizeObserver(resize).observe(stage);
        mqStatic.addEventListener("change", resize);
        resize();
        renderCard(-1);
    }

    renderLinks(); // доступні посилання є ще до створення сцени
    new IntersectionObserver(
        (es) => {
            inView = es[0].isIntersecting;
            if (inView && !renderer && !failed) init();
            update();
        },
        { rootMargin: "100% 0px" }
    ).observe(stage);
    document.addEventListener("visibilitychange", update);
})();
