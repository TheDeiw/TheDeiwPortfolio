document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container3D");

    if (!container) {
        console.error("❌ Контейнер #container3D не знайдено!");
        return;
    }

    // Створюємо сцену
    const scene = new THREE.Scene();

    // Камера
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.8, 3); // Камера перед об'єктом

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
    let previousMouseY = 0;
    let velocityX = 0; // Швидкість обертання по X
    let velocityY = 0; // Швидкість обертання по Y

    loader.load(
        "assets/3d/TheDeiw.gltf",
        (gltf) => {
            model = gltf.scene;
            if (isMobile.any()) {
                model.scale.set(0.09, 0.09, 0.09);
            } else {
                model.scale.set(0.12, 0.12, 0.12);
            }
            scene.add(model);
        },
        undefined,
        (error) => {
            console.error("Помилка завантаження моделі", error);
        }
    );

    // Обмеження для нахилу по Y (±10 градусів)
    const minRotationX = THREE.MathUtils.degToRad(-10); // -10 градусів
    const maxRotationX = THREE.MathUtils.degToRad(10); // 10 градусів

    // Анімація (ефект невагомості + обертання)
    function animate() {
        requestAnimationFrame(animate);

        if (model) {
            // Ефект невагомості
            floatOffset += 0.02;
            model.position.y = Math.sin(floatOffset) * 0.1;

            // Обертання по інерції
            if (!isDragging) {
                velocityX *= 0.95;
                velocityY *= 0.95;

                model.rotation.y += velocityX;
                model.rotation.x += velocityY;

                // Обмежуємо нахил по осі X
                model.rotation.x = THREE.MathUtils.clamp(model.rotation.x, minRotationX, maxRotationX);
            }
        }

        renderer.render(scene, camera);
    }
    animate();

    // Взаємодія з мишею
    container.addEventListener("mousedown", function (event) {
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    });

    container.addEventListener("mousemove", function (event) {
        if (isDragging && model) {
            const deltaX = event.clientX - previousMouseX;
            const deltaY = event.clientY - previousMouseY;

            model.rotation.y += deltaX * 0.01; // Горизонтальне обертання
            model.rotation.x += deltaY * 0.01; // Вертикальне обертання

            // Обмежуємо нахил по осі X
            model.rotation.x = THREE.MathUtils.clamp(model.rotation.x, minRotationX, maxRotationX);

            velocityX = deltaX * 0.002;
            velocityY = deltaY * 0.002;

            previousMouseX = event.clientX;
            previousMouseY = event.clientY;
        }
    });

    container.addEventListener("mouseup", function () {
        isDragging = false;
    });

    container.addEventListener("mouseleave", function () {
        isDragging = false;
    });

    // Додано: Взаємодія з сенсорними екранами
    container.addEventListener("touchstart", function (event) {
        if (event.touches.length === 1) {
            isDragging = true;
            previousMouseX = event.touches[0].clientX;
            previousMouseY = event.touches[0].clientY;
        }
    });

    container.addEventListener("touchmove", function (event) {
        if (isDragging && model && event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - previousMouseX;
            const deltaY = event.touches[0].clientY - previousMouseY;

            model.rotation.y += deltaX * 0.01;
            model.rotation.x += deltaY * 0.01;

            // Обмеження нахилу
            model.rotation.x = THREE.MathUtils.clamp(model.rotation.x, minRotationX, maxRotationX);

            velocityX = deltaX * 0.002;
            velocityY = deltaY * 0.002;

            previousMouseX = event.touches[0].clientX;
            previousMouseY = event.touches[0].clientY;
        }
    });

    container.addEventListener("touchend", function () {
        isDragging = false;
    });

    // Оновлення розміру при зміні вікна
    window.addEventListener("resize", function () {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    });
});
