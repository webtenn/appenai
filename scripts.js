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

  /* FAQ accordion
   *
   * Opt a page in by adding a .faq_list of .faq_item blocks, each holding a
   * .faq_question trigger and a .faq_answer > .faq_answer-inner pair. Works
   * with a hand-built list or a CMS Collection List — the lookups use
   * closest(), so Webflow's .w-dyn-item wrappers don't matter.
   *
   * Optional attributes on .faq_list:
   *   data-faq-single      only one item open at a time
   *   data-faq-open-first  open the first item on load
   *
   * Open/closed appearance lives in styles.css under .faq_item.is-open — this
   * only toggles the class and keeps the ARIA state in sync.
   */
  features.faqAccordion = function () {
    var lists = document.querySelectorAll('.faq_list');
    if (!lists.length) return;

    var uid = 0;

    function setOpen(item, open) {
      item.classList.toggle('is-open', open);
      var q = item.querySelector('.faq_question');
      if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    Array.prototype.forEach.call(lists, function (list) {
      var single = list.hasAttribute('data-faq-single');
      var items = list.querySelectorAll('.faq_item');
      if (!items.length) return;

      /* Webflow can't output a <button>, so upgrade the trigger div here. */
      Array.prototype.forEach.call(items, function (item) {
        var q = item.querySelector('.faq_question');
        var a = item.querySelector('.faq_answer');
        if (!q || !a) return;

        uid += 1;
        if (!a.id) a.id = 'faq-answer-' + uid;
        q.setAttribute('role', 'button');
        q.setAttribute('tabindex', '0');
        q.setAttribute('aria-controls', a.id);
        setOpen(item, item.classList.contains('is-open'));
      });

      if (list.hasAttribute('data-faq-open-first')) setOpen(items[0], true);

      /* One delegated listener per list, so item count and CMS wrappers
       * don't matter. */
      list.addEventListener('click', function (e) {
        var q = e.target.closest('.faq_question');
        if (!q || !list.contains(q)) return;
        var item = q.closest('.faq_item');
        if (!item) return;

        var willOpen = !item.classList.contains('is-open');
        if (single && willOpen) {
          Array.prototype.forEach.call(items, function (other) {
            if (other !== item) setOpen(other, false);
          });
        }
        setOpen(item, willOpen);
      });

      list.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var q = e.target.closest('.faq_question');
        if (!q || !list.contains(q)) return;
        e.preventDefault();
        q.click();
      });
    });
  };

  Object.keys(features).forEach(function (name) {
    try {
      features[name]();
    } catch (err) {
      console.warn('[appen] feature "' + name + '" failed:', err);
    }
  });
})();
