document.addEventListener("DOMContentLoaded", function () {
    const downloadButton = document.querySelector(".menu_games__button");
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

document.querySelectorAll(".menu_games__link").forEach((link) => {
    link.style.setProperty("--link-color", link.getAttribute("data-color"));
});

document.querySelectorAll(".link_block").forEach((link) => {
    link.style.setProperty("--link-color", link.getAttribute("data-color"));
});

document.querySelectorAll(".projects_games__project_block").forEach((block) => {
    block
        .querySelector(".project_block__gradient_color")
        .style.setProperty("--link-color", block.getAttribute("data-color"));
    block.querySelector(".project_block__link").style.setProperty("--link-color", block.getAttribute("data-color"));
});
