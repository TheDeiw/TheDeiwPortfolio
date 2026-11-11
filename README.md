# TheDeiw Portfolio
A modern, interactive personal portfolio website showcasing game development projects, web development work, and professional experience. Built with vanilla JavaScript and featuring a 3D animated logo, multilingual support, and responsive design.

Visit the live portfolio at: **[https://thedeiw.github.io/TheDeiwPortfolio/](https://thedeiw.github.io/TheDeiwPortfolio/)**

![Portfolio Preview](https://github.com/user-attachments/assets/4c91c4f2-5494-48a5-968c-040778f66181)

## ✨ Features

- **3D Interactive Logo**: Three.js-powered 3D logo animation on the main page
- **3D Games Ring**: Three.js ring of handheld "game screens" around a gamepad; hover or tap shows a card and plays a short clip, with a plain list as fallback
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


## 🎮 Games section

The Games section is a 3D ring (`js/games_scene.js`) built from one list in `js/games_data.js`. The same list generates the "Download games" dropdown and a plain fallback list (`js/games_render.js`). The fallback is shown when WebGL is unavailable, or when the page is opened with `?games=list`.

### Adding a game
1. Convert the full cover to webp; it is used on the 3D screen, in the card and in the fallback list:
   ```bash
   ffmpeg -i cover.png -c:v libwebp -quality 85 assets/img/projects_games/<id>.webp
   ```
   Optional: a gameplay video for the card (no crop, no audio):
   ```bash
   ffmpeg -i source.mp4 -vf "fps=24" -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 32 -preset slow -movflags +faststart -an assets/video/games/<id>.mp4
   ```
   Without `video` the card shows the full cover.
2. Add an entry to `GAMES` in `js/games_data.js`.
3. Add the description key to `js/text_languages.js` (`en` and `ua`).
4. Add the link to the `<noscript>` list in `index.html`.

The ring shows at most 8 games; mark the ones that must stay on it with `featured: true`.
Serve the site over HTTP (for example `python -m http.server`): textures and videos do not load from `file://`.

## 📄 License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025, Dmytro Chekhovskyi

## 🙏 Acknowledgments

- **Three.js** for 3D graphics capabilities
- **Google Fonts** for typography
- **GitHub Pages** for hosting
- All the open-source tools and libraries used in this project

---

<div align="center">
  <p>Made with ❤️ by TheDeiw</p>
</div>
