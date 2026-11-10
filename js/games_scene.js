// 3D-кільце ігор у #games: геймпад у центрі, «кишенькові консолі» ігор на орбіті, картридж itch.io збоку.
// Three.js r128 (глобальний THREE), як і 3d_logo.js. Кольори без sRGB-конвертацій: так само, як у hero.
(function () {
    const wrap = document.getElementById("games-wrap");
    const stage = document.getElementById("games-stage");
    const fallback = document.getElementById("games-fallback");
    const card = document.getElementById("games-card");
    const links = document.getElementById("games-links");
    const itchLink = document.getElementById("games-itch");

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

    if (!wrap || !stage || !card || !links || !itchLink || typeof THREE === "undefined" || typeof GAMES === "undefined") {
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
    // Розкладка в «екранних» одиницях (ширина екрана-консолі = 1). cart: де стоїть картридж itch.
    function layout(aspect) {
        const compact = aspect < 1.15;
        const R = compact ? 1.95 : 2.6;
        const cart = compact ? { x: 0, y: -2.1 } : { x: R + 1.35, y: -1.6 };
        const box = compact
            ? { x0: -R - 0.65, x1: R + 0.65, y0: -3.35, y1: 1.7 }
            : { x0: -R - 0.6, x1: cart.x + 0.75, y0: -2.9, y1: 1.7 };
        return { compact, R, cart, box, elev: ((compact ? 24 : 19) * Math.PI) / 180 };
    }

    // ---------- стан ----------
    let renderer, canvas, scene, camera, orbit, pad, cart, lay;
    let W = 1, H = 1;
    const right = new THREE.Vector3(), up = new THREE.Vector3(), back = new THREE.Vector3(), target = new THREE.Vector3();
    const objs = [];
    const byGame = {};
    const hitMeshes = [];
    const vids = {};
    const selGlow = new THREE.Color(0x464fee);
    let ringIdx = [];
    let ringAngle = 0, vel = 0, t = 0, last = 0, raf = 0;
    let sel = -1, pinned = -1, hoverIdx = -1, focusIdx = -1, cardHover = false, itchHover = false;
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
            depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 12,
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
    // Поки постер вантажиться (або якщо його немає): колір гри та назва.
    function placeholderTex(g) {
        return canvasTex(256, 144, (x, w, h) => {
            x.fillStyle = g.color;
            x.fillRect(0, 0, w, h);
            x.fillStyle = lum(g.color) > 0.5 ? "#121216" : "#fff";
            x.font = '600 26px "Lexend Deca", sans-serif';
            x.textAlign = "center";
            x.textBaseline = "middle";
            x.fillText(g.name, w / 2, h / 2);
        });
    }
    // Плейсхолдер замість логотипа itch.io: текст на фірмовому червоному.
    function itchLabelTex() {
        const draw = (x, w, h) => {
            x.fillStyle = "#fa5c5c";
            x.fillRect(0, 0, w, h);
            x.fillStyle = "#121216";
            x.font = '700 120px "Lexend Deca", sans-serif';
            x.textAlign = "center";
            x.textBaseline = "middle";
            x.fillText("itch.io", w / 2, h / 2);
        };
        const tex = canvasTex(512, 350, draw);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                draw(tex.image.getContext("2d"), 512, 350);
                tex.needsUpdate = true;
            });
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
    function makeHandheld(g, gi) {
        const { group, pivot } = rotGroup();
        const glow = glowOf(g);
        const D = 0.12, B = 0.015, zf = D / 2 + B;
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a4b57, roughness: 0.55, metalness: 0.05 });
        pivot.add(new THREE.Mesh(extrude(roundedRect(1, 0.8, 0.1), D, B), bodyMat));

        const bezel = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.52), new THREE.MeshBasicMaterial({ color: 0x101015 }));
        bezel.position.set(0, 0.1, zf + 0.001);
        const placeholder = placeholderTex(g);
        const screenMat = new THREE.MeshBasicMaterial({ map: placeholder });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), screenMat);
        screen.position.set(0, 0.1, zf + 0.002);
        const rimMat = new THREE.MeshBasicMaterial({ color: glow.clone() });
        const rim = new THREE.Mesh(new THREE.ShapeGeometry(frameShape(0.94, 0.6, 0.04)), rimMat);
        rim.position.set(0, 0.1, zf + 0.0005);

        const btnA = new THREE.MeshStandardMaterial({ color: 0xe24b4a, roughness: 0.5 });
        const btnB = new THREE.MeshStandardMaterial({ color: 0xd3d1c7, roughness: 0.5 });
        const a = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), btnA);
        const b = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), btnB);
        a.position.set(0.3, -0.27, zf + 0.002);
        b.position.set(0.2, -0.27, zf + 0.002);
        pivot.add(bezel, screen, rim, a, b);

        const halo = sprite(glow.clone(), 0.1, 2.4, -0.25);
        group.add(halo);
        pivot.add(makeHit(1.1, 0.92, 0.4, { gi }));

        const o = {
            gi, group, pivot, halo, glow, screenMat, rimMat, placeholder, still: placeholder,
            tint: [[bodyMat, bodyMat.color.clone()], [btnA, btnA.color.clone()], [btnB, btnB.color.clone()]],
            s: 0, dim: 1,
        };
        if (g.poster) {
            new THREE.TextureLoader().load(g.poster, (tex) => {
                tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                const wasStill = screenMat.map === o.still;
                o.still = tex;
                if (wasStill) {
                    screenMat.map = tex;
                    screenMat.needsUpdate = true;
                }
            });
        }
        return o;
    }

    function makePad() {
        const { group, pivot } = rotGroup();
        const s = new THREE.Shape();
        s.moveTo(-0.55, 0.33);
        s.lineTo(0.55, 0.33);
        s.quadraticCurveTo(0.8, 0.33, 0.8, 0.1);
        s.bezierCurveTo(0.82, -0.2, 0.78, -0.45, 0.58, -0.45);
        s.bezierCurveTo(0.42, -0.45, 0.38, -0.25, 0.3, -0.12);
        s.lineTo(-0.3, -0.12);
        s.bezierCurveTo(-0.38, -0.25, -0.42, -0.45, -0.58, -0.45);
        s.bezierCurveTo(-0.78, -0.45, -0.82, -0.2, -0.8, 0.1);
        s.quadraticCurveTo(-0.8, 0.33, -0.55, 0.33);
        const D = 0.26, B = 0.05, zf = D / 2 + B;
        pivot.add(new THREE.Mesh(extrude(s, D, B), new THREE.MeshStandardMaterial({ color: 0x464fee, roughness: 0.45, metalness: 0.05 })));

        const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const accent = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x000000 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x2a30b0, roughness: 0.5 });
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.05), white);
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.05), white);
        h.position.set(-0.42, 0.09, zf + 0.02);
        v.position.copy(h.position);
        const disc = (r, mat, x, y, hgt) => {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 24), mat);
            m.rotation.x = Math.PI / 2;
            m.position.set(x, y, zf + hgt / 2);
            return m;
        };
        pivot.add(h, v, disc(0.06, white, 0.36, 0.17, 0.05), disc(0.06, accent, 0.5, 0.04, 0.05), disc(0.075, dark, -0.2, -0.04, 0.04), disc(0.075, dark, 0.2, -0.04, 0.04));
        group.add(sprite(0x464fee, 0.28, 3.6, -0.5));
        return { group, pivot, accent, px: 0, py: 0 };
    }

    function makeCartridge() {
        const { group, pivot } = rotGroup();
        const sh = new THREE.Shape();
        sh.moveTo(-0.45, 0.5);
        sh.lineTo(0.45, 0.5);
        sh.lineTo(0.45, -0.32);
        sh.lineTo(0.34, -0.32);
        sh.lineTo(0.34, -0.5);
        sh.lineTo(-0.34, -0.5);
        sh.lineTo(-0.34, -0.32);
        sh.lineTo(-0.45, -0.32);
        sh.lineTo(-0.45, 0.5);
        const D = 0.12, B = 0.02, zf = D / 2 + B;
        pivot.add(new THREE.Mesh(extrude(sh, D, B), new THREE.MeshStandardMaterial({ color: 0x4a4b57, roughness: 0.55, metalness: 0.05 })));
        const labelMat = new THREE.MeshBasicMaterial({ map: itchLabelTex() });
        const label = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.52), labelMat);
        label.position.set(0, 0.15, zf + 0.002);
        const ridge = new THREE.MeshBasicMaterial({ color: 0x33343e });
        for (const y of [-0.1, -0.17]) {
            const r = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.025), ridge);
            r.position.set(0, y, zf + 0.002);
            pivot.add(r);
        }
        pivot.add(label);
        const halo = sprite(0xfa5c5c, 0.15, 2.4, -0.25);
        group.add(halo);
        pivot.add(makeHit(1.0, 1.1, 0.4, { itch: true }));
        return { group, pivot, labelMat, halo, s: 0, base: new THREE.Vector3() };
    }

    // ---------- відео ----------
    function startVideo(gi) {
        const o = byGame[gi];
        if (!o || !GAMES[gi].video || saveData) return;
        let v = vids[gi];
        if (!v) {
            const el = document.createElement("video");
            el.muted = true;
            el.loop = true;
            el.playsInline = true;
            el.preload = "auto";
            el.setAttribute("muted", "");
            el.setAttribute("playsinline", "");
            el.src = GAMES[gi].video;
            const tex = new THREE.VideoTexture(el);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            v = vids[gi] = { el, tex };
            el.addEventListener("playing", () => {
                if (sel === gi) {
                    o.screenMat.map = tex;
                    o.screenMat.needsUpdate = true;
                }
            });
        }
        const p = v.el.play();
        if (p && p.catch) p.catch(() => {}); // автоплей відхилено: лишається постер
    }
    function stopVideo(gi) {
        const v = vids[gi], o = byGame[gi];
        if (!v) return;
        v.el.pause();
        if (o) {
            o.screenMat.map = o.still;
            o.screenMat.needsUpdate = true;
        }
    }

    // ---------- вибір гри, картка ----------
    function toPx(v) {
        const p = v.clone().project(camera);
        return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
    }
    function renderCard(i) {
        if (i < 0) {
            card.innerHTML = cardStatic ? `<p class="games-card__hint">${tr("games_hint")}</p>` : "";
            card.hidden = !cardStatic;
            return;
        }
        const g = GAMES[i];
        card.hidden = false;
        card.innerHTML =
            `<div class="games-card__type"><span class="games-card__dot" style="background:${g.color}"></span>${tr(g.typeKey)}</div>` +
            `<div class="games-card__name">${g.name}</div>` +
            `<div class="games-card__desc">${tr(g.descKey)}</div>` +
            `<a class="project_block__link" style="--link-color:${g.color}" href="${g.url}" target="_blank" rel="noopener">${tr("view_game")}</a>`;
    }
    function placeCard() {
        if (cardStatic || sel < 0 || card.hidden || !byGame[sel]) return;
        const o = byGame[sel];
        const p = toPx(o.group.position);
        const hw = toPx(o.group.position.clone().addScaledVector(right, 0.6)).x - p.x;
        let x = p.x + hw + 14;
        if (x + CARD_W > W - 8) x = p.x - hw - 14 - CARD_W;
        const y = Math.max(8, Math.min(H - card.offsetHeight - 8, p.y - 34));
        card.style.left = Math.max(8, x) + "px";
        card.style.top = y + "px";
    }
    function apply(i) {
        if (i === sel) return;
        clearTimeout(playT);
        if (sel >= 0) stopVideo(sel);
        sel = i;
        if (i >= 0) {
            const o = byGame[i];
            if (o) selGlow.copy(o.glow);
            if (lastType === "mouse") playT = setTimeout(() => sel === i && startVideo(i), 120);
            else startVideo(i); // на дотик play() має йти синхронно з жестом (iOS)
        }
        renderCard(i);
        placeCard();
    }
    // Пріоритет: закріплена > під курсором > утримана карткою > у фокусі клавіатури. Інакше знімаємо вибір із затримкою.
    function resolve() {
        clearTimeout(clearT);
        if (pinned >= 0) return apply(pinned);
        if (hoverIdx >= 0) return apply(hoverIdx);
        if (cardHover) return;
        if (focusIdx >= 0) return apply(focusIdx);
        clearT = setTimeout(() => {
            if (pinned < 0 && hoverIdx < 0 && !cardHover && focusIdx < 0) apply(-1);
        }, 200);
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
        const h = ray.intersectObjects(hitMeshes, false)[0];
        return h ? h.object.userData : null;
    }
    function setPtr(e) {
        const r = canvas.getBoundingClientRect();
        ptr = { clientX: e.clientX, clientY: e.clientY, type: e.pointerType, nx: ((e.clientX - r.left) / r.width) * 2 - 1, ny: ((e.clientY - r.top) / r.height) * 2 - 1 };
    }
    function updateHover() {
        if (!ptr || ptr.type === "touch" || dragging) return;
        const h = pickAt(ptr);
        itchHover = !!(h && h.itch);
        canvas.style.cursor = h ? "pointer" : "";
        const gi = h && !h.itch ? h.gi : -1;
        if (gi !== hoverIdx) {
            hoverIdx = gi;
            resolve();
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
            if (!dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
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
            if (h && h.itch) {
                track("itch.io");
                window.open(itchLink.href, "_blank", "noopener");
                return;
            }
            pinned = h ? (pinned === h.gi ? -1 : h.gi) : -1;
            if (e.pointerType !== "mouse") hoverIdx = -1;
            resolve();
        };
        canvas.addEventListener("pointerup", end);
        canvas.addEventListener("pointercancel", end);
        canvas.addEventListener("pointerleave", (e) => {
            if (e.pointerType === "touch") return;
            ptr = null;
            itchHover = false;
            canvas.style.cursor = "";
            hoverIdx = -1;
            resolve();
        });
        card.addEventListener("pointerenter", () => { cardHover = true; resolve(); });
        card.addEventListener("pointerleave", () => { cardHover = false; resolve(); });
        card.addEventListener("click", (e) => { if (e.target.closest("a") && sel >= 0) track(GAMES[sel].id); });
        itchLink.addEventListener("click", () => track("itch.io"));

        links.addEventListener("focusin", (e) => {
            const a = e.target.closest("a");
            if (!a) return;
            lastType = "key";
            focusIdx = byGame[+a.dataset.gi] ? +a.dataset.gi : -1;
            resolve();
        });
        links.addEventListener("focusout", () => { focusIdx = -1; resolve(); });
        document.addEventListener("keydown", (e) => {
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
            renderCard(sel);
            placeCard();
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
        orbit.scale.setScalar(lay.R);
        cart.base.copy(right).multiplyScalar(lay.cart.x).addScaledVector(up, lay.cart.y);
        const cap = toPx(cart.base.clone().addScaledVector(up, -0.85));
        itchLink.style.left = cap.x + "px";
        itchLink.style.top = cap.y + "px";
        cardStatic = mqStatic.matches;
        renderCard(sel);
        placeCard();
    }

    // ---------- кадр ----------
    function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const f = 1 - Math.pow(0.001, dt); // згладжування ~ 0.11 за кадр при 60 fps
        const secs = reduce ? 0 : now / 1000;

        if (sel < 0 && !dragging) {
            const auto = autoStopped || reduce ? 0 : AUTO_SPEED;
            vel += (auto - vel) * (1 - Math.pow(0.05, dt)); // інерція після перетягування затухає до авто-швидкості
            ringAngle += vel * dt;
            t += dt;
        }
        if (!coarse) updateHover();

        const n = objs.length;
        objs.forEach((o, k) => {
            const a = ringAngle + (k * Math.PI * 2) / n;
            const sn = Math.sin(a);
            o.group.position.set(lay.R * Math.cos(a), 0, lay.R * sn);
            const depth = (sn + 1) / 2; // 1 = спереду
            o.s += ((sel === o.gi ? 1 : 0) - o.s) * f;
            o.dim += ((sel >= 0 && sel !== o.gi ? 0.45 : 1) - o.dim) * f;
            const b = (0.55 + 0.45 * depth) * o.dim;
            o.pivot.rotation.set(-lay.elev * 0.8, 0.38 * Math.sin(t * 1.1 + k) * motion * (1 - o.s), 0);
            o.group.scale.setScalar((0.9 + 0.1 * depth) * (1 + 0.18 * o.s));
            o.tint.forEach(([m, base]) => m.color.copy(base).multiplyScalar(b));
            o.screenMat.color.setScalar(b * (0.62 + 0.38 * o.s));
            o.rimMat.color.copy(o.glow).multiplyScalar(b * (0.5 + 0.5 * o.s));
            o.halo.material.opacity = (0.1 + 0.3 * o.s) * o.dim * (0.5 + 0.5 * depth);
        });

        const tx = ptr && ptr.type !== "touch" && !reduce ? ptr : null;
        pad.px += ((tx ? tx.nx : 0) - pad.px) * f * 0.5;
        pad.py += ((tx ? tx.ny : 0) - pad.py) * f * 0.5;
        pad.pivot.rotation.set(-lay.elev + 0.09 * Math.sin(secs / 1.1) * motion - pad.py * 0.12, 0.42 * Math.sin(secs / 1.5) * motion + pad.px * 0.18, 0);
        padGlow += ((sel >= 0 ? 1 : 0) - padGlow) * f;
        pad.accent.emissive.copy(selGlow).multiplyScalar(padGlow);

        cart.s += ((itchHover ? 1 : 0) - cart.s) * f;
        cart.group.position.copy(cart.base).addScaledVector(up, Math.sin(secs * 3.9) * 0.04 * motion);
        cart.pivot.rotation.set(-lay.elev * 0.6, 0.49 * Math.sin(secs * 1.1) * motion * (1 - cart.s), 0);
        cart.group.scale.setScalar(1.15 * (1 + 0.12 * cart.s));
        cart.labelMat.color.setScalar(0.8 + 0.2 * cart.s);
        cart.halo.material.opacity = 0.15 + 0.3 * cart.s;

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

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const sun = new THREE.DirectionalLight(0xffffff, 0.7);
        sun.position.set(-3, 6, 8);
        scene.add(sun);

        const pts = [];
        for (let i = 0; i <= 128; i++) pts.push(new THREE.Vector3(Math.cos((i / 128) * Math.PI * 2), 0, Math.sin((i / 128) * Math.PI * 2)));
        orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, dashSize: 0.03, gapSize: 0.04 }));
        orbit.computeLineDistances();
        scene.add(orbit);

        ringIdx = ringIndices(GAMES);
        ringIdx.forEach((gi) => {
            const o = makeHandheld(GAMES[gi], gi);
            objs.push(o);
            byGame[gi] = o;
            scene.add(o.group);
        });
        pad = makePad();
        cart = makeCartridge();
        scene.add(pad.group, cart.group);
        hitMeshes.length = 0;
        scene.traverse((m) => { if (m.userData && (m.userData.itch || m.userData.gi !== undefined)) hitMeshes.push(m); });

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
