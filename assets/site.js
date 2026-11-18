/* ===================================================================
   Akarat Textile — site behaviour
   =================================================================== */

/* -------------------------------------------------------------------
   1. WHERE ENQUIRIES GO.  Set this one value to take the forms live.
   -------------------------------------------------------------------
   Leave it empty and the forms fall back to opening the visitor's mail
   client with the enquiry pre-filled — slower, but an enquiry is never
   silently swallowed.  Paste a form endpoint here to collect properly:

     Formspree   https://formspree.io/f/xxxxxxxx
     Netlify     leave empty and add  netlify  to the <form> tag instead
     FormSubmit  https://formsubmit.co/your@email.com
   ------------------------------------------------------------------- */
var FORM_ENDPOINT = '';
var FALLBACK_EMAIL = 'info@akarattextile.com';

var PAGE_URL = {
  home: 'index.html',
  about: 'about.html',
  products: 'products.html',
  sustainability: 'sustainability.html',
  certifications: 'certifications.html',
  quality: 'quality.html',
  contact: 'contact.html'
};

/* ── Navigation ───────────────────────────────────────────────────
   Pages are real documents now; navigate() stays so the many
   onclick="navigate('contact')" buttons keep working unchanged. */
function navigate(pageId) {
  var url = PAGE_URL[pageId];
  if (url) window.location.href = url;
}

/* ── Mobile menu ──────────────────────────────────────────────── */
function toggleMobile() {
  var h = document.getElementById('hamburger');
  var m = document.getElementById('mobile-menu');
  if (h) h.classList.toggle('open');
  if (m) m.classList.toggle('open');
}

/* ── Language ─────────────────────────────────────────────────────
   Remembered across pages, because every link is now a real page load. */
var currentLang = 'en';
try { currentLang = localStorage.getItem('akarat-lang') || 'en'; } catch (e) {}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'th' : 'en';
  try { localStorage.setItem('akarat-lang', currentLang); } catch (e) {}
  applyLang();
}

function applyLang() {
  document.body.classList.toggle('lang-th', currentLang === 'th');
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-en]').forEach(function (el) {
    var val = currentLang === 'th' ? (el.dataset.th || el.dataset.en) : el.dataset.en;
    if (!val) return;
    if (val.indexOf('<') > -1 || val.indexOf('&') > -1) el.innerHTML = val;
    else el.textContent = val;
  });
  var btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = currentLang === 'en' ? 'ภาษาไทย' : 'English';
}
if (currentLang === 'th') applyLang();

/* ── Product filters ──────────────────────────────────────────── */
var filterBtns = document.querySelectorAll('.filter-btn');
var prodSections = document.querySelectorAll('.prod-section');
filterBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    var filter = btn.dataset.filter;
    filterBtns.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    prodSections.forEach(function (sec) {
      if (filter === 'all' || sec.dataset.category === filter) {
        sec.style.display = '';
        sec.style.animation = 'fadeUp .25s ease both';
      } else {
        sec.style.display = 'none';
      }
    });
  });
});

/* ── Forms ────────────────────────────────────────────────────────
   Validate, then either POST to FORM_ENDPOINT or hand the enquiry to
   the visitor's mail client. Never show "thank you" for a message
   that went nowhere. */
function fieldLabel(f) {
  // Prefer the visible <label> so the email reads "Full Name:", not "q_name:".
  var lbl = null;
  if (f.id) lbl = f.ownerDocument.querySelector('label[for="' + f.id + '"]');
  if (!lbl) lbl = f.closest('.form-group, .field') &&
                  f.closest('.form-group, .field').querySelector('label');
  if (!lbl) lbl = f.previousElementSibling &&
                  f.previousElementSibling.tagName === 'LABEL' ? f.previousElementSibling : null;
  var text = lbl ? lbl.textContent : (f.name || 'Field');
  return String(text).replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ').trim();
}

function serialise(form) {
  var out = [];
  form.querySelectorAll('input, select, textarea').forEach(function (f) {
    if (f.value && f.value.trim()) out.push(fieldLabel(f) + ': ' + f.value.trim());
  });
  return out;
}

function handleForm(formId, successId, subject) {
  var form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      var bad = !field.value.trim() ||
                (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value));
      field.style.borderColor = bad ? '#e57373' : '';
      if (bad) valid = false;
    });
    if (!valid) {
      var first = form.querySelector('[required][style*="rgb(229"]');
      if (first) first.focus();
      return;
    }

    var done = function () {
      form.style.display = 'none';
      var success = document.getElementById(successId);
      if (success) {
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    if (FORM_ENDPOINT) {
      var btn = form.querySelector('[type="submit"], button:not([type])');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; }
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        done();
      }).catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Send'; }
        alert('Sorry — the message could not be sent (' + err.message +
              ').\nPlease email us directly at ' + FALLBACK_EMAIL + '.');
      });
    } else {
      // No endpoint configured: hand it to the visitor's mail client.
      var body = serialise(form).join('\n');
      window.location.href = 'mailto:' + FALLBACK_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      done();
    }
  });

  form.querySelectorAll('input, select, textarea').forEach(function (field) {
    field.addEventListener('input', function () { field.style.borderColor = ''; });
  });
}

handleForm('form-general', 'form1-success', 'Website enquiry — Akarat Textile');
handleForm('form-quote',   'form2-success', 'Quotation request — Akarat Textile');

/* ── Hero counters ────────────────────────────────────────────── */
function animateCount(el, target, suffix, duration) {
  var start = performance.now();
  (function step(now) {
    var t = Math.min((now - start) / duration, 1);
    var ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    el.textContent = Math.floor(ease * target) + suffix;
    if (t < 1) requestAnimationFrame(step);
  })(start);
}
window.addEventListener('load', function () {
  var years = document.getElementById('stat-years');
  var markets = document.getElementById('stat-markets');
  if (years) animateCount(years, new Date().getFullYear() - 1987, '+', 1400);
  if (markets) animateCount(markets, 5, '+', 1200);   // USA, Japan, Vietnam, Malaysia, UAE
});

/* ── Back to top ──────────────────────────────────────────────── */
var backTop = document.getElementById('back-top');
if (backTop) {
  window.addEventListener('scroll', function () {
    backTop.classList.toggle('show', window.scrollY > 380);
  }, { passive: true });
}

/* ── Footer year ──────────────────────────────────────────────── */
var yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();
