document.addEventListener("DOMContentLoaded", function () {
	const dropdownBtn = document.getElementById("dropdownBtn");
	const dropdownMenu = document.getElementById("dropdownMenu");

	dropdownBtn.addEventListener("click", function () {
		 // Отримуємо координати кнопки
		 const rect = dropdownBtn.getBoundingClientRect();
		 
		 // Встановлюємо позицію меню поза nav
		 dropdownMenu.style.position = "absolute";
		 dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`;
		 dropdownMenu.style.left = `${rect.left + window.scrollX}px`;
		 dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
	});

	// Закриваємо список при кліку поза ним
	document.addEventListener("click", function (event) {
		 if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
			  dropdownMenu.style.display = "none";
		 }
	});
});
