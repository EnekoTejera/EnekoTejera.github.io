/**
 * @file YoutubeConsent.js
 * @author Eneko Tejera (enekotejera@gmail.com)
 * @brief ask for consent before loading youtube videos
 * @date 2026-10-04
 *
 * @copyright Copyright (c) 2026
 *
 */
(function () {
  var TEXTS = {
    es: {
      notice: 'Al reproducir este vídeo se cargará YouTube (Google), que puede instalar cookies y recibir tu dirección IP.',
      button: 'Reproducir vídeo',
      more  : 'Más información',
      link  : 'Legal.html'
    },
    en: {
      notice: 'Playing this video will load YouTube (Google), which may set cookies and receive your IP address.',
      button: 'Play video',
      more  : 'More information',
      link  : 'Legal.html'
    }
  };

  function currentLang() {
    var l = (localStorage.getItem("language") || 'en').toLowerCase();
    return l.indexOf('en') === 0 ? 'en' : 'es';
  }

  function build(box) {
    var t = TEXTS[currentLang()];
    var title = box.dataset.title || 'YouTube';
    box.textContent = '';

    if (box.dataset.thumb) {
      var img = document.createElement('img');
      img.className = 'YtConsentThumb';
      img.src = box.dataset.thumb;
      img.alt = title;
      img.loading = 'lazy';
      box.appendChild(img);
    }

    var overlay = document.createElement('div');
    overlay.className = 'YtConsentOverlay';

    var p = document.createElement('p');
    p.className = 'YtConsentNotice';
    p.textContent = t.notice + ' ';
    var a = document.createElement('a');
    a.href = t.link;
    a.textContent = t.more;
    p.appendChild(a);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'YtConsentButton';
    btn.textContent = t.button;
    btn.setAttribute('aria-label', t.button + ': ' + title);
    btn.addEventListener('click', function () { load(box, title); });

    overlay.appendChild(p);
    overlay.appendChild(btn);
    box.appendChild(overlay);
  }

  function load(box, title) {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(box.dataset.yt) + '?autoplay=1&rel=0';
    iframe.title = title;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    box.textContent = '';
    box.appendChild(iframe);
  }

  function init() {
    document.querySelectorAll('.YtConsent').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  //To refresh the text when changing the language
  window.YTConsentRefresh = init;
})();