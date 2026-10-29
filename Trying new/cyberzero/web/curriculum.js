// CyberZero — Curriculum Data Layer
// All 22 modules with 4-option MCQ quizzes, real-world incident references, and metadata.

const CURRICULUM = [
  {
    id: 1, phase: 1, phaseLabel: "Digital Airwaves",
    name: "Wi-Fi Packet Intercept", icon: "📡", difficulty: "Beginner",
    tags: ["networking", "encryption", "http", "https"],
    desc: "Learn how unencrypted Wi-Fi traffic exposes your data to anyone nearby.",
    incident: "In 2010, the Firesheep browser extension allowed anyone in a coffee shop to hijack Facebook and Twitter sessions over unencrypted HTTP in seconds.",
    analogy: "Sending data over plain HTTP is like shouting your credit card number across a crowded stadium. Anyone with ears — or a Wi-Fi adapter — can capture it verbatim. HTTPS wraps every packet in a sealed steel lockbox: even if intercepted, the attacker sees only gibberish without your private encryption key.",
    hint: "Click 'Start Packet Capture' to see your airport Wi-Fi traffic. Toggle the 'HTTPS Shield' ON to watch all packet content transform from readable plain text into AES-256 encrypted hex code. Once shielded, answer the quiz.",
    labId: "wifi_intercept",
    quiz: {
      question: "What actually happens to your password when you submit a login form over plain HTTP on public Wi-Fi?",
      options: [
        { text: "It gets encrypted automatically by the browser", explanation: "❌ Incorrect. Plain HTTP performs zero encryption. Only HTTPS uses TLS to encrypt data in transit." },
        { text: "It travels as readable plain text anyone nearby can capture", explanation: "✅ Correct! HTTP sends raw unencrypted data. A passive Wi-Fi sniffer can read your password without any hacking tools." },
        { text: "The router encrypts it before forwarding", explanation: "❌ Incorrect. Your router forwards packets as-is. It has no knowledge of application-layer secrets." },
        { text: "It gets hashed by WPA2 Wi-Fi encryption", explanation: "❌ Incorrect. WPA2 encrypts the Wi-Fi link layer, but your ISP, the coffee shop server, and any rogue device on the network can still read HTTP payload content." }
      ],
      correct: 1
    }
  },
  {
    id: 2, phase: 1, phaseLabel: "Digital Airwaves",
    name: "DNS Translator", icon: "📖", difficulty: "Beginner",
    tags: ["dns", "networking", "domain", "ip"],
    desc: "Understand how domain names get translated into IP addresses — and why DNS can be poisoned.",
    incident: "In 2010, China's DNS servers accidentally leaked poisoned DNS records globally, redirecting traffic for Twitter, YouTube, and Facebook to Chinese government IPs for millions of users.",
    analogy: "DNS is the internet's telephone directory. When you type 'youtube.com', DNS looks up its numerical GPS address (like 142.250.190.46) so your browser knows which server to drive to. Without DNS, you'd need to memorize every website's IP address. DNS Cache Poisoning is like a scammer replacing entries in that directory so you call the wrong number.",
    hint: "Type any domain name (like 'google.com' or 'netflix.com') and click 'Resolve'. The simulator will show you the DNS lookup chain — Root Server → TLD Server → Authoritative Server → IP Address.",
    labId: "dns_resolver",
    quiz: {
      question: "What is DNS Cache Poisoning, and why is it dangerous?",
      options: [
        { text: "An attack that slows down DNS responses by flooding servers", explanation: "❌ Incorrect. That describes a DNS DDoS attack, not cache poisoning." },
        { text: "A trick where attackers inject fake DNS records to redirect users to malicious servers", explanation: "✅ Correct! Cache poisoning inserts fraudulent IP mappings, so users visiting legitimate sites get redirected to attacker-controlled servers." },
        { text: "A virus that deletes your DNS configuration", explanation: "❌ Incorrect. DNS cache poisoning doesn't delete anything — it corrupts the IP mapping data." },
        { text: "An encryption flaw in the DNS protocol", explanation: "❌ Incorrect. Traditional DNS has no encryption (that's what DNS-over-HTTPS fixes), but poisoning exploits forged responses, not an encryption flaw." }
      ],
      correct: 1
    }
  },
  {
    id: 3, phase: 1, phaseLabel: "Digital Airwaves",
    name: "HTTPS Steel Armor", icon: "🔒", difficulty: "Beginner",
    tags: ["https", "tls", "ssl", "encryption", "certificate"],
    desc: "Activate TLS cryptographic tunnels and verify digital certificates.",
    incident: "In 2011, the DigiNotar certificate authority was hacked and fraudulent SSL certificates were issued for Google.com, allowing Iranian intelligence to intercept 300,000 Gmail sessions.",
    analogy: "HTTPS wraps your internet communication in an armored bank courier's briefcase. The TLS handshake is like two safes exchanging locks without ever revealing their combinations. Even if a middle-man intercepts the briefcase, they only see the sealed exterior. Certificate Authorities are the notaries who verify the safe's ownership — which is why a hacked CA is catastrophic.",
    hint: "Step through the TLS handshake animation: ClientHello → ServerHello → Certificate Verification → Key Exchange → Encrypted Session. Click each step to see exactly what data is exchanged and what gets encrypted.",
    labId: "tls_handshake",
    quiz: {
      question: "What does HTTPS protect that plain HTTP does not?",
      options: [
        { text: "It hides your IP address from the website you're visiting", explanation: "❌ Incorrect. HTTPS encrypts content but the server always knows your IP address to send responses back." },
        { text: "It speeds up page load time with compression", explanation: "❌ Incorrect. HTTP/2 can use compression, but that's separate from HTTPS security. HTTPS actually adds a tiny overhead." },
        { text: "It encrypts data in transit, preventing eavesdropping and tampering", explanation: "✅ Correct! TLS encrypts the payload between your browser and the server, making it unreadable to any interceptor on the network path." },
        { text: "It guarantees the website content is free of malware", explanation: "❌ Incorrect. HTTPS proves you're talking to the right server securely, but it says nothing about the content the server sends." }
      ],
      correct: 2
    }
  },
  {
    id: 4, phase: 1, phaseLabel: "Digital Airwaves",
    name: "White Hat Ethics & Law", icon: "🤠", difficulty: "Beginner",
    tags: ["ethics", "authorization", "law", "penetration-testing"],
    desc: "Understand the legal and ethical line between authorized testing and criminal hacking.",
    incident: "In 2014, a security researcher discovered a critical Uber vulnerability and reported it. Instead of thanking him, Uber threatened legal action — demonstrating why formal bug bounty programs and written authorization exist.",
    analogy: "A White Hat is a certified locksmith hired by a bank to stress-test their vault. They have a signed work order, keys to the front door, and a liability waiver. A Black Hat is a burglar in the parking lot with a crowbar. The technical skills can be identical — the difference is a piece of paper called written authorization. Without it, testing is breaking and entering.",
    hint: "Review the 3 incoming contract requests. Analyze each one: Does it name the system owner? Is there explicit written permission? Is the scope defined? Accept only contracts that meet all three criteria and report the others.",
    labId: "ethics_contracts",
    quiz: {
      question: "A friend says 'you can hack my company's server to test it — I work there.' Is this sufficient authorization to proceed?",
      options: [
        { text: "Yes, verbal permission from an employee is enough", explanation: "❌ Incorrect. Verbal consent from an employee (not the system owner or CISO) provides zero legal protection. You could still face Computer Fraud and Abuse Act charges." },
        { text: "Yes, if you trust the person", explanation: "❌ Incorrect. Trust is irrelevant. Law enforcement doesn't care about your personal trust level — they care about written, verifiable authorization from the authorized system owner." },
        { text: "No — you need explicit written authorization from the actual system owner or designated CISO", explanation: "✅ Correct! Only written permission from the accountable system owner creates a legal defense. Verbal consent from a random employee is worthless in court." },
        { text: "Yes, as long as you don't cause any damage", explanation: "❌ Incorrect. Unauthorized access is a crime regardless of intent or whether damage occurs. The act of unauthorized access is illegal, not just its consequences." }
      ],
      correct: 2
    }
  },
  {
    id: 5, phase: 2, phaseLabel: "Identity Armor",
    name: "Password Entropy & Cracking", icon: "🗝️", difficulty: "Beginner",
    tags: ["password", "entropy", "brute-force", "hashcat"],
    desc: "Calculate real cryptographic entropy and understand GPU-powered password cracking speeds.",
    incident: "In 2012, LinkedIn was breached and 6.5 million SHA-1 hashed passwords were cracked within hours using dictionary attacks. 'password123' and 'linkedin' were cracked in under 1 second.",
    analogy: "Entropy is the measurement of how many guesses an attacker needs. A 4-digit PIN has 10,000 combinations — a modern GPU cracks it in 0.0001 seconds. A 20-character passphrase mixing letters, numbers, symbols, and spaces from a 95-character character set has 95²⁰ = 3.58 × 10³⁹ combinations — even a billion-GPU supercomputer would take longer than the age of the universe.",
    hint: "Type any password. The calculator uses real entropy math: E = log₂(R^L) where R is character set size and L is length. Watch the cracking time counter — it uses actual GPU hash rates (10 billion SHA-256 hashes per second) to compute realistic time-to-crack.",
    labId: "password_entropy",
    quiz: {
      question: "Which password has the highest cryptographic entropy (hardest to crack)?",
      options: [
        { text: "P@ssw0rd123! (common pattern with substitutions)", explanation: "❌ Incorrect. Dictionary attacks and rule-based mutations target exactly these patterns. Hashcat cracks 'P@ssw0rd123!' in under 1 second." },
        { text: "MyDogFluffyIsVeryFluffy2024 (long but predictable dictionary words)", explanation: "❌ Incorrect. Long phrases help, but dictionary-based attacks can still crack concatenated real words relatively quickly." },
        { text: "Tr0ub4dor&3 (famous xkcd example — only 28 bits of entropy)", explanation: "❌ Incorrect. This is the famous xkcd 'correct horse battery staple' example of low entropy from character substitution." },
        { text: "K#9mP$2xLv@nQ7wZ (16 random chars from 95-char set = ~105 bits)", explanation: "✅ Correct! Random characters from the full printable ASCII set produce the maximum entropy per character, making brute-force computationally impossible." }
      ],
      correct: 3
    }
  },
  {
    id: 6, phase: 2, phaseLabel: "Identity Armor",
    name: "2FA Authenticator Shield", icon: "🛡️", difficulty: "Beginner",
    tags: ["2fa", "mfa", "totp", "authentication", "otp"],
    desc: "Deploy time-based one-time password (TOTP) authentication and understand why stolen passwords alone aren't enough.",
    incident: "In 2022, Uber was breached by an 18-year-old who obtained an employee's password via phishing. But Uber without 2FA-everywhere meant the password was the only gate.",
    analogy: "Your password is a door key. 2FA adds a biometric retina scanner that generates a new scan code every 30 seconds, synchronized with your phone. Even if a thief clones your key, they can't pass the scanner without physically holding your phone. TOTP (Time-based One-Time Passwords) use HMAC-SHA1 with Unix timestamps — each code is mathematically valid for exactly 30 seconds.",
    hint: "Your phone shows a live 6-digit TOTP code that rotates every 30 seconds (watch the countdown). Type the exact current code into the verification field. Notice: even if you knew yesterday's code, it was cryptographically invalidated 30 seconds after generation.",
    labId: "totp_2fa",
    quiz: {
      question: "An attacker obtains your password through a data breach. Your account has TOTP 2FA enabled. What can they do?",
      options: [
        { text: "Log in immediately since they have the password", explanation: "❌ Incorrect. TOTP adds a second required factor. Password alone is insufficient — the server requires both factors to authenticate." },
        { text: "Nothing — they cannot log in without your physical phone to generate the current TOTP code", explanation: "✅ Correct! The TOTP algorithm uses a shared secret stored on your phone combined with the current timestamp. Without physical access to your device, the attacker cannot generate valid codes." },
        { text: "Use the same password on other sites you use", explanation: "❌ This describes credential stuffing, which is a real threat — but irrelevant to whether THIS account with 2FA can be broken." },
        { text: "Guess the 6-digit code since there are only 1 million possibilities", explanation: "❌ Incorrect. While there are only 10⁶ codes, TOTP implementations enforce rate limiting and code expiry every 30 seconds. With 3 attempts max per 30s window, brute-force is computationally infeasible." }
      ],
      correct: 1
    }
  },
  {
    id: 7, phase: 2, phaseLabel: "Identity Armor",
    name: "Phishing Email Detective", icon: "🎣", difficulty: "Beginner",
    tags: ["phishing", "social-engineering", "email", "spoofing"],
    desc: "Identify social engineering tactics and dissect fraudulent email anatomy.",
    incident: "The 2016 John Podesta email hack that exposed Clinton campaign emails started with a single spear-phishing email. An IT aide mistakenly called a clearly malicious Google 'security alert' legitimate.",
    analogy: "Phishing is industrial-scale impersonation. Scammers register domains like 'paypa1.com' (using the number 1 instead of lowercase L) or 'security-paypal-alert.com' and style them identically to real sites. The urgency ('Your account will be suspended in 24 hours!') exploits your amygdala's fight-or-flight response, bypassing rational analysis. Always inspect the full sender domain — not just the display name.",
    hint: "Examine the email's four red-flag indicators: sender domain, urgency language, requested action, and link hover destination. Use the domain analyzer tool to score each indicator. A legitimate email from PayPal will always come from exactly @paypal.com — no subdomains, no hyphens, no character substitutions.",
    labId: "phishing_detector",
    quiz: {
      question: "An email from 'PayPal Security <no-reply@paypal-security-alert.com>' says to click immediately or lose your account. What's the primary red flag?",
      options: [
        { text: "The subject line contains the word 'Security'", explanation: "❌ Incorrect. Legitimate security emails also use the word 'security' in their subjects. The word alone is not a red flag." },
        { text: "The email arrived at an unusual time", explanation: "❌ Incorrect. Email arrival time is irrelevant to authenticity. Attackers send phishing emails 24/7." },
        { text: "The sender domain is 'paypal-security-alert.com' — not 'paypal.com'", explanation: "✅ Correct! PayPal only sends email from @paypal.com. The hyphenated domain 'paypal-security-alert.com' is a fraudulent domain anyone can register. The display name 'PayPal Security' is trivially spoofable." },
        { text: "The email asks you to click a link", explanation: "❌ Incorrect. Legitimate companies regularly send emails with links. The issue isn't clicking links — it's where those links lead and the sender's true domain." }
      ],
      correct: 2
    }
  },
  {
    id: 8, phase: 2, phaseLabel: "Identity Armor",
    name: "Smishing & Vishing Traps", icon: "📱", difficulty: "Beginner",
    tags: ["smishing", "vishing", "sms", "social-engineering", "phone"],
    desc: "Neutralize SMS phishing and phone call social engineering attacks.",
    incident: "In 2021, Twitter's 2FA SMS was defeated when attackers used SIM swapping — bribing a carrier employee to transfer a victim's phone number to an attacker's SIM card, intercepting all SMS codes.",
    analogy: "Smishing exploits the fact that SMS feels more personal and urgent than email. When you get a text saying 'Your Amazon package is stuck — pay $1.99 here to redeliver', the tiny fee is intentional psychology: small amounts feel low-risk so you lower your guard and enter your full card details. The scammer's goal was never $1.99 — it was your 16-digit card number, expiry, and CVV.",
    hint: "Analyze the incoming SMS for 3 red flags: (1) Did you actually order anything? (2) Does the link domain match the official carrier website exactly? (3) Why would any legitimate carrier need your card for redelivery? Block and report the scam SMS.",
    labId: "smishing_trap",
    quiz: {
      question: "You receive an SMS: 'USPS: Your parcel #US29442 requires $1.99 redelivery fee. Click: usps-parcel-fee-claim.com'. Why is the tiny $1.99 fee psychologically strategic?",
      options: [
        { text: "Scammers can only process small transactions via SMS", explanation: "❌ Incorrect. Scammers can process any amount — the small fee is a deliberate psychological tactic, not a technical limitation." },
        { text: "$1.99 is the actual cost for SMS phishing to work", explanation: "❌ Incorrect. There is no technical cost associated with the scam itself." },
        { text: "A tiny amount reduces your financial vigilance, causing you to enter full card details that enable unlimited future charges", explanation: "✅ Correct! This is classic 'foot-in-the-door' psychology. You rationalize '$1.99 won't hurt' and input your card — now attackers have all card details for unlimited charges." },
        { text: "Small amounts bypass bank fraud detection algorithms", explanation: "❌ Partially related but not the primary strategic reason. The main goal is psychological — overcoming your financial suspicion." }
      ],
      correct: 2
    }
  },
  {
    id: 9, phase: 3, phaseLabel: "Malware Lab",
    name: "Trojan Horse Triage", icon: "🐴", difficulty: "Intermediate",
    tags: ["trojan", "malware", "social-engineering", "execution"],
    desc: "Differentiate Trojans from viruses/worms and understand deception-based infection vectors.",
    incident: "In 2010, Stuxnet was delivered to Iranian nuclear facilities via USB drives labeled as innocent software updates. It was the most sophisticated Trojan ever created, physically destroying centrifuges.",
    analogy: "Unlike a virus that self-replicates or a worm that spreads via network, a Trojan requires YOU to invite it in. It disguises itself as something you want: a game cheat, a cracked Adobe license, a 'free VPN'. Once you double-click, the Trojan drops its payload — a keylogger, a ransomware engine, a backdoor. The deception is the attack — your trust is the vulnerability being exploited.",
    hint: "Run each file through the static analyzer. Check: file extension mismatch (PDF with .exe extension?), digital signature (is it signed by a known publisher?), VirusTotal score (number of detection flags), and suspicious API calls in the strings table. Quarantine any file with 2 or more red flags.",
    labId: "trojan_triage",
    quiz: {
      question: "How does a Trojan horse fundamentally differ from a computer worm?",
      options: [
        { text: "Trojans encrypt files while worms only copy themselves", explanation: "❌ Incorrect. Either type can perform encryption. The distinction is propagation method, not payload type." },
        { text: "Trojans disguise themselves as legitimate software requiring user execution, while worms self-propagate across networks without user interaction", explanation: "✅ Correct! A Trojan requires social engineering — you must be tricked into running it. A worm spreads autonomously by exploiting network vulnerabilities." },
        { text: "Trojans only affect Windows, worms affect all operating systems", explanation: "❌ Incorrect. Both attack all major operating systems. Platform is not the distinguishing characteristic." },
        { text: "Worms need internet access while Trojans work offline", explanation: "❌ Incorrect. Both can operate in various network conditions. The distinguishing factor is propagation mechanism." }
      ],
      correct: 1
    }
  },
  {
    id: 10, phase: 3, phaseLabel: "Malware Lab",
    name: "Keylogger Terminator", icon: "🛑", difficulty: "Intermediate",
    tags: ["keylogger", "malware", "input", "evasion", "spyware"],
    desc: "Understand how keyloggers capture credentials and how to defeat them.",
    incident: "In 2016, the SWIFT banking system hack used keyloggers to capture banking credentials, then fraudulently transferred $81 million from the Bangladesh Bank by sending authenticated SWIFT messages.",
    analogy: "A software keylogger hooks into the Windows keyboard driver using SetWindowsHookEx API calls, intercepting every keystroke before it reaches your application — totally invisible. It records timestamps, app names, and keystrokes, then exfiltrates them silently. Virtual on-screen keyboards defeat hook-based keyloggers because mouse-click events on UI buttons don't pass through the keyboard API chain the logger monitors.",
    hint: "The lab shows a keylogger interception log in real time. Try typing your 'password' with the physical keyboard and watch it appear in the capture log. Then switch to the virtual keyboard and click letters with your mouse — notice the capture log shows nothing. That's the evasion working.",
    labId: "keylogger_terminator",
    quiz: {
      question: "Why does clicking an on-screen virtual keyboard defeat most software keyloggers?",
      options: [
        { text: "Virtual keyboards use encrypted keystrokes that loggers can't read", explanation: "❌ Incorrect. There's no encryption involved. The issue is the API pathway." },
        { text: "Mouse click events on screen buttons bypass the keyboard hook API chains that software keyloggers monitor", explanation: "✅ Correct! Software keyloggers use SetWindowsHookEx to intercept WM_KEYDOWN events from the keyboard driver. Mouse clicks on screen generate WM_LBUTTONDOWN events on a different API path the logger doesn't hook." },
        { text: "Virtual keyboards automatically disable all running keyloggers", explanation: "❌ Incorrect. The keylogger continues running — virtual keyboards simply use a different input mechanism that doesn't trigger the hook." },
        { text: "Virtual keyboards randomize key positions so captured positions are meaningless", explanation: "❌ Incorrect. Some security keyboards do randomize positions, but that's an additional feature — not the core reason why virtual keyboards defeat loggers." }
      ],
      correct: 1
    }
  },
  {
    id: 11, phase: 3, phaseLabel: "Malware Lab",
    name: "Air-Gap Resilience", icon: "💾", difficulty: "Intermediate",
    tags: ["ransomware", "backup", "air-gap", "recovery", "resilience"],
    desc: "Design ransomware-proof backup architectures using air-gapped offline drives.",
    incident: "The 2021 Colonial Pipeline ransomware attack shut down 45% of the US East Coast's fuel supply for 6 days. They paid $4.4 million in Bitcoin. Companies with verified offline backups recovered in hours rather than days.",
    analogy: "Ransomware encrypts everything reachable over your network — mapped drives, cloud sync folders, NAS devices, anything with an active network path. An air-gapped drive is like your house's fireproof safe: physically disconnected from all networks and powered off. The ransomware's encryption engines have no path to reach it. The 3-2-1 backup rule: 3 copies, 2 different media types, 1 offsite/offline.",
    hint: "Click 'Detonate Ransomware' to watch the infection spread. See which drives get encrypted (connected ones) versus which survive (the air-gapped USB that was physically disconnected). Then use the clean backup to restore and see the recovery time comparison.",
    labId: "airgap_resilience",
    quiz: {
      question: "Why does ransomware typically fail to encrypt an air-gapped backup drive?",
      options: [
        { text: "Air-gapped drives use stronger encryption than ransomware can overcome", explanation: "❌ Incorrect. Ransomware doesn't 'compete' with the drive's encryption. It simply encrypts files regardless of what encryption the drive uses." },
        { text: "Ransomware cannot encrypt files on external drives of any kind", explanation: "❌ Incorrect. Ransomware absolutely encrypts connected external drives, mapped network shares, and USB drives that are plugged in during infection." },
        { text: "A physically disconnected drive has no network or I/O path that ransomware can traverse to reach its files", explanation: "✅ Correct! Ransomware spreads via network paths, active SMB shares, and connected storage. A drive that is powered off and physically disconnected simply has no accessible interface for the malware to write to." },
        { text: "Air-gapped drives auto-encrypt incoming data, making ransomware encryption redundant", explanation: "❌ Incorrect. Self-encrypting drives don't protect against ransomware — they encrypt everything including ransomware-encrypted files." }
      ],
      correct: 2
    }
  },
  {
    id: 12, phase: 3, phaseLabel: "Malware Lab",
    name: "Glass Sandbox Chamber", icon: "🧪", difficulty: "Intermediate",
    tags: ["sandbox", "dynamic-analysis", "malware", "isolation", "cuckoo"],
    desc: "Detonate suspicious executables safely inside isolated virtual environments.",
    incident: "Tools like Cuckoo Sandbox, Any.run, and Joe Sandbox are used by threat intelligence teams at major banks to safely analyze malware samples daily without risking production systems.",
    analogy: "A sandbox is like a bomb disposal robot with cameras: it can safely detonate suspected explosives in a sealed chamber, record exactly what happened, and present a full report — without risk to the operator or surrounding area. The malware thinks it's on a real computer, executes its payload, and reveals its true behavior (file modifications, network calls, registry changes) while the sandbox captures everything forensically.",
    hint: "Select a suspicious file from the dropzone and submit it to the sandbox. Watch the behavioral analysis: file system changes (red), registry modifications (orange), network connection attempts (yellow), and process spawning (cyan). Safe files show minimal activity; malware shows aggressive system modification.",
    labId: "sandbox_chamber",
    quiz: {
      question: "What is the primary advantage of dynamic sandbox analysis over static signature scanning?",
      options: [
        { text: "Sandboxes run faster than antivirus scanners", explanation: "❌ Incorrect. Dynamic sandbox analysis is typically much slower than static scanning — full behavioral analysis can take minutes." },
        { text: "Dynamic analysis observes actual malware behavior at runtime, catching obfuscated or polymorphic malware that has no known signature", explanation: "✅ Correct! Static scanners compare against known signatures — they fail against new, obfuscated, or self-modifying malware. Sandboxes capture actual execution behavior regardless of obfuscation." },
        { text: "Sandboxes can remove malware from infected files", explanation: "❌ Incorrect. Sandboxes are for analysis and classification — not remediation. They tell you what the malware does, not how to clean infected systems." },
        { text: "Static scanning requires internet access while sandboxes work offline", explanation: "❌ Incorrect. Both can operate offline or online. Network access requirements depend on configuration, not the analysis method." }
      ],
      correct: 1
    }
  },
  {
    id: 13, phase: 3, phaseLabel: "Malware Lab",
    name: "Evil Twin Router Hunter", icon: "✈️", difficulty: "Intermediate",
    tags: ["evil-twin", "wifi", "mitm", "rogue-ap", "aircrack"],
    desc: "Identify and avoid rogue access points performing man-in-the-middle attacks.",
    incident: "In 2017, security researchers demonstrated Evil Twin attacks at DEF CON where conference attendees connected to a rogue AP and had all unencrypted traffic intercepted — including credentials.",
    analogy: "An Evil Twin attack is like a criminal setting up a fake 'Starbucks Wi-Fi' kiosk right next to a real one with a stronger signal — your phone automatically connects to the stronger signal. Once connected, all your traffic routes through their laptop: they can see every HTTP request, inject malicious content, and intercept session cookies. Always verify network authenticity before connecting.",
    hint: "Scan the available Wi-Fi networks. Analyze each network's: BSSID (MAC address), signal strength, security protocol (Open/WEP/WPA3), and whether it matches the venue's official network. The evil twin often has a slightly different name, suspiciously strong signal, and an open security configuration.",
    labId: "evil_twin_hunter",
    quiz: {
      question: "You see two Wi-Fi networks at an airport: 'Airport-WiFi-Official (WPA3)' and 'Airport-WiFi-Free (Open)'. The free one has stronger signal. What do you do?",
      options: [
        { text: "Connect to the free one since stronger signal means better speed", explanation: "❌ Incorrect! Strong signal doesn't indicate legitimacy. Evil Twin APs often boost power to attract clients. An open network means zero encryption — all traffic is readable." },
        { text: "Connect to both and use whichever is faster", explanation: "❌ Incorrect. Devices typically use one connection at a time. More importantly, connecting to the rogue AP exposes all your traffic." },
        { text: "Connect to the WPA3 network after verifying with airport staff that it's the correct SSID", explanation: "✅ Correct! WPA3 provides authenticated, encrypted connections. Verifying the official SSID with staff eliminates Evil Twin risk." },
        { text: "Both are equally safe since airports must provide secure Wi-Fi by law", explanation: "❌ Incorrect. There is no such law. Anyone can create a Wi-Fi hotspot with any name in a public space." }
      ],
      correct: 2
    }
  },
  {
    id: 14, phase: 4, phaseLabel: "Network Fortress",
    name: "Armored VPN Tunnel", icon: "🚇", difficulty: "Intermediate",
    tags: ["vpn", "encryption", "tunnel", "privacy", "wireguard"],
    desc: "Construct AES-256 encrypted tunnels for public network safety.",
    incident: "In 2020, the FBI and Europol ran 'Operation Trojan Shield' — secretly operating an encrypted phone network used by criminals. Good operational security with legitimate VPNs would have partially protected those communications.",
    analogy: "A VPN creates a cryptographic tunnel from your device directly to a trusted exit server. Think of it as a armored pneumatic tube running under the coffee shop floor, through the internet, and directly into your bank vault. The coffee shop's Wi-Fi router sees only encrypted tunnel traffic — your DNS queries, HTTP requests, and passwords travel inside the encrypted tube, completely hidden.",
    hint: "The traffic visualizer shows your actual data packets. Without VPN, see your browsing history visible to the local router. Enable the WireGuard VPN tunnel and watch all packets become opaque encrypted chunks that the local router can't inspect. Toggle VPN on/off to compare.",
    labId: "vpn_tunnel",
    quiz: {
      question: "What specifically does a VPN protect when you're on public Wi-Fi?",
      options: [
        { text: "Your physical location from being tracked by any party", explanation: "❌ Incorrect. A VPN shifts your apparent IP location but doesn't make you anonymous — the VPN provider, and potentially law enforcement, can still trace activity." },
        { text: "Your device from malware downloads while browsing", explanation: "❌ Incorrect. A VPN encrypts your traffic in transit but doesn't scan for malware or block malicious downloads." },
        { text: "The contents of your internet traffic from local eavesdroppers on the same network", explanation: "✅ Correct! A VPN's core protection is encrypting traffic between your device and the VPN server, making it unreadable to anyone intercepting local Wi-Fi packets." },
        { text: "Your social media accounts from password theft", explanation: "❌ Incorrect. A VPN protects network traffic. Account security depends on passwords, 2FA, and session management — not VPN encryption." }
      ],
      correct: 2
    }
  },
  {
    id: 15, phase: 4, phaseLabel: "Network Fortress",
    name: "Firewall Port Gatekeeper", icon: "🚪", difficulty: "Intermediate",
    tags: ["firewall", "ports", "iptables", "network-security", "nmap"],
    desc: "Configure stateful packet filtering and understand port-based network access control.",
    incident: "The 2003 SQL Slammer worm spread to 75,000 servers in 10 minutes by exploiting Microsoft SQL Server's UDP port 1434. Organizations with proper firewall rules blocking unused ports were completely immune.",
    analogy: "Your server has 65,535 numbered doors (ports). Every service listens on a specific door: HTTPS on 443, SSH on 22, RDP on 3389, MySQL on 3306. A firewall is a rules-based bouncer with a clipboard. Rule 1: Allow HTTPS on 443 from anywhere. Rule 2: Allow SSH on 22 from only your office IP. Rule 3: DROP everything else. Attackers constantly knock on all 65,535 doors — the bouncer's job is to only open the doors you've explicitly authorized.",
    hint: "You have a web server. The firewall rules table shows current open ports. Use nmap simulation to scan your server from an attacker's perspective — see which ports respond. Close unnecessary ports by adding DROP rules. Goal: only port 443 should be reachable from the internet.",
    labId: "firewall_gatekeeper",
    quiz: {
      question: "Your web server only needs HTTPS. Which firewall rule set is most secure?",
      options: [
        { text: "Allow all traffic on all ports (default open)", explanation: "❌ Extremely dangerous. This exposes every running service to the internet — databases, admin panels, everything." },
        { text: "Allow port 80 and 443, block everything else", explanation: "❌ Close, but allowing unencrypted HTTP port 80 is unnecessary if you redirect to HTTPS. Better to only allow 443." },
        { text: "Allow port 443 inbound, drop all other inbound, allow all outbound", explanation: "✅ Correct! This is minimal attack surface: only the required service is exposed. Outbound allows server responses and updates without allowing unsolicited inbound connections." },
        { text: "Allow all ports from trusted countries only using geo-blocking", explanation: "❌ Geo-blocking is trivially bypassed with VPNs and TOR. It reduces noise but provides no real security — attackers route through domestic infrastructure constantly." }
      ],
      correct: 2
    }
  },
  {
    id: 16, phase: 4, phaseLabel: "Network Fortress",
    name: "SQL Injection Sanitizer", icon: "🧹", difficulty: "Advanced",
    tags: ["sql-injection", "owasp", "parameterized-queries", "web-security", "database"],
    desc: "Exploit and then defend against SQL injection — the #1 web application vulnerability for decades.",
    incident: "In 2008, Heartland Payment Systems was breached via SQL injection, exposing 130 million credit card numbers. It was the largest payment card breach in history at the time.",
    analogy: "SQL injection is like ordering at a restaurant by writing: 'One burger; also please give me the keys to the safe.' A naive waiter (unsanitized query) reads this literally and hands you the safe keys. A trained waiter (parameterized query) treats your entire order as a food request only — the semicolon and 'also' become part of your 'meal request' text, not executable instructions.",
    hint: "The login form constructs an SQL query from your input. Type ' OR '1'='1 in the username field and watch the raw query appear — the injected SQL makes the WHERE clause always true, bypassing authentication entirely. Then enable parameterized queries and try again — the malicious string gets wrapped in quotes and treated as literal data.",
    labId: "sql_injection",
    quiz: {
      question: "Why do parameterized queries (prepared statements) prevent SQL injection?",
      options: [
        { text: "They limit the length of user input to prevent overflow", explanation: "❌ Incorrect. Length limiting is a separate defense. Parameterized queries work by separating code structure from data." },
        { text: "They encrypt user input before inserting it into the database", explanation: "❌ Incorrect. No encryption is involved. The protection comes from strict separation of SQL syntax and data values." },
        { text: "User input is passed as typed data parameters — the SQL engine never interprets it as executable code, regardless of content", explanation: "✅ Correct! In prepared statements, the query structure is compiled first, then data values are bound separately. ' OR '1'='1 becomes a literal string value, not executable SQL." },
        { text: "They require admin database privileges which attackers don't have", explanation: "❌ Incorrect. SQL injection works with the same privileges as the application — it doesn't require elevated privileges. Parameterized queries protect regardless of privilege level." }
      ],
      correct: 2
    }
  },
  {
    id: 17, phase: 4, phaseLabel: "Network Fortress",
    name: "XSS Script Encoder", icon: "📝", difficulty: "Advanced",
    tags: ["xss", "cross-site-scripting", "owasp", "csp", "web-security"],
    desc: "Understand and neutralize Cross-Site Scripting — a top web application vulnerability.",
    incident: "In 2005, the Samy MySpace worm exploited a stored XSS vulnerability to add 'Samy is my hero' to a million MySpace profiles in 20 hours — still the fastest-spreading internet worm ever.",
    analogy: "XSS is like letting a restaurant customer write their 'name' on an order slip, then having the speaker system read the order slip verbatim. If the customer writes 'Table 5; ATTENTION EVERYONE: your credit cards are compromised', the speakers announce it to the entire restaurant. HTML encoding is like putting the customer's written text inside quotes before reading — 'Table 5 [semicolon-ATTENTION-EVERYONE-colon-your-credit-cards-are-compromised]' — now it's just a confusing name, not an announcement.",
    hint: "Type a script tag like <script>alert('XSS')</script> into the comment field. Without protection, the page renders and executes it. Enable Content Security Policy (CSP) and HTML encoding to see how the same input gets escaped into &lt;script&gt; — displayed as text, not executed.",
    labId: "xss_encoder",
    quiz: {
      question: "What does HTML encoding the string '<script>alert(1)</script>' output?",
      options: [
        { text: "[script removed by browser]", explanation: "❌ Incorrect. HTML encoding doesn't remove content — it transforms special characters into their entity representations so they display as text." },
        { text: "The browser blocks it automatically with no action needed", explanation: "❌ Incorrect. Browsers execute any script tag in the DOM unless the developer explicitly prevents it through output encoding or CSP headers." },
        { text: "&lt;script&gt;alert(1)&lt;/script&gt; — displayed as visible text, executed by no one", explanation: "✅ Correct! HTML encoding converts < to &lt; and > to &gt;. The browser renders this as literal angle bracket characters, not as HTML tags — so no script executes." },
        { text: "The script runs in a sandboxed iframe with no access to cookies", explanation: "❌ Incorrect. That describes iframe sandboxing, a different defense mechanism. HTML encoding prevents execution by escaping the content before it enters the DOM." }
      ],
      correct: 2
    }
  },
  {
    id: 18, phase: 4, phaseLabel: "Network Fortress",
    name: "SHA-256 Hash Fingerprinter", icon: "💍", difficulty: "Advanced",
    tags: ["hashing", "sha256", "cryptography", "integrity", "password-storage"],
    desc: "Understand one-way cryptographic hashing and why it's irreversible by mathematical design.",
    incident: "In 2013, Adobe stored passwords using reversible encryption (not hashing) with a constant key. When breached, 153 million passwords were trivially decrypted. Bcrypt hashing would have made this computationally infeasible.",
    analogy: "SHA-256 is a mathematical meat grinder: you can run text through it (one direction, fast), but you can never un-grind the result back to the original. Even changing one character in a 1,000-page document changes its 64-hex-character fingerprint completely — this is the avalanche effect. Databases should never store passwords; they store hashes. Authentication compares 'hash of what you typed' against 'stored hash' — the original never needs to exist on the server.",
    hint: "Type any text in the input field. Watch the SHA-256 hash update in real time. Now change just one character — notice the entire hash changes completely (avalanche effect). This is why cryptographic integrity verification works: a tampered file produces a completely different hash, instantly revealing tampering.",
    labId: "sha256_hasher",
    quiz: {
      question: "Why can't a SHA-256 hash be reversed to recover the original password?",
      options: [
        { text: "SHA-256 uses a secret key that's stored separately from the hash", explanation: "❌ Incorrect. SHA-256 is a keyless hash function. HMAC adds a key, but the irreversibility comes from the algorithm design, not key secrecy." },
        { text: "The original data is deleted after hashing", explanation: "❌ Incorrect. The original data is never stored or deleted during hashing — the hash function just doesn't retain a reversible path to the input." },
        { text: "Hashing is a one-way mathematical function where many inputs can produce the same output space, making reversal computationally intractable", explanation: "✅ Correct! SHA-256 maps arbitrary-length inputs to a fixed 256-bit space through irreversible mathematical operations (bitwise operations, modular arithmetic). The function has no algebraic inverse." },
        { text: "SHA-256 outputs are encrypted with AES, requiring a decryption key", explanation: "❌ Incorrect. SHA-256 is a hash function, not an encryption function. It produces a fixed-size digest through a one-way compression function — no encryption or decryption key is involved." }
      ],
      correct: 2
    }
  },
  {
    id: 19, phase: 5, phaseLabel: "Grandmaster Grid",
    name: "DDoS Traffic Architect", icon: "🚦", difficulty: "Advanced",
    tags: ["ddos", "rate-limiting", "botnet", "cloudflare", "cdn", "resilience"],
    desc: "Design rate-limiting and traffic shaping defenses against volumetric botnet floods.",
    incident: "In 2016, the Mirai botnet compromised 600,000 IoT devices (cameras, DVRs) and launched a DDoS attack against Dyn DNS, taking offline Twitter, Netflix, Reddit, and CNN simultaneously.",
    analogy: "A DDoS attack is 100,000 bots calling a pizza restaurant every 100 milliseconds. The phone lines are permanently busy for real customers. Rate limiting is like a call queue system that allows maximum 2 calls per number per minute — legitimate customers can call once or twice, but bot scripts making hundreds of calls per second get immediately queued and dropped. Geographic rate limiting, CAPTCHAs, and CDN distribution are additional layers.",
    hint: "The traffic monitor shows incoming requests per second from different IP ranges. Normal traffic is 10-50 req/s. Use the rate limiter to set a per-IP threshold. Watch what happens to server response time and error rate as you tune the threshold. Too strict and you block real users; too lenient and the server stays overwhelmed.",
    labId: "ddos_traffic",
    quiz: {
      question: "Your API server suddenly receives 50,000 requests/second from 10,000 different IP addresses. What is the most scalable immediate defense?",
      options: [
        { text: "Add more server capacity to handle the load", explanation: "❌ Incorrect. Scaling server capacity is exactly what attackers want — they'll simply add more bots. This is an arms race you cannot win by scaling alone." },
        { text: "Block all foreign IP addresses", explanation: "❌ Incorrect. Modern botnets use compromised machines in your own country. Geo-blocking also blocks legitimate international users." },
        { text: "Deploy CDN-based rate limiting with progressive traffic challenges (CAPTCHA for suspicious IPs) at the edge layer before traffic reaches your origin", explanation: "✅ Correct! CDN edge nodes absorb volumetric attacks globally, rate limiting filters bots, and challenge pages separate humans from automated traffic — all before a single packet reaches your origin." },
        { text: "Enable firewall rules to block port 80 temporarily", explanation: "❌ Incorrect. Blocking port 80 stops the DDoS but also stops all legitimate users — this is essentially self-denial-of-service." }
      ],
      correct: 2
    }
  },
  {
    id: 20, phase: 5, phaseLabel: "Grandmaster Grid",
    name: "Zero-Day Patch Commander", icon: "⚡", difficulty: "Advanced",
    tags: ["zero-day", "cve", "vulnerability", "patch-management", "exploit"],
    desc: "Manage vulnerability disclosure timelines and emergency patch deployment under attack.",
    incident: "EternalBlue (MS17-010) was leaked by the Shadow Brokers in April 2017. Microsoft had patched it weeks earlier, but 200,000 unpatched systems were devastated by WannaCry ransomware in May 2017.",
    analogy: "A zero-day is a security vulnerability that the software vendor doesn't know about yet — so zero days have passed since they could have started working on a patch. The window between public disclosure and patch deployment is the most dangerous period: attackers actively develop exploits while defenders scramble to patch. Patch management SLAs (patch critical CVEs within 24-72 hours) are the difference between a bulletproof fortress and a castle with an open drawbridge.",
    hint: "The vulnerability dashboard shows incoming CVE alerts with CVSS severity scores. Triage them by score and exploitability. For any CVSS 9.0+ vulnerability with known public exploits, deploy the patch immediately. For lower severity CVEs, test in staging first. Watch the attack probability meter as you patch — it drops with each fix.",
    labId: "zerodday_patching",
    quiz: {
      question: "A CVSS 9.8 (Critical) CVE is published with a known public exploit. Your production server runs the affected software. What should your SLA be?",
      options: [
        { text: "Patch during the next scheduled quarterly maintenance window", explanation: "❌ Critical. A CVSS 9.8 vulnerability with a known public exploit is actively being weaponized. Waiting months means near-certain compromise." },
        { text: "Deploy an emergency patch or compensating control (WAF rule, network isolation) within 24 hours", explanation: "✅ Correct! CVSS 9.8 with known public exploit = imminent attack risk. Apply the vendor patch within 24 hours or implement compensating controls (WAF rules, port blocking, network isolation) immediately while the patch is prepared." },
        { text: "Wait for a vendor-confirmed patch since CVEs can be false positives", explanation: "❌ Incorrect. A published CVE with a CVSS score has already been verified by NIST/NVD. Waiting for additional confirmation when attackers are already exploiting is reckless." },
        { text: "Monitor for attacks and patch only if you get compromised", explanation: "❌ Extremely dangerous. By the time you detect compromise from an active exploit, the attacker has likely established persistence and moved laterally throughout your network." }
      ],
      correct: 1
    }
  },
  {
    id: 21, phase: 5, phaseLabel: "Grandmaster Grid",
    name: "Digital Forensics Timeline", icon: "🔍", difficulty: "Advanced",
    tags: ["forensics", "logs", "incident-response", "dfir", "timeline"],
    desc: "Reconstruct breach timelines from system logs, network captures, and forensic artifacts.",
    incident: "The 2013 Target breach took 3 months to detect. Forensic investigators eventually reconstructed the full attack timeline using HVAC vendor credential logs, POS terminal memory dumps, and network flow data.",
    analogy: "Digital forensics is archaeology with timestamps. Every system action leaves artifacts: login events in /var/log/auth.log, network connections in firewall logs, file access in the filesystem MFT. An investigator chains these artifacts chronologically to reconstruct 'who did what, when, from where, and how' with mathematical precision — just like a detective piecing together a crime scene using physical evidence.",
    hint: "The log viewer shows raw server logs from a suspected breach. Use the timeline filter to isolate the attack window. Look for: unusual login times, foreign IP addresses, failed-then-successful login sequences, privilege escalation events, and large outbound data transfers. Tag each suspicious event to build the incident timeline.",
    labId: "forensics_timeline",
    quiz: {
      question: "In forensic log analysis, what pattern most strongly indicates a successful brute-force attack followed by unauthorized access?",
      options: [
        { text: "High CPU usage on the web server during business hours", explanation: "❌ Incorrect. High CPU during business hours is normal behavior. This provides no forensic signal of unauthorized access." },
        { text: "Many failed login attempts from a foreign IP, followed immediately by a successful login from the same IP", explanation: "✅ Correct! This classic brute-force signature shows systematic password guessing (multiple failures) culminating in success — strongly indicating automated credential attacks." },
        { text: "Large file downloads by known administrator accounts during business hours", explanation: "❌ Incorrect. Admins legitimately download large files. Context and authorization matter — this alone isn't a breach indicator." },
        { text: "Server reboot events logged during scheduled maintenance windows", explanation: "❌ Incorrect. Scheduled maintenance reboots are normal operations. Cross-referencing with maintenance logs would show this is authorized." }
      ],
      correct: 1
    }
  },
  {
    id: 22, phase: 5, phaseLabel: "Grandmaster Grid",
    name: "Citadel Architect — Defense in Depth", icon: "👑", difficulty: "Advanced",
    tags: ["defense-in-depth", "zero-trust", "architecture", "nist", "framework"],
    desc: "Design multi-layered security architectures using the Defense in Depth and Zero Trust principles.",
    incident: "The 2020 SolarWinds hack breached 18,000 organizations including the US Treasury, Pentagon, and Microsoft by compromising the software supply chain — bypassing all perimeter defenses. Only Zero Trust architectures with microsegmentation limited attacker movement.",
    analogy: "A medieval fortress didn't rely on a single wall — it had a moat, outer walls, inner walls, keep towers, and a hardened vault in the center. If attackers breach the moat, the outer wall stops them. Breach the wall, the inner defenses hold. True Defense in Depth means assuming any single layer will eventually fail and building compensating controls for that inevitability. Zero Trust extends this: 'never trust, always verify' — every user, device, and service proves authorization continuously.",
    hint: "Design your security architecture by layering all controls: Perimeter (firewall, WAF, DDoS protection) → Network (VLAN segmentation, IDS/IPS) → Identity (2FA, privileged access management) → Application (input validation, secure coding) → Data (encryption at rest, DLP) → Monitoring (SIEM, alerting). Each layer must be independently robust.",
    labId: "citadel_architect",
    quiz: {
      question: "What is the core principle of Zero Trust security architecture?",
      options: [
        { text: "Trust all traffic inside the corporate network perimeter, verify only external traffic", explanation: "❌ Incorrect. This describes the legacy 'castle-and-moat' model that Zero Trust explicitly replaces. Internal traffic is equally untrusted." },
        { text: "Block all traffic by default and only allow specifically authorized connections after continuous identity verification", explanation: "✅ Correct! Zero Trust operates on 'never trust, always verify' — every user, device, and service must authenticate and authorize every access request, regardless of network location." },
        { text: "Use maximum encryption for all data at rest and in transit", explanation: "❌ Incorrect. Encryption is an important component but not the defining principle of Zero Trust. Zero Trust is primarily about identity verification and least-privilege access." },
        { text: "Focus all security budget on the network perimeter to prevent attackers from entering", explanation: "❌ Incorrect. This is the antithesis of Zero Trust. Perimeter-focused security assumes internal users and systems are safe — a dangerous assumption in an era of supply chain attacks and insider threats." }
      ],
      correct: 1
    }
  }
];

// Phase metadata
const PHASES = [
  { id: 1, name: "Digital Airwaves", icon: "🌐", color: "#06b6d4", modules: [1,2,3,4] },
  { id: 2, name: "Identity Armor",   icon: "🛡️", color: "#8b5cf6", modules: [5,6,7,8] },
  { id: 3, name: "Malware Lab",      icon: "☣️", color: "#ef4444", modules: [9,10,11,12,13] },
  { id: 4, name: "Network Fortress", icon: "🔐", color: "#f59e0b", modules: [14,15,16,17,18] },
  { id: 5, name: "Grandmaster Grid", icon: "👑", color: "#10b981", modules: [19,20,21,22] }
];

const DIFFICULTY_COLOR = {
  "Beginner": "#10b981",
  "Intermediate": "#f59e0b",
  "Advanced": "#ef4444"
};

// Threat of the Day — rotates daily
const DAILY_THREATS = [
  { type: "Ransomware", name: "LockBit 3.0", desc: "Active ransomware-as-a-service targeting healthcare and manufacturing sectors.", module: 11 },
  { type: "Phishing", name: "CEO Fraud Wave", desc: "Spear-phishing emails impersonating C-suite executives requesting urgent wire transfers.", module: 7 },
  { type: "Zero-Day", name: "CVSS 9.1 RCE", desc: "Unpatched Remote Code Execution vulnerability in widely-used SSL library.", module: 20 },
  { type: "DDoS", name: "Mirai Botnet Variant", desc: "New IoT botnet variant targeting financial institutions with 2Tbps floods.", module: 19 },
  { type: "SQL Injection", name: "eCommerce Campaign", desc: "Mass automated SQL injection campaign targeting online retail checkout pages.", module: 16 },
  { type: "Supply Chain", name: "npm Package Typosquatting", desc: "Malicious npm packages mimicking popular libraries to execute crypto miners.", module: 9 },
  { type: "Evil Twin", name: "Airport Wi-Fi Campaign", desc: "Coordinated Evil Twin AP deployments targeting business travelers at major airports.", module: 13 }
];
