// document.addEventListener("DOMContentLoaded", function () {
// 	const dropdownBtn = document.getElementById("dropdownBtn");
// 	const dropdownMenu = document.getElementById("dropdownMenu");

// 	dropdownBtn.addEventListener("click", function () {
// 		 // Отримуємо координати кнопки
// 		 const rect = dropdownBtn.getBoundingClientRect();

// 		 // Встановлюємо позицію меню поза nav
// 		 dropdownMenu.style.position = "absolute";
// 		 dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`;
// 		 dropdownMenu.style.left = `${rect.left + window.scrollX}px`;
// 		 dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
// 	});

// 	// Закриваємо список при кліку поза ним
// 	document.addEventListener("click", function (event) {
// 		 if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
// 			  dropdownMenu.style.display = "none";
// 		 }
// 	});
// });

document.addEventListener("DOMContentLoaded", function () {
    const downloadButton = document.querySelector(".menu__link_downloader");
    const gamesList = document.querySelector(".menu_games__list");
    const dropdown = document.querySelector(".menu_games__drop-down");

    if (downloadButton && gamesList) {
        downloadButton.addEventListener("click", function () {
            gamesList.classList.toggle("active");
            dropdown.classList.toggle("active");
        });

        // Закриття меню при кліку поза ним
        document.addEventListener("click", function (event) {
            if (!downloadButton.contains(event.target) && !gamesList.contains(event.target)) {
                gamesList.classList.remove("active");
                dropdown.classList.remove("active");
            }
        });
    }
});

document.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 0) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

document.querySelectorAll(".link_block").forEach((link) => {
    link.style.setProperty("--link-color", link.getAttribute("data-color"));
});
