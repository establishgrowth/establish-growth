/* Establish Growth — shared script for the Brand Strategy offer pages */
(function () {
  // Nav background on scroll
  var nav = document.querySelector('.o-nav');
  var sticky = document.querySelector('.sticky-cta');
  var formSec = document.getElementById('start') || document.getElementById('scan');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    if (sticky && formSec) {
      var r = formSec.getBoundingClientRect();
      var nearForm = r.top < window.innerHeight && r.bottom > 0;
      sticky.classList.toggle('show', window.scrollY > 600 && !nearForm);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  // Score card: animate dial and bars once
  var card = document.querySelector('.score-card');
  if (card) {
    var ran = false;
    function runScore() {
      if (ran) return; ran = true;
      card.querySelectorAll('.fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      var arc = card.querySelector('.dial-arc');
      var num = card.querySelector('.dial-num b');
      var target = parseFloat(card.dataset.score || '4.6');
      var circ = 2 * Math.PI * 54;
      if (arc) { arc.style.strokeDasharray = circ; arc.style.strokeDashoffset = circ; }
      var start = performance.now();
      (function tick(now) {
        var t = Math.min((now - start) / 1400, 1);
        var e = 1 - Math.pow(1 - t, 3);
        if (num) num.textContent = (target * e).toFixed(1);
        if (arc) arc.style.strokeDashoffset = circ * (1 - (target / 10) * e);
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    }
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) runScore(); }, { threshold: 0.3 }).observe(card);
  }

  // Intake form -> Zoho CRM (Leads). Extra answers are packed into Description.
  var form = document.getElementById('eg-offer-form');
  if (!form) return;
  var offer = form.dataset.offer || 'Website lead';
  var errBox = document.getElementById('eg-form-error');
  var btn = form.querySelector('button[type="submit"]');
  var btnText = btn ? btn.textContent : '';
  var success = document.getElementById('eg-form-success');

  function err(msg, field) { errBox.textContent = msg; errBox.classList.add('show'); if (field) field.focus(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errBox.classList.remove('show');
    var full = form.querySelector('#f-name');
    var company = form.elements['Company'];
    var email = form.elements['Email'];
    var site = form.querySelector('#f-website');
    if (!full.value.trim()) return err('Please add your name.', full);
    if (!company.value.trim()) return err('Please add your business name.', company);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return err('Please enter a valid email address.', email);
    if (site && site.hasAttribute('required') && !site.value.trim()) return err('Please add your website (or your main social page).', site);

    // Split full name into Zoho's First / Last Name
    var parts = full.value.trim().split(/\s+/);
    form.elements['Last Name'].value = parts.length > 1 ? parts.pop() : parts[0];
    form.elements['First Name'].value = parts.length ? parts.join(' ') : '';

    // Build a readable Description from every answer marked data-q
    var lines = ['[' + offer + ']', ''];
    form.querySelectorAll('[data-q]').forEach(function (f) {
      var v = (f.value || '').trim();
      if (v && v !== '-None-') lines.push(f.dataset.q + ': ' + v);
    });
    form.elements['Description'].value = lines.join('\n');

    btn.disabled = true; btn.textContent = 'Sending…';
    fetch('https://crm.zoho.com/crm/WebToLeadForm', { method: 'POST', body: new FormData(form), cache: 'no-cache' })
      .then(function (r) {
        var ct = r.headers.get('Content-Type') || '';
        return ct.indexOf('application/json') > -1 ? r.json() : r.text();
      })
      .then(function (data) {
        if (data && typeof data === 'object' && (data.actionsubmit === 'error_msg' || data.actionsubmit === 'captcha_error')) throw new Error('zoho');
        form.reset();
        form.style.display = 'none';
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () { err('Something went wrong sending your request. Please try again, or email establishgrowthmedia@gmail.com.'); })
      .finally(function () { btn.disabled = false; btn.textContent = btnText; });
  });
})();
