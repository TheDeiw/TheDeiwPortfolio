const isMobile = {
	Android: function () {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function () {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function () {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function () {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function () {
		return navigator.userAgent.match(/IEMobile/i);
	},
	any: function () {
		return (
			isMobile.Android() ||
			isMobile.BlackBerry() ||
			isMobile.iOS() ||
			isMobile.Opera() ||
			isMobile.Windows());
	}
}

if (isMobile.any()){
	document.body.classList.add('_touch');
} else {
	document.body.classList.add('_pc');
}

const iconMenu = document.querySelector('.header__menu_icon');
if (iconMenu){
	const iconBody = document.querySelector('.menu__list');
	iconMenu.addEventListener("click", function(e){
		iconMenu.classList.toggle('open');
		iconBody.classList.toggle('active');
	})
}
