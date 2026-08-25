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

  /* Tabbed content switcher
   *
   * Opt a page in by adding a .tabs_component wrapper holding a .tabs_nav of
   * .tabs_tab triggers and a .tabs_content of .tabs_pane blocks. Tabs pair to
   * panes by document order — the 1st tab shows the 1st pane — so there are no
   * IDs to keep in sync when a pane is added or reordered.
   *
   * Optional attribute on .tabs_component:
   *   data-tabs-default="2"  1-based tab to open on load (default 1)
   *
   * Show/hide lives in styles.css under .tabs_pane.is-active; the active tab's
   * appearance is a Designer combo class, also .is-active. This only toggles
   * the classes, keeps the ARIA state in sync, and adds the arrow-key
   * behaviour a real tablist is expected to have.
   */
  features.tabs = function () {
    var comps = document.querySelectorAll('.tabs_component');
    if (!comps.length) return;

    var uid = 0;

    Array.prototype.forEach.call(comps, function (comp) {
      /* Only this component's own tabs and panes. The closest() check stops a
       * nested switcher from being driven by its parent. */
      function own(sel) {
        return Array.prototype.filter.call(comp.querySelectorAll(sel), function (el) {
          return el.closest('.tabs_component') === comp;
        });
      }

      var tabs = own('.tabs_tab');
      var panes = own('.tabs_pane');
      if (!tabs.length || !panes.length) return;

      /* A mismatch is a build mistake, not a page without the feature — the
       * extra tab or pane would just never respond. Say so rather than
       * failing quietly. */
      if (tabs.length !== panes.length) {
        console.warn('[appen] tabs: ' + tabs.length + ' tabs but ' + panes.length +
          ' panes — the extras are inert', comp);
      }
      var count = Math.min(tabs.length, panes.length);

      var nav = comp.querySelector('.tabs_nav');
      if (nav) nav.setAttribute('role', 'tablist');

      /* Webflow can't output a <button>, so upgrade the trigger divs here. */
      for (var i = 0; i < count; i++) {
        uid += 1;
        if (!tabs[i].id) tabs[i].id = 'tabs-tab-' + uid;
        if (!panes[i].id) panes[i].id = 'tabs-pane-' + uid;
        tabs[i].setAttribute('role', 'tab');
        tabs[i].setAttribute('aria-controls', panes[i].id);
        panes[i].setAttribute('role', 'tabpanel');
        panes[i].setAttribute('aria-labelledby', tabs[i].id);
        /* Focusable so a keyboard user can scroll a long pane. */
        panes[i].setAttribute('tabindex', '0');
      }

      function activate(index, moveFocus) {
        for (var n = 0; n < count; n++) {
          var on = n === index;
          tabs[n].classList.toggle('is-active', on);
          tabs[n].setAttribute('aria-selected', on ? 'true' : 'false');
          /* Roving tabindex: the set is one tab stop, arrows move within it. */
          tabs[n].setAttribute('tabindex', on ? '0' : '-1');
          panes[n].classList.toggle('is-active', on);
        }
        if (moveFocus) tabs[index].focus();
      }

      var def = parseInt(comp.getAttribute('data-tabs-default'), 10);
      activate(def >= 1 && def <= count ? def - 1 : 0, false);

      /* Fail open: styles.css hides panes only under .is-ready, so a stale or
       * broken script leaves all of them stacked and readable rather than
       * emptying the section. Set after the first activate(), never before,
       * or there is a frame with hiding on and no pane marked active. */
      comp.classList.add('is-ready');

      comp.addEventListener('click', function (e) {
        var t = e.target.closest('.tabs_tab');
        var i = t ? tabs.indexOf(t) : -1;
        if (i > -1 && i < count) activate(i, false);
      });

      comp.addEventListener('keydown', function (e) {
        var t = e.target.closest('.tabs_tab');
        var i = t ? tabs.indexOf(t) : -1;
        if (i < 0 || i >= count) return;

        /* Both arrow pairs are wired so the same markup works whether the nav
         * is stacked or laid out in a row. */
        var next;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % count;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + count) % count;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = count - 1;
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(i, false); return; }
        else return;

        e.preventDefault();
        activate(next, true);
      });
    });
  };

  /* UTM capture
   *
   * Persists utm_* parameters from the landing URL and stamps them into the
   * hidden fields of any HubSpot form, however many pages later the visitor
   * converts. Runs on every page — there's nothing to opt in.
   *
   * Needed because CTAs link to bare URLs: a visitor landing on a campaign
   * URL and clicking through to /contact-us arrives with no parameters left,
   * so the values have to be carried in a cookie rather than the querystring.
   *
   * First-touch — an existing cookie is never overwritten, so the campaign
   * that earned the visit is credited, not the last page before the form.
   * Flip FIRST_TOUCH for last-touch.
   *
   * The matching hidden fields must already exist on the HubSpot form; this
   * only fills them.
   */
  features.utmCapture = function () {
    /* URL parameter → HubSpot internal field name. The two differ for click
     * IDs: X arrives as ?twclid= but HubSpot stores it as latest_x_click_id.
     *
     * Google and LinkedIn are deliberately absent. HubSpot owns
     * hs_google_click_id and hs_linkedin_click_id and fills them itself from
     * the native ads integration — they can't be added as form fields, so
     * there is nothing for this to do. Confirmed with marketing 2026-08-24;
     * don't add them here.
     */
    var FIELDS = {
      utm_source: 'utm_source',
      utm_medium: 'utm_medium',
      utm_campaign: 'utm_campaign',
      utm_term: 'utm_term',
      utm_content: 'utm_content',
      twclid: 'latest_x_click_id'
    };
    var PARAMS = Object.keys(FIELDS);
    var PREFIX = 'appen_';
    var DAYS = 90;
    var FIRST_TOUCH = true;

    function read(name) {
      var m = document.cookie.match('(^|;)\\s*' + PREFIX + name + '\\s*=\\s*([^;]+)');
      return m ? decodeURIComponent(m.pop()) : null;
    }

    function write(name, value) {
      var d = new Date();
      d.setTime(d.getTime() + DAYS * 864e5);
      document.cookie = PREFIX + name + '=' + encodeURIComponent(value) +
        ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    var qs = new URLSearchParams(window.location.search);
    PARAMS.forEach(function (p) {
      var v = qs.get(p);
      if (v && !(FIRST_TOUCH && read(p))) write(p, v);
    });

    /* Legacy HubSpot embeds render into a src-less — and therefore same-origin
     * — iframe, so the fields are not in this document; reach into each form's
     * contentDocument. Only hidden inputs are touched, because matching a
     * visible field by name would let a stray ?email= in a URL overwrite what
     * the visitor typed. */
    function fill(doc) {
      PARAMS.forEach(function (p) {
        /* Cookies are keyed on the URL parameter, the selector on the HubSpot
         * field name — the two are not always the same. */
        var v = read(p);
        if (!v) return;
        var field = doc.querySelector('input[type=hidden][name="' + FIELDS[p] + '"]');
        if (field && !field.value) field.value = v;
      });
    }

    function fillAll() {
      fill(document);
      var frames = document.querySelectorAll('iframe.hs-form-iframe');
      Array.prototype.forEach.call(frames, function (frame) {
        try { fill(frame.contentDocument); } catch (err) { /* cross-origin */ }
      });
    }

    /* Both orderings happen: this file loads from the footer, so a form can
     * already be ready when it runs (the immediate pass) or become ready
     * afterwards (the event). Filling twice is harmless — the guard in fill()
     * leaves a populated field alone. */
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'hsFormCallback' && e.data.eventName === 'onFormReady') fillAll();
    });
    fillAll();
  };

  Object.keys(features).forEach(function (name) {
    try {
      features[name]();
    } catch (err) {
      console.warn('[appen] feature "' + name + '" failed:', err);
    }
  });
})();
