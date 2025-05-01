document.querySelectorAll(".translator__item").forEach((item) => {
    item.addEventListener("click", () => {
        // Знаходимо поточний вибраний елемент і прибираємо клас
        const selectedItem = document.querySelector(".translator__selected");
        if (selectedItem && selectedItem !== item) {
            selectedItem.classList.remove("translator__selected");
        }

        // Додаємо клас до натиснутого елемента
        item.classList.add("translator__selected");
        changeLanguage(item.id);
    });
});

function changeLanguage(language) {
    // Отримати всі елементи, які мають атрибут data-key
    const elements = document.querySelectorAll("[data-key]");

    // Пройти по кожному елементу та змінити текст на відповідний переклад
    elements.forEach((element) => {
        const key = element.getAttribute("data-key");
        if (translations[language][key]) {
            element.innerHTML = translations[language][key];
        }
    });

    // Зміна класу стилю залежно від мови
    const body = document.body; // або інший контейнер, де треба змінити стиль

    if (language === "en") {
        body.classList.remove("ua-style");
        body.classList.add("en-style");
        document.documentElement.lang = "en";
    } else if (language === "ua") {
        body.classList.remove("en-style");
        body.classList.add("ua-style");
        document.documentElement.lang = "ua";
    }
}

// Встановити мову за замовчуванням
document.addEventListener("DOMContentLoaded", () => {
    changeLanguage("en"); // Початкова мова
});
