/**
 * @file Carousel.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief Carousel effect for the other projects in about me
 * @date 2026-09-29
 *
 * @copyright Copyright (c) 2026
 *
 */
function scrollOutro(direction) {

    var track = document.getElementById('OutroImgTxt');
    if (!track) return;

    var item = track.querySelector('.OutroImg');
    var styles = getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap) || 0;
    var amount = item ? item.getBoundingClientRect().width + gap : track.clientWidth;

    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
}