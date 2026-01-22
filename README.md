# TheDeiw Portfolio

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://thedeiw.github.io/TheDeiwPortfolio/)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-green?style=for-the-badge)](LICENSE)

A modern, interactive personal portfolio website showcasing game development projects, web development work, and professional experience. Built with vanilla JavaScript and featuring a 3D animated logo, multilingual support, and responsive design.

![Portfolio Preview](https://github.com/user-attachments/assets/4c91c4f2-5494-48a5-968c-040778f66181)

## 🌟 About

This is the personal portfolio of **Dmytro Chekhovskyi** (TheDeiw), a Unity developer, frontend developer, and Photoshop editor based in Lviv, Ukraine. The portfolio showcases:

- **Games**: Unity-based games including Blocky and Fall Balls
- **Web Projects**: Portfolio websites and web applications
- **Academic Projects**: Coursework and computer graphics projects
- **Professional Links**: Connections to various social and professional platforms

## ✨ Features

- **3D Interactive Logo**: Three.js-powered 3D logo animation on the main page
- **Multilingual Support**: Toggle between English (EN) and Ukrainian (UA) languages
- **Responsive Design**: Fully adaptive layout for desktop, tablet, and mobile devices
- **Smooth Navigation**: Anchor-based navigation with smooth scrolling
- **Project Showcases**: Detailed project cards with descriptions and links
- **Social Integration**: Links to 15+ social and professional platforms
- **SEO Optimized**: Comprehensive meta tags and Open Graph support
- **Analytics**: Google Analytics integration for visitor tracking

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Custom styling with adaptive/responsive design
- **JavaScript (ES6+)**: Vanilla JavaScript for all functionality

### Libraries & Tools
- **Three.js (r128)**: 3D graphics rendering for the logo animation
- **GLTFLoader**: 3D model loading
- **Google Fonts**: Geologica, Lexend Deca, and Fredoka font families
- **Google Analytics**: Visitor tracking and analytics

### Design
- Custom CSS with gradient backgrounds
- Mobile-first responsive design
- Custom color schemes for different sections
- Animated hover effects and transitions

## 📁 Project Structure

```
TheDeiwPortfolio/
├── index.html              # Main HTML file
├── css/
│   ├── style.css          # Main stylesheet
│   └── adaptive_style.css # Responsive design styles
├── js/
│   ├── 3d_logo.js         # Three.js 3D logo animation
│   ├── translation.js     # Language switching logic
│   ├── text_languages.js  # Translation text content
│   ├── menu_control.js    # Navigation menu controls
│   └── adaptability.js    # Responsive behavior handlers
├── assets/
│   ├── img/               # Images and icons
│   └── 3d/                # 3D models for logo
├── LICENSE                # BSD 3-Clause License
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- (Optional) A local web server for development

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheDeiw/TheDeiwPortfolio.git
   cd TheDeiwPortfolio
   ```

2. **Open in browser**
   
   Simply open `index.html` in your web browser, or use a local development server:

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js (http-server)
   npx http-server

   # Using PHP
   php -S localhost:8000
   ```

3. **Access the portfolio**
   
   Navigate to `http://localhost:8000` in your browser

## 🌐 Live Demo

Visit the live portfolio at: **[https://thedeiw.github.io/TheDeiwPortfolio/](https://thedeiw.github.io/TheDeiwPortfolio/)**

## 📱 Features Breakdown

### Main Page
- Animated 3D logo created with Three.js
- Welcoming heading with gradient background effects
- Smooth scroll navigation

### About Me Section
- Personal avatar and bio
- Professional description and skills
- Links to 15+ social platforms:
  - Instagram, LinkedIn, Reddit, Threads
  - GitHub, Figma, YouTube, DOU.ua
  - Itch.io, Bluesky, Facebook, Steam
  - Pinterest, X/Twitter, Epic Games

### Games Section
- **Blocky**: 3D puzzle game with orthographic camera
- **Fall Balls**: Colorful ball-catching game
- Download links for each game

### Projects Section
- **TheDeiw's Games**: Portfolio website for game showcases
- **Events Lviv**: Notion-based list of annual events in Lviv
- **Division Plus**: WPF data management application (coursework)
- **Basics of Computer Graphics**: Collection of computer graphics lab work

## 🎨 Customization

### Changing Colors
Edit the CSS variables in `css/style.css` to customize the color scheme:
```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

### Adding Projects
Add new project blocks in the `index.html` file within the projects section:
```html
<div class="projects_games__project_block" data-color="#yourcolor">
  <!-- Your project content -->
</div>
```

### Translations
Add or modify translations in `js/text_languages.js`:
```javascript
const translations = {
  en: { key: "English text" },
  ua: { key: "Український текст" }
};
```

## 🤝 Contributing

While this is a personal portfolio, suggestions and feedback are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -m 'Add some improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

## 📄 License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025, Dmytro Chekhovskyi

## 👤 Author

**Dmytro Chekhovskyi (TheDeiw)**
- Website: [TheDeiw Portfolio](https://thedeiw.github.io/TheDeiwPortfolio/)
- GitHub: [@TheDeiw](https://github.com/TheDeiw)
- LinkedIn: [Dmytro Chekhovskyi](https://www.linkedin.com/in/dmytro-chekhovskyi-81baba291/)
- Itch.io: [thedeiw](https://thedeiw.itch.io/)

## 🙏 Acknowledgments

- **Three.js** for 3D graphics capabilities
- **Google Fonts** for typography
- **GitHub Pages** for hosting
- All the open-source tools and libraries used in this project

---

<div align="center">
  <p>Made with ❤️ by TheDeiw</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
