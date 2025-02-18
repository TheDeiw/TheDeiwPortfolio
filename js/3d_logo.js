// const container = document.getElementById('container3D');
//     const scene = new THREE.Scene();
//     //scene.background = new THREE.Color(0xffffff); // Установка білого фону

//     const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(container.clientWidth, container.clientHeight);
//     renderer.setClearColor(0x000000, 0);
//     container.appendChild(renderer.domElement);

//     // Додавання різних джерел світла
//     const ambientLight = new THREE.AmbientLight(0x404040); // м'яке світло
//     scene.add(ambientLight);

//     const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
//     directionalLight.position.set(5, 10, 7.5);
//     scene.add(directionalLight);

//     const pointLight = new THREE.PointLight(0xffffff, 1, 100);
//     pointLight.position.set(5, 5, 5);
//     scene.add(pointLight);

//     const spotLight = new THREE.SpotLight(0xffffff, 1);
//     spotLight.position.set(5, 10, 5);
//     scene.add(spotLight);

//     const loader = new THREE.GLTFLoader();
//     loader.load('img/3d/TheDeiw.gltf', function(gltf) {
//         const object = gltf.scene;
//         scene.add(object);

//         object.position.set(0, 0, 0);  // Розташування об'єкта в центрі

//         camera.position.set(0, 1, 10);

//         function animate() {
//             requestAnimationFrame(animate);
//             object.rotation.y += 0.01;  // Обертання об'єкта
//             renderer.render(scene, camera);
//         }
//         object.scale.set(0.5, 0.5, 0.5); // Зменшення об'єкта вдвічі
//         animate();
//     }, undefined, function(error) {
//         console.error('Error loading the GLTF file:', error);
//     });

//     window.addEventListener('resize', function() {
//         const width = container.clientWidth;
//         const height = container.clientHeight;
//         renderer.setSize(width, height);
//         camera.aspect = width / height;
//         camera.updateProjectionMatrix();
//     });

// ------------------------------------------------------------

// scene = new THREE.Scene();
// camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
// camera.position.z = 10;

// const container = document.getElementById("container3D");
// // Рендерер
// const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
// renderer.setSize(container.clientWidth, container.clientHeight);
// container.appendChild(renderer.domElement);

// renderer.domElement.setAttribute("id", "container3D");
// document.body.insertBefore(renderer.domElement, document.body.firstChild);

// const aLight = new THREE.AmbientLight(0x404040, 1.2);
// scene.add(aLight);

// const pLight = new THREE.PointLight(0xFFFFFF, 1.2);
// pLight.position.set(0, -3, 7);
// scene.add(pLight);

// let loader = new THREE.GLTFLoader();
// let obj = null;

// loader.load(
//     './img/3d/TheDeiw.gltf', 
//     function (gltf) {
//         obj = gltf.scene;
//         obj.scale.set(1, 1, 1);
//         scene.add(obj);
//     },
//     undefined,
//     function (error) {
//         console.error('Помилка завантаження:', error);
//     }
// );

// // Функція анімації
// function animate() {
//     requestAnimationFrame(animate);
//     if (obj) obj.rotation.y += 0.001;
//     renderer.render(scene, camera);
// }

// animate();

// // Оновлення розміру при зміні вікна
// window.addEventListener("resize", () => {
//     renderer.setSize(container.clientWidth, container.clientHeight);
//     camera.aspect = container.clientWidth / container.clientHeight;
//     camera.updateProjectionMatrix();
// });

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