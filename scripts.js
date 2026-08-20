/* Appen — site-wide front-end enhancements
 *
 * Loaded from Site Settings > Custom Code > Footer via jsDelivr. Committed
 * unminified; jsDelivr minifies on request when linked as scripts.min.js.
 *
 * Every feature guards on its own selectors and runs inside its own
 * try/catch, so this file is inert on pages that don't use a given feature
 * and one failure can't take down the others.
 */
(function () {
  'use strict';

  if (window.__appenScripts) return;
  window.__appenScripts = true;

  var features = {};

  /* Sticky CTA tab
   *
   * Reveals the "Talk to an expert" tab once its sticky wrapper pins beneath
   * the nav, and retracts it on the way back up.
   *
   * Opt a page in by adding .sticky-cta_wrapper (position: sticky; top: 64px)
   * with a .sticky-cta_tab link inside it. No per-page configuration.
   *
   * Visibility and transitions live in styles.css under .sticky-cta_tab and
   * .sticky-cta_tab.is-visible — this only toggles the class.
   */
  features.stickyCtaTab = function () {
    var tab = document.querySelector('.sticky-cta_tab');
    var wrap = document.querySelector('.sticky-cta_wrapper');
    if (!tab || !wrap) return;

    var nav = document.querySelector('.nav.w-nav');
    var ticking = false;

    function update() {
      ticking = false;
      var navH = nav ? nav.getBoundingClientRect().height : 64;
      /* A pinned sticky element's top equals its CSS top value, and is
       * greater than it before pinning. The +1 absorbs subpixel drift. */
      tab.classList.toggle('is-visible', wrap.getBoundingClientRect().top <= navH + 1);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  };

  Object.keys(features).forEach(function (name) {
    try {
      features[name]();
    } catch (err) {
      console.warn('[appen] feature "' + name + '" failed:', err);
    }
  });
})();
