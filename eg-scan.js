/* Establish Growth — Brand Health Check (free brand audit)
   1. Visitor picks what to check (website, socials, Google profile)
   2. Links for what they picked
   3. One question per screen, adapted to their picks
   4. Business, name, email → website scan on phone + desktop (Google PageSpeed) → report + PDF
   Lead goes to Zoho CRM. Sample mode: open the page with #demo.
   Story, product, offers and reviews are answered by the visitor for now; the AI reader replaces these later. */
{
  // Optional: a free Google API key (restricted to establishgrowth.com) raises the daily scan limit.
  const PSI_KEY = '';
  // Booking link for the Brand Strategy Session (e.g. Calendly). Empty = contact form.
  const BOOKING_LINK = '';
  const PSI_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const DEMO = location.hash === '#demo';
  const BOOK = BOOKING_LINK || 'index.html#contact';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const r1 = n => Math.round(n * 10) / 10;
  const avg = xs => { const v = xs.filter(x => x != null && !isNaN(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };

  // ---------- Channels ----------
  const ICON = {
    website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.6"/>',
    facebook: '<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14 14.6c.8-.4 1.6-.6 2.5-.6 2.2 0 3.8 1.5 4.2 4"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10 9.2v5.6l4.8-2.8z"/>',
    tiktok: '<path d="M9 18.5a3 3 0 1 1 0-6"/><path d="M12 3v15.5M12 3c.4 2.6 2.3 4.4 5 4.6"/>',
    linkedin: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>',
    google: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'
  };
  const CHANNELS = [
    { k: 'website', label: 'Website', ph: 'yourbusiness.com' },
    { k: 'instagram', label: 'Instagram', ph: '@yourbusiness', social: true },
    { k: 'facebook', label: 'Facebook', ph: 'Page name or link', social: true },
    { k: 'google', label: 'Google profile', ph: 'Business name as it shows on Google' },
    { k: 'youtube', label: 'YouTube', ph: 'Channel name or link', social: true },
    { k: 'tiktok', label: 'TikTok', ph: '@yourbusiness', social: true },
    { k: 'linkedin', label: 'LinkedIn', ph: 'Company page link', social: true }
  ];
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

  // ---------- State ----------
  const st = { picked: new Set(), links: {}, answers: {}, goal: '', company: '', name: '', email: '' };
  const has = k => st.picked.has(k);
  const socials = () => CHANNELS.filter(c => c.social && has(c.k));
  const where = () => has('website') ? 'website' : 'profiles';

  const STORY_CH = [['who', 'Who started it'], ['why', 'Why it started'], ['when', 'When it started'], ['moments', 'Big moments and milestones'], ['craft', 'What makes your product or craft different']];
  const OFFERS = [['quote', 'A free quote or consultation'], ['promo', 'A special offer or promotion'], ['guarantee', 'A guarantee or warranty'], ['guide', 'Something free to download or learn from']];

  // Questions, each shown only when it applies
  const QUESTIONS = [
    { k: 'logo', when: () => st.picked.size >= 2, q: () => 'Is your logo the same on every channel you picked?', o: [['yes', 'Yes, everywhere'], ['some', 'Mostly'], ['no', 'No, it varies']] },
    { k: 'connect', when: () => st.picked.size >= 2, q: () => 'Do your website and channels link to each other?', o: [['yes', 'Yes, all of them'], ['some', 'Some do'], ['no', 'Not really']] },
    { k: 'story', multi: STORY_CH, when: () => true, q: () => has('website') ? 'Which parts of your story does your website tell?' : 'Which parts of your story do your profiles tell?', hint: 'Tap all that apply. None is fine too.' },
    { k: 'product', when: () => true, q: () => 'How well is your product or service shown?', o: [['yes', 'Real photos and video of our work'], ['some', 'Some photos'], ['no', 'Mostly text or stock images']] },
    { k: 'price', when: () => has('website'), q: () => 'Can visitors see your services and prices (or starting prices)?', o: [['yes', 'Yes, clearly'], ['some', 'Some of it'], ['no', 'No']] },
    { k: 'next', when: () => has('website'), q: () => 'How easy is it to get a quote, book or buy from your site?', o: [['yes', 'Very easy'], ['some', 'It takes some digging'], ['no', 'Hard, or not possible']] },
    { k: 'offers', multi: OFFERS, when: () => true, q: () => 'What do you offer to get people in touch?', hint: 'Tap all that apply. None is fine too.' },
    { k: 'reviews', when: () => true, q: () => 'About how many Google reviews do you have?', o: [['50', '50 or more'], ['10', '10 to 49'], ['1', '1 to 9'], ['0', 'None yet'], ['unsure', 'Not sure']] },
    { k: 'testimonials', when: () => has('website'), q: () => 'Are reviews or testimonials shown on your website?', o: [['yes', 'Yes, with names or faces'], ['some', 'A few, without names'], ['no', 'No']] },
    { k: 'photos', when: () => true, q: () => 'Do you have real photos or video of your team and business (not stock)?', o: [['yes', 'Plenty'], ['some', 'Some'], ['no', 'Not really']] },
    { k: 'posting', when: () => socials().length > 0, q: () => 'When did you last post on social media?', o: [['week', 'This week'], ['month', 'This month'], ['months', '1–6 months ago'], ['old', '6+ months ago']] },
    { k: 'goal', when: () => true, q: () => 'What matters most right now?', o: [['More leads and inquiries', 'More leads'], ['Looking more professional', 'Look more professional'], ['A consistent brand everywhere', 'One consistent brand'], ['Better content and social media', 'Better content'], ['Launching something new', 'Launching something new']], goal: true }
  ];

  // ---------- Wizard ----------
  const card = $('#wiz');
  const stage = $('#wiz-stage');
  const bar = $('#wiz-bar i');
  const count = $('#wiz-count');
  const back = $('#wiz-back');
  const errBox = $('#scan-error');
  let screens = [];
  let idx = 0;

  function buildScreens() {
    screens = ['channels', 'links'];
    QUESTIONS.forEach(q => { if (q.when()) screens.push(q); });
    screens.push('you');
  }
  function err(msg, f) { errBox.textContent = msg; errBox.hidden = false; if (f) f.focus(); }
  function clearErr() { errBox.hidden = true; }

  function show(i, dir = 1) {
    clearErr();
    idx = i;
    const s = screens[i];
    const total = screens.length;
    bar.style.width = ((i + 1) / total * 100) + '%';
    count.textContent = i === 0 ? "Let's start" : `${i + 1} of ${total}`;
    back.style.visibility = i === 0 ? 'hidden' : 'visible';
    stage.classList.remove('in-l', 'in-r');
    void stage.offsetWidth;
    stage.classList.add(dir > 0 ? 'in-r' : 'in-l');

    if (s === 'channels') {
      stage.innerHTML = `
        <h2 class="wz-q">What should we check?</h2>
        <p class="wz-hint">Pick everything you'd like assessed. You can choose just one.</p>
        <div class="tiles" role="group" aria-label="Channels to check">
          ${CHANNELS.map(c => `<button type="button" class="tile" data-k="${c.k}" aria-pressed="${has(c.k)}">${svg(c.k)}<span>${c.label}</span><i class="tick" aria-hidden="true">✓</i></button>`).join('')}
        </div>
        <button type="button" class="btn btn-copper wz-go" id="wz-next">Continue</button>`;
      $$('.tile', stage).forEach(t => t.addEventListener('click', () => {
        const k = t.dataset.k;
        if (st.picked.has(k)) st.picked.delete(k); else st.picked.add(k);
        t.setAttribute('aria-pressed', st.picked.has(k));
      }));
      $('#wz-next').addEventListener('click', () => {
        if (!st.picked.size) return err('Pick at least one thing to check.');
        buildScreens();
        show(1);
      });
    } else if (s === 'links') {
      const picked = CHANNELS.filter(c => has(c.k));
      stage.innerHTML = `
        <h2 class="wz-q">Where can we find you?</h2>
        <p class="wz-hint">${has('website') ? 'Your website is required. The others help us look closer.' : 'Add what you can. Handles or links both work.'}</p>
        <div class="wz-links">
          ${picked.map(c => `<label class="wz-link">${svg(c.k)}<span class="wz-link-l">${c.label}${c.k === 'website' ? ' *' : ''}</span><input type="text" data-k="${c.k}" value="${esc(st.links[c.k] || '')}" placeholder="${esc(c.ph)}" ${c.k === 'website' ? 'inputmode="url" autocomplete="url"' : ''}></label>`).join('')}
        </div>
        <button type="button" class="btn btn-copper wz-go" id="wz-next">Continue</button>`;
      const first = $('input', stage); if (first && matchMedia('(min-width: 760px)').matches) first.focus();
      $('#wz-next').addEventListener('click', () => {
        $$('input', stage).forEach(inp => st.links[inp.dataset.k] = inp.value.trim());
        if (has('website') && !normUrl(st.links.website)) return err('Please enter your website, like yourbusiness.com', $('input[data-k="website"]', stage));
        show(2);
      });
      $$('input', stage).forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#wz-next').click(); } }));
    } else if (s === 'you') {
      stage.innerHTML = `
        <h2 class="wz-q">Last step: who's it for?</h2>
        <p class="wz-hint">Your Brand Health Check appears right here, and you can download it as a PDF.</p>
        <div class="fg"><label for="s-company">Business name *</label><input id="s-company" type="text" autocomplete="organization" value="${esc(st.company)}"></div>
        <div class="frow">
          <div class="fg"><label for="s-name">Your name *</label><input id="s-name" type="text" autocomplete="name" value="${esc(st.name)}"></div>
          <div class="fg"><label for="s-email">Email *</label><input id="s-email" type="email" autocomplete="email" value="${esc(st.email)}"></div>
        </div>
        <button type="button" class="btn btn-copper wz-go" id="wz-run">Run my Brand Health Check</button>
        <p class="form-fine">Free. We'll only use your email to follow up about your results.</p>`;
      $('#wz-run').addEventListener('click', () => {
        const c = $('#s-company'), n = $('#s-name'), e = $('#s-email');
        st.company = c.value.trim(); st.name = n.value.trim(); st.email = e.value.trim();
        if (!st.company) return err('Please add your business name.', c);
        if (!st.name) return err('Please add your name.', n);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.email)) return err('Please enter a valid email address.', e);
        run();
      });
    } else if (s.multi) {
      const cur = st.answers[s.k] || [];
      stage.innerHTML = `
        <h2 class="wz-q">${esc(s.q())}</h2>
        <p class="wz-hint">${esc(s.hint)}</p>
        <div class="answers">
          ${s.multi.map(([v, l]) => `<button type="button" class="answer multi" data-v="${v}" aria-pressed="${cur.includes(v)}">${esc(l)}<i class="box" aria-hidden="true">✓</i></button>`).join('')}
        </div>
        <button type="button" class="btn btn-copper wz-go" id="wz-next" style="margin-top:16px">Continue</button>`;
      $$('.answer', stage).forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')));
      $('#wz-next').addEventListener('click', () => {
        st.answers[s.k] = $$('.answer', stage).filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.v);
        show(idx + 1);
      });
    } else {
      const cur = s.goal ? st.goal : st.answers[s.k];
      stage.innerHTML = `
        <h2 class="wz-q">${esc(s.q())}</h2>
        <p class="wz-hint">${s.goal ? 'Pick one, or skip.' : 'Your best guess is fine.'}</p>
        <div class="answers">
          ${s.o.map(([v, l]) => `<button type="button" class="answer" data-v="${esc(v)}" aria-pressed="${cur === v}">${esc(l)}<span aria-hidden="true">→</span></button>`).join('')}
        </div>
        ${s.goal ? '<button type="button" class="wz-skip" id="wz-skip">Skip</button>' : ''}`;
      $$('.answer', stage).forEach(b => b.addEventListener('click', () => {
        $$('.answer', stage).forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        if (s.goal) st.goal = b.dataset.v; else st.answers[s.k] = b.dataset.v;
        setTimeout(() => show(idx + 1), 260);
      }));
      const sk = $('#wz-skip', stage); if (sk) sk.addEventListener('click', () => { st.goal = ''; show(idx + 1); });
    }
  }
  back.addEventListener('click', () => { if (idx > 0) show(idx - 1, -1); });

  function normUrl(v) {
    v = (v || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try { const u = new URL(v); if (!u.hostname.includes('.')) return ''; return u.href; } catch (e) { return ''; }
  }

  // ---------- Scoring ----------
  const SC = { yes: 10, some: 5, no: 1, unsure: 3, week: 10, month: 7, months: 4, old: 2, '50': 10, '10': 7, '1': 4, '0': 1 };
  const audit = (lh, id) => lh && lh.audits && lh.audits[id] ? lh.audits[id] : null;
  const pass = (lh, id) => { const a = audit(lh, id); return a && a.score !== null && a.score !== undefined ? a.score >= 0.9 : null; };
  const cat = (lh, id) => { const c = lh && lh.categories && lh.categories[id]; return c && typeof c.score === 'number' ? c.score : null; };

  function siteScore(lh, phone) {
    if (!lh) return null;
    let v = avg([cat(lh, 'performance'), cat(lh, 'seo'), cat(lh, 'best-practices'), cat(lh, 'accessibility')]);
    if (v == null) return null;
    v *= 10;
    if (phone && pass(lh, 'viewport') === false) v = Math.min(v, 2);
    if (pass(lh, 'is-on-https') === false) v = Math.min(v, 3);
    return r1(clamp(v, 1, 10));
  }

  function buildReport(input, phoneLH, deskLH) {
    const a = input.answers;
    const A = k => a[k] != null && !Array.isArray(a[k]) ? SC[a[k]] : null;
    const scanned = !!(phoneLH || deskLH);
    const lh = phoneLH || deskLH;
    const phone = siteScore(phoneLH, true), desk = siteScore(deskLH, false);
    const website = phone != null && desk != null ? r1(phone * 0.6 + desk * 0.4) : (phone != null ? phone : desk);
    const lcpA = audit(phoneLH, 'largest-contentful-paint');
    const lcp = lcpA && lcpA.numericValue ? lcpA.numericValue / 1000 : null;
    const perf = cat(phoneLH, 'performance'), seo = cat(lh, 'seo');
    const https = pass(lh, 'is-on-https'), viewport = pass(phoneLH, 'viewport');

    const story = a.story || [];
    const storyScore = a.story ? clamp(story.length * 2, 1, 10) : null;
    const offers = a.offers || [];
    const offerScore = a.offers ? [1, 5, 7.5, 10, 10][Math.min(offers.length, 4)] : null;

    const branding = r1(avg([A('logo'), A('connect'), storyScore, A('photos')]));
    const marketing = r1(avg([A('product'), A('price'), A('next'), offerScore, A('reviews'), A('testimonials'), A('posting')]));
    const overall = r1(avg([website, branding, marketing]) || 0);

    // Opportunities: title, why, tag, weight, how (do it yourself)
    const O = [], W = [];
    const opp = (title, why, tag, weight, how) => O.push({ title, why, tag, weight, how });
    const win = (title, why) => W.push({ title, why });

    if (scanned) {
      if (lcp != null) {
        if (lcp <= 2.5) win('Fast on phones', `Your main content shows in about ${lcp.toFixed(1)} seconds on a phone.`);
        else opp('Make your site faster on phones', `Your main content takes about ${lcp.toFixed(1)} seconds to show on a phone. Every second you save keeps more visitors.`, 'More leads', lcp > 4 ? 8 : 5, 'Compress and resize homepage images (WebP), and trim heavy sliders, scripts and autoplay video.');
      }
      if (https === false) opp('Make your site secure', 'Browsers can label your site "Not secure", which makes people hesitate to call or fill in a form.', 'More trust', 10, 'Turn on HTTPS (most hosts do it free) and send every page to the secure version.');
      else if (https === true) win('Secure website', 'Your site loads securely, so browsers trust it.');
      if (viewport === false) opp('Fit your site to phones', 'Your site isn\'t built for phone screens, so it shows tiny and zoomed out.', 'More leads', 9, 'Use a mobile-friendly layout; most of your visitors are on a phone.');
      if (pass(lh, 'meta-description') === false) opp('Add a search description', 'Google has no summary to show under your name, so it guesses one.', 'More visibility', 4, 'Write one sentence: what you do, who for, and where. Add it as your homepage description.');
      if (pass(lh, 'document-title') === false) opp('Add a proper page title', 'Your homepage has no clear title for Google or browser tabs.', 'More visibility', 5, 'Title it with your business name and what you do.');
      if (pass(lh, 'image-alt') === false) opp('Describe your images', 'Some images have no text description, which hurts search and accessibility.', 'More visibility', 3, 'Add a short description (alt text) to each image.');
      if (seo != null && seo >= 0.9) win('Search basics in place', 'Google can read and index your homepage properly.');
    }
    if (a.logo === 'yes') win('One logo everywhere', 'Your logo matches across your channels.');
    else if (a.logo) opp('Use one look everywhere', 'Different or older logos make an established business look smaller than it is.', 'More trust', a.logo === 'no' ? 7 : 4, 'Pick your current logo, one profile image and one short bio, and update every channel the same day.');
    if (a.connect === 'yes') win('Connected channels', 'Your website and channels point to each other.');
    else if (a.connect) opp('Connect your channels', 'When your website and profiles don\'t link to each other, people lose the trail.', 'More reach', a.connect === 'no' ? 5 : 3, 'Link every social profile to your website, and add social icons in your website\'s footer.');
    if (a.story) {
      if (story.length >= 4) win('Your story is told', `You tell ${story.length} of the 5 story chapters.`);
      else opp('Tell your story', `You tell ${story.length} of 5 story chapters. Your story is the one thing a competitor can't copy.`, 'Better prices', story.length <= 1 ? 8 : 6, 'Write down who started it, when, why, the big moments, and what makes you different. Put a short version on your homepage.');
    }
    if (a.product === 'yes') win('Your work is on show', 'People can see real photos and video of what you do.');
    else if (a.product) opp('Show what you do', 'People buy what they can see. Text and stock images make great work look ordinary.', 'More leads', a.product === 'no' ? 8 : 5, 'Photograph your real work, process and finished results. Lead each service with its best photo.');
    if (a.price === 'yes') win('Clear services and pricing', 'Visitors can see what you offer and roughly what it costs.');
    else if (a.price) opp('Show your prices (or starting prices)', 'When people can\'t see a price, many assume it\'s too expensive and leave without asking.', 'More leads', a.price === 'no' ? 7 : 4, 'List each service with a starting price or a price range.');
    if (a.next === 'yes') win('Easy to buy or book', 'Visitors can quickly get a quote, book or buy.');
    else if (a.next) opp('Make it easy to say yes', 'Interested visitors don\'t see an easy way to get a quote, book or buy.', 'More leads', a.next === 'no' ? 9 : 6, 'One clear button (Get a quote / Book / Buy) at the top of every page, with a short form.');
    if (a.offers) {
      if (offers.length >= 2) win('Reasons to reach out', 'You give people a clear reason to get in touch.');
      else opp('Give people a reason to reach out', 'An offer or something free (a quote, a guide, a consultation) turns browsers into conversations.', 'More leads', offers.length ? 4 : 6, 'Add one simple offer, like a free quote or a short guide, and put it near the top of your site and in your bios.');
    }
    const rv = a.reviews;
    if (rv === '50' || rv === '10') {
      if (a.testimonials === 'yes' || !has('website')) win('Strong reviews', 'Customers are vouching for you publicly.');
      else opp('Show off your reviews', 'You have real reviews on Google, but visitors to your website don\'t see them.', 'More trust', 6, 'Add 3–5 of your best reviews to your homepage, with names (and photos if you can).');
    } else if (rv) {
      opp('Collect more reviews', 'Reviews are the first thing many people check before they call.', 'More trust', rv === '0' ? 8 : 6, 'Ask every happy customer the same day, with a direct link to your Google review page.');
    }
    if (a.photos === 'yes') win('Real photos and video', 'You show your real team and business.');
    else if (a.photos) opp('Use real photos and video', 'Stock images make a business feel generic. Real ones build trust.', 'More trust', a.photos === 'no' ? 6 : 3, 'One planned shoot can cover your website, Google profile and months of posts.');
    if (a.posting === 'week' || a.posting === 'month') win('Active on social', 'You\'ve posted recently, so your channels look alive.');
    else if (a.posting) opp('Post consistently', 'An old last post makes people wonder if you\'re still open.', 'More reach', a.posting === 'old' ? 6 : 4, 'Two or three posts a week, planned a month at a time from a library of real content.');

    O.sort((x, y) => y.weight - x.weight);

    // Website rebuild flag
    const rebuild = scanned && ((website != null && website < 4) || viewport === false || https === false || (lcp != null && lcp > 6));

    // Video ideas (only what fits their gaps), best first
    const V = [];
    const idea = (score, title, imagine, how) => V.push({ score, title, imagine, how });
    if (a.story) idea(10 - storyScore, 'Your Story, on film', 'Imagine someone finding you for the first time and, in 60 seconds, knowing who started it, why, and why you\'re different.', 'Write down why you started, film it somewhere that shows your work, keep it under 90 seconds, and put it at the top of your homepage and Google profile.');
    if (a.product && a.product !== 'yes') idea(a.product === 'no' ? 9 : 6, 'A product and process shoot', 'Imagine every service on your site led by a photo or short clip of the real thing, made by your real team.', 'Shoot the work in progress and the finished result in good light. Lead each service and post with the best shot.');
    if (rv && (rv === '0' || rv === '1' || a.testimonials !== 'yes')) idea(rv === '0' ? 8 : 6, 'Customer testimonial videos', 'Imagine your best customers telling the next one, in their own words, why they chose you.', 'Ask two or three happy customers for 10 minutes. Ask what problem they had, why they chose you, and what changed.');
    if (scanned && website != null && website < 6) idea(7, 'A hero film for your homepage', 'Imagine your homepage opening on a short, beautiful film of your business at its best, instead of a slider.', 'Film 20–30 seconds of your best moments, no talking needed, and use it as the background at the top of your homepage.');
    if (a.posting && a.posting !== 'week') idea(a.posting === 'old' ? 7 : 5, 'A social content library', 'Imagine months of posts planned and ready: reels, photos and stories, all on brand.', 'Plan one shoot day around your services, team and customers, then schedule two or three posts a week from it.');
    if (a.offers && offers.length < 2) idea(5, 'Offer-led marketing ads', 'Imagine short ads that show your work and give people one clear reason to get in touch today.', 'Pick one offer (a free quote or consultation), film 15–30 second clips around it, and run them where your customers scroll.');
    V.sort((x, y) => y.score - x.score);

    let verdict;
    if (overall >= 8) verdict = 'A strong brand online. A few refinements will make it stand out even more.';
    else if (overall >= 6) verdict = 'A solid base with real room to grow. A few changes would make a big difference.';
    else if (overall >= 4) verdict = 'A real business that looks smaller online than it is. That\'s good news: it\'s very fixable.';
    else verdict = 'A brand with a lot of untapped potential. The foundation is the place to start.';

    return {
      input, scanned, wantedSite: !!input.url, overall, verdict,
      website, phone, desk, branding, marketing, lcp, perf, seo,
      storyTold: story, offers, opps: O, wins: W, ideas: V.slice(0, 3), rebuild,
      shot: (audit(phoneLH, 'final-screenshot') || {}).details ? audit(phoneLH, 'final-screenshot').details.data : null,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  }

  // ---------- Render report ----------
  const reportSec = $('#report');
  const reportEl = $('#report-body');
  const lock = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function render(R) {
    const a = R.input.answers;
    const title = (() => { if (!R.input.url) return R.input.company; try { return new URL(R.input.url).hostname.replace(/^www\./, ''); } catch (e) { return R.input.url; } })();
    const tile = (label, v, note) => `<div class="rp-tile"><span>${label}</span><b>${v != null ? v.toFixed(1) : '—'}</b><small>${note || (v != null ? 'out of 10' : 'not checked')}</small><i style="width:${v != null ? v * 10 : 0}%"></i></div>`;
    const reviewTxt = { '50': '50 or more Google reviews', '10': '10–49 Google reviews', '1': '1–9 Google reviews', '0': 'No Google reviews yet', unsure: 'Not sure how many Google reviews' }[a.reviews] || '';
    const testiTxt = { yes: 'Shown on your website, with names or faces', some: 'A few on your website, without names', no: 'Not shown on your website' }[a.testimonials] || '';
    const productTxt = { yes: 'Real photos and video of your work', some: 'Some photos of your work', no: 'Mostly text or stock images' }[a.product] || '';
    const priceTxt = { yes: 'Services and prices are clear', some: 'Some services or prices are shown', no: 'No prices or starting prices shown' }[a.price] || '';
    const linkTxt = { yes: 'All your channels link to each other', some: 'Some of your channels link to each other', no: 'Your channels don\'t link to each other' }[a.connect] || '';
    let note = '';
    if (R.wantedSite && !R.scanned) note = `<p class="rp-note">We couldn't scan your website automatically (some sites block scanners). Elliot will review it by hand and follow up.</p>`;
    else if (!R.wantedSite) note = `<p class="rp-note">You chose not to include a website, so this check covers your channels and brand.</p>`;

    reportEl.innerHTML = `
      <div class="rp-page">
        <div class="rp-top"><span>Brand Health Check${DEMO ? ' · Sample' : ''}</span><span>${esc(R.date)}</span></div>
        <div class="rp-head">
          <div>
            <p class="rp-for">Prepared for ${esc(R.input.company)}</p>
            <h2 class="rp-h">Your brand online<span>${esc(title)}</span></h2>
            <p class="rp-verdict">${esc(R.verdict)}</p>
          </div>
          <div class="rp-dial">
            <svg viewBox="0 0 130 130"><circle cx="65" cy="65" r="54" fill="none" stroke="#E2DACE" stroke-width="10"/><circle cx="65" cy="65" r="54" fill="none" stroke="#A0622E" stroke-width="10" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 54}" stroke-dashoffset="${2 * Math.PI * 54 * (1 - R.overall / 10)}" transform="rotate(-90 65 65)"/></svg>
            <div><b>${R.overall.toFixed(1)}</b><small>out of 10</small></div>
          </div>
        </div>
        <div class="rp-tiles">
          ${tile('Website', R.website)}
          ${tile('Branding', R.branding)}
          ${tile('Marketing', R.marketing)}
          <div class="rp-tile locked"><span>Systems</span>${lock}<small>In your Full Strategy Report</small></div>
        </div>
        <div class="rp-grid">
          <div>
            <p class="rp-label">Your website</p>
            ${R.scanned ? `<div class="rp-site">
              <div><b>${R.phone != null ? R.phone.toFixed(1) : '—'}</b><span>On a phone</span></div>
              <div><b>${R.desk != null ? R.desk.toFixed(1) : '—'}</b><span>On a desktop</span></div>
              <div class="all"><b>${R.website != null ? R.website.toFixed(1) : '—'}</b><span>Website overall</span></div>
            </div>
            <div class="rp-stats">
              <div><b>${R.lcp != null ? R.lcp.toFixed(1) + 's' : '—'}</b><span>Load time on a phone</span></div>
              <div><b>${R.perf != null ? Math.round(R.perf * 100) : '—'}</b><span>Google speed score</span></div>
              <div><b>${R.seo != null ? Math.round(R.seo * 100) : '—'}</b><span>Google search score</span></div>
            </div>` : note}
            <p class="rp-label" style="margin-top:24px">How your channels connect</p>
            <div class="rp-chips">${R.input.links.map(l => `<span class="has">${esc(l.label)}</span>`).join('')}</div>
            ${linkTxt ? `<p class="rp-small">${esc(linkTxt)}.</p>` : ''}
          </div>
          ${R.shot ? `<div class="rp-phone"><p class="rp-label">What visitors see on a phone</p><div class="rp-phone-frame"><img src="${esc(R.shot)}" alt="Your homepage on a phone"></div></div>` : ''}
        </div>
      </div>

      <div class="rp-page">
        <div class="rp-top"><span>Your brand today</span><span>${esc(R.input.company)}</span></div>
        <h2 class="rp-h">Your brand today<span>What's working, and what you're telling people</span></h2>
        <p class="rp-label">What's working</p>
        <ul class="rp-list ok">${R.wins.slice(0, 5).map(w => `<li><b>${esc(w.title)}.</b> ${esc(w.why)}</li>`).join('') || '<li>Every brand has strengths. We\'ll find yours in the Full Strategy Report.</li>'}</ul>
        <div class="rp-three">
          <div class="rp-box">
            <p class="rp-label">Your story</p>
            <p class="rp-big">${R.storyTold.length} of 5</p>
            <ul class="rp-check">${STORY_CH.map(([k, l]) => `<li class="${R.storyTold.includes(k) ? 'y' : 'n'}">${esc(l)}</li>`).join('')}</ul>
          </div>
          <div class="rp-box">
            <p class="rp-label">Your product or service</p>
            <ul class="rp-check">
              ${productTxt ? `<li class="${a.product === 'yes' ? 'y' : 'n'}">${esc(productTxt)}</li>` : ''}
              ${priceTxt ? `<li class="${a.price === 'yes' ? 'y' : 'n'}">${esc(priceTxt)}</li>` : ''}
              ${OFFERS.map(([k, l]) => `<li class="${R.offers.includes(k) ? 'y' : 'n'}">${esc(l)}</li>`).join('')}
            </ul>
          </div>
          <div class="rp-box">
            <p class="rp-label">Reviews and testimonials</p>
            ${reviewTxt ? `<p class="rp-big">${esc(reviewTxt.split(' ')[0] === 'No' ? '0' : reviewTxt.split(' ')[0])}</p><p class="rp-small">${esc(reviewTxt)}</p>` : ''}
            ${testiTxt ? `<ul class="rp-check"><li class="${a.testimonials === 'yes' ? 'y' : 'n'}">${esc(testiTxt)}</li></ul>` : ''}
          </div>
        </div>
        <div class="rp-foot"><span>Prepared by Establish Growth · establishgrowth.com</span><span>Based on a live website scan and your answers.</span></div>
      </div>

      <div class="rp-page">
        <div class="rp-top"><span>Opportunities</span><span>${esc(R.input.company)}</span></div>
        <h2 class="rp-h">Your biggest opportunities<span>Where small changes make a big difference</span></h2>
        <div class="rp-fixes">
          ${R.opps.slice(0, 3).map((o, i) => `<div class="rp-fix"><span class="rp-n">0${i + 1}</span><div><h3>${esc(o.title)} <em class="opp">Opportunity: ${esc(o.tag.toLowerCase())}</em></h3><p>${esc(o.why)}</p><p class="rp-how"><b>How to do it:</b> ${esc(o.how)}</p></div></div>`).join('') || '<p class="rp-verdict">No big gaps found. Your brand is in great shape.</p>'}
        </div>
        ${R.rebuild ? `<div class="rp-rebuild"><p class="rp-label">To do: new website development</p><h3>Your website is holding back a great business.</h3><p>Small fixes won't close the gap. A rebuild would. Book a Brand Strategy Session to talk through how to put this in place, and your options for a website redesign, rebuild, update or hosting.</p></div>` : ''}
        ${R.opps.length > 3 ? `<p class="rp-label" style="margin-top:22px">More to look at</p><ul class="rp-list gap">${R.opps.slice(3, 7).map(o => `<li><b>${esc(o.title)}.</b> ${esc(o.how)}</li>`).join('')}</ul>` : ''}
      </div>

      <div class="rp-page">
        <div class="rp-top"><span>Where your brand could go next</span><span>${esc(R.input.company)}</span></div>
        <h2 class="rp-h">Where your brand could go next<span>Content that would make your brand stand out</span></h2>
        <div class="rp-ideas">
          ${R.ideas.map(v => `<div class="rp-idea"><h3>${esc(v.title)}</h3><p class="rp-imagine">${esc(v.imagine)}</p><p class="rp-how"><b>How to do it:</b> ${esc(v.how)}</p><p class="rp-quiet">This is what we make at Establish Growth, if you'd like it done for you.</p></div>`).join('')}
        </div>
        <div class="rp-locked">
          ${lock}
          <div><p class="rp-label">Systems review · included in your Full Strategy Report</p><p>One of our team goes through your whole system as a real customer: finding your services and prices, your forms and checkout, how fast you reply to emails and messages, and how easy it all is. Then we show you exactly where interested customers slip away.</p></div>
        </div>
        <div class="rp-steps">
          <div><b>1</b><span>Brand Health Check</span><small>Done</small></div>
          <div class="on"><b>2</b><span>Full Strategy Report</span><small>$89.99 · your brand, competition and systems</small></div>
          <div><b>3</b><span>Brand Strategy Session</span><small>Your Game Plan</small></div>
        </div>
        <div class="rp-foot"><span>Prepared by Establish Growth · establishgrowth.com</span><span>Decisions made. Time to build.</span></div>
      </div>

      <div class="rp-cta no-print">
        <div>
          <p class="eyebrow">Want the whole picture?</p>
          <h3>Here's what a deeper look would show you.</h3>
          <p>The Full Strategy Report looks into your brand, your competition and your systems, with a real-customer test of your contact and checkout. $89.99, delivered in 3–5 business days.</p>
        </div>
        <div class="rp-cta-btns">
          <a class="btn btn-copper" href="brand-strategy-report.html">See the Full Strategy Report</a>
          <a class="btn btn-ghost" href="${esc(BOOK)}">Book a Brand Strategy Session</a>
          <button class="btn btn-ghost" type="button" id="rp-pdf">Download PDF</button>
        </div>
      </div>`;
    reportSec.hidden = false;
    document.body.classList.add('has-report');
    $('#rp-pdf').addEventListener('click', () => { try { window.print(); } catch (e) { /* print blocked */ } });
    setTimeout(() => reportSec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  // ---------- Lead to Zoho ----------
  function sendLead(R) {
    if (DEMO) return;
    const lf = $('#lead-form');
    const parts = R.input.name.trim().split(/\s+/);
    lf.elements['Last Name'].value = parts.length > 1 ? parts.pop() : parts[0];
    lf.elements['First Name'].value = parts.join(' ');
    lf.elements['Company'].value = R.input.company;
    lf.elements['Email'].value = R.input.email;
    const f = v => v != null ? v + '/10' : 'n/a';
    lf.elements['Description'].value = [
      '[Brand Health Check — free]',
      `Overall ${R.overall}/10 · Website ${f(R.website)} (phone ${f(R.phone)}, desktop ${f(R.desk)}) · Branding ${f(R.branding)} · Marketing ${f(R.marketing)}`,
      R.wantedSite && !R.scanned ? 'Website scan failed: review by hand.' : '',
      R.rebuild ? 'FLAG: website rebuild recommended.' : '',
      'Checked: ' + R.input.links.map(l => l.label).join(', '),
      ...R.input.links.filter(l => l.value).map(l => `${l.label}: ${l.value}`),
      '', 'Top opportunities:', ...R.opps.slice(0, 3).map((o, i) => `${i + 1}. ${o.title}`),
      'Video ideas: ' + R.ideas.map(v => v.title).join(', '),
      '', 'Answers:', ...Object.entries(R.input.answers).map(([k, v]) => `${k}: ${Array.isArray(v) ? (v.join(', ') || 'none') : v}`),
      R.input.goal ? `Goal: ${R.input.goal}` : ''
    ].filter(x => x !== '').join('\n');
    fetch('https://crm.zoho.com/crm/WebToLeadForm', { method: 'POST', body: new FormData(lf), cache: 'no-cache' }).catch(() => {});
  }

  // ---------- Website scan (phone + desktop) ----------
  function psi(url, strategy) {
    const q = new URLSearchParams({ url, strategy });
    ['performance', 'seo', 'best-practices', 'accessibility'].forEach(c => q.append('category', c));
    if (PSI_KEY) q.set('key', PSI_KEY);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 80000);
    return fetch(`${PSI_URL}?${q}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && d.lighthouseResult ? d.lighthouseResult : null)
      .catch(() => null)
      .finally(() => clearTimeout(t));
  }
  function scan(url) {
    if (DEMO) return new Promise(res => setTimeout(() => res([window.EG_SAMPLE_LH || null, window.EG_SAMPLE_LH_DESKTOP || null]), 2600));
    if (!url) return new Promise(res => setTimeout(() => res([null, null]), 1800));
    return Promise.all([psi(url, 'mobile'), psi(url, 'desktop')]);
  }

  const loading = $('#scan-loading');
  function runLoading() {
    const items = [];
    if (has('website')) items.push('Visiting your website on a phone', 'Visiting your website on a desktop', 'Checking speed, search basics and security');
    if (socials().length || has('google')) items.push('Looking at how your channels connect');
    items.push('Scoring your branding and marketing', 'Finding your biggest opportunities');
    $('ul', loading).innerHTML = items.map(t => `<li>${esc(t)}</li>`).join('');
    const lis = $$('li', loading);
    let i = 0;
    lis[0].className = 'on';
    return setInterval(() => { if (i < lis.length - 1) { lis[i].className = 'done'; i++; lis[i].className = 'on'; } }, has('website') ? 3600 : 700);
  }

  function run() {
    const input = {
      url: has('website') ? normUrl(st.links.website) : '',
      company: st.company, name: st.name, email: st.email, goal: st.goal,
      answers: JSON.parse(JSON.stringify(st.answers)),
      links: CHANNELS.filter(c => has(c.k)).map(c => ({ label: c.label, value: st.links[c.k] || '' }))
    };
    card.hidden = true;
    loading.hidden = false;
    const timer = runLoading();
    scan(input.url).then(([ph, dk]) => {
      clearInterval(timer);
      const R = buildReport(input, ph, dk);
      loading.hidden = true;
      $('#scan-done').hidden = false;
      render(R);
      sendLead(R);
    });
  }

  $('#scan-again').addEventListener('click', () => {
    $('#scan-done').hidden = true; card.hidden = false;
    reportSec.hidden = true; document.body.classList.remove('has-report');
    show(0, -1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Start
  buildScreens();
  show(0);

  // Sample mode: build the sample report straight away
  if (DEMO) {
    ['website', 'instagram', 'google'].forEach(k => st.picked.add(k));
    st.links = { website: 'northlineoutdoor.com', instagram: '@northlineoutdoor', google: 'Northline Outdoor Co.' };
    st.answers = { logo: 'some', connect: 'some', story: ['when'], product: 'some', price: 'no', next: 'some', offers: ['quote'], reviews: '10', testimonials: 'no', photos: 'some', posting: 'months' };
    st.company = 'Northline Outdoor Co.'; st.name = 'Sample'; st.email = 'sample@example.com';
    $('.demo-flag').hidden = false;
    buildScreens();
    run();
  }
}
