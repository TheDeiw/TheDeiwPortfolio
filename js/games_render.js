// Генерує з GAMES запасний список у #games.
// Має виконуватись до menu_control.js: той на старті ставить --link-color цим елементам.
// Тексти беремо з translations.en (як і зараз до першого перемикання мови); data-key лишаємо для changeLanguage.
(function () {
    const t = translations.en;

    const list = document.getElementById("games-fallback");
    if (list) {
        list.innerHTML = GAMES.map(
            (g, i) =>
                `<div class="projects_games__project_block${i % 2 ? " inverse" : ""}" data-color="${g.color}">` +
                `<div class="project_block__description"><div class="project_block__description_text_box">` +
                `<div class="project_block__name">${g.name}</div>` +
                `<div class="project_block__type" data-key="${g.typeKey}">${t[g.typeKey]}</div>` +
                `<div class="project_block__description_text" data-key="${g.descKey}">${t[g.descKey]}</div></div>` +
                `<a href="${g.url}" target="_blank" class="project_block__link" data-key="view_game">${t.view_game}</a>` +
                `<div class="project_block__gradient_color"></div></div>` +
                `<img src="${g.cover}" class="project_block__img" alt="${g.name} game media image"></div>`
        ).join("");
    }
})();
