document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container3D");

    if (!container) {
        console.error("❌ Контейнер #container3D не знайдено!");
        return;
    }

    // Створюємо сцену
    const scene = new THREE.Scene();

    // Камера
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0.8 ,3); // Камера перед об'єктом

    // Рендерер (СТВОРЮЄМО ТІЛЬКИ ВСЕРЕДИНІ container3D)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Додаємо світло
    const light = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light);

    const pointLight = new THREE.PointLight(0xffffff, 3);
    pointLight.position.set(-2, 2, 4);
    scene.add(pointLight);


    // Завантажуємо модель
    let loader = new THREE.GLTFLoader();
    let model = null;
    let floatOffset = 0; // Для ефекту невагомості
    let isDragging = false;
    let previousMouseX = 0;
    let velocity = 0; // Швидкість обертання

    loader.load("img/3d/TheDeiw.gltf", (gltf) => {
        model = gltf.scene;
        model.scale.set(0.12, 0.12, 0.12);
        scene.add(model);
    }, undefined, (error) => {
        console.error("Помилка завантаження моделі", error);
    });

    // Анімація обертання
    function animate() {
        requestAnimationFrame(animate);

        if (model) {
            // Ефект невагомості (легке піднімання-опускання)
            floatOffset += 0.02;
            model.position.y = Math.sin(floatOffset) * 0.01; // Коливання в межах ±0.1

            // Обертання по інерції
            if (!isDragging) {
                velocity *= 0.95; // Поступове зменшення швидкості
                model.rotation.y += velocity;
            }
        }

        renderer.render(scene, camera);
    }
    animate();

    // Взаємодія з мишею
    container.addEventListener("mousedown", function (event) {
        isDragging = true;
        previousMouseX = event.clientX;
    });

    container.addEventListener("mousemove", function (event) {
        if (isDragging && model) {
            const deltaX = event.clientX - previousMouseX;
            model.rotation.y += deltaX * 0.01;
            velocity = deltaX * 0.002; // Фіксуємо швидкість
            previousMouseX = event.clientX;
        }
    });

    container.addEventListener("mouseup", function () {
        isDragging = false;
    });

    container.addEventListener("mouseleave", function () {
        isDragging = false;
    });

    // Оновлення розміру при зміні вікна
    window.addEventListener("resize", () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    });
});