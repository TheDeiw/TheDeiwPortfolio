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

document.querySelectorAll(".projects_games__project_block").forEach((block) => {
    block
        .querySelector(".project_block__gradient_color")
        .style.setProperty("--link-color", block.getAttribute("data-color"));
    block.querySelector(".project_block__link").style.setProperty("--link-color", block.getAttribute("data-color"));
});
