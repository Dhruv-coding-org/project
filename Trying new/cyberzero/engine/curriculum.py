# Curriculum database for all 22 beginner cybersecurity modules

CURRICULUM = {
    1: {
        "id": 1,
        "title": "What is a Computer Network?",
        "phase": "Phase 1: Foundation & The Digital World",
        "analogy": "Two people talking through paper cup telephones connected by a long string across a room.",
        "lesson": (
            "When you browse a website or send an email, your computer isn't doing magic—it is sending tiny electrical signals across physical wires or radio waves (Wi-Fi) to another computer called a **Server**.\n\n"
            "Think of data like water flowing through pipes. If someone taps into the pipe along the way, they can see whatever is flowing inside unless it is protected!"
        ),
        "quiz": {
            "question": "What is a Server on the internet?",
            "options": [
                "A magical cloud floating in the sky with no physical computer",
                "A powerful computer waiting to answer requests and send websites to your screen",
                "A secret virus that slows down your Wi-Fi router",
                "An HDMI cable connecting your monitor"
            ],
            "correct_idx": 1,
            "explanation": "A server is just a powerful, dedicated computer whose job is to serve websites and data to clients (like your laptop or phone) when requested!"
        },
        "lab_name": "Wire Tap Simulator"
    },
    2: {
        "id": 2,
        "title": "IP Addresses & Domain Names",
        "phase": "Phase 1: Foundation & The Digital World",
        "analogy": "The GPS street coordinate of a house (192.168.1.1) versus the name on the store sign (google.com).",
        "lesson": (
            "Every computer connected to the internet needs a unique address so data packets know where to go. This numerical coordinate is called an **IP Address** (like `142.250.190.46`).\n\n"
            "Because humans are terrible at memorizing strings of numbers, we invented **DNS (Domain Name System)**—the internet's phonebook! When you type `google.com`, DNS translates it to the IP number instantly."
        ),
        "quiz": {
            "question": "Why do we use Domain Names like 'google.com' instead of typing IP addresses directly?",
            "options": [
                "IP addresses cost extra money to type into web browsers",
                "DNS translates human-friendly names into numerical IP coordinates so we don't have to memorize numbers",
                "Domain names make Wi-Fi routers run 10 times faster",
                "IP addresses are only for secret government hackers"
            ],
            "correct_idx": 1,
            "explanation": "Exactly! DNS acts just like your phone contacts list—you tap 'Mom' instead of dialing her 10-digit phone number from memory every time!"
        },
        "lab_name": "DNS Lookup & IP Tracer"
    },
    3: {
        "id": 3,
        "title": "HTTP vs HTTPS (The Secret Lock Icon)",
        "phase": "Phase 1: Foundation & The Digital World",
        "analogy": "Sending an open postcard through the public mail versus sending a locked steel briefcase with a secret key.",
        "lesson": (
            "When you visit a site starting with **HTTP**, your messages travel across the internet in plain text—just like an open postcard! Anyone handling the mail along the way can read your password.\n\n"
            "When a site uses **HTTPS** (notice the 'S' for Secure and the lock icon 🔒), your browser scrambles your data into gibberish using SSL/TLS encryption. Only the true destination server has the secret key to unlock and read it!"
        ),
        "quiz": {
            "question": "What happens if you type your credit card on a website using plain HTTP?",
            "options": [
                "Your computer will immediately explode with sparks",
                "Anyone snooping on the network wire can read your credit card number in plain text",
                "The bank will automatically send you a free pizza",
                "The website will load in black and white"
            ],
            "correct_idx": 1,
            "explanation": "Never enter passwords or credit cards on plain HTTP sites! Without HTTPS encryption, your data is visible to anyone eavesdropping on the network."
        },
        "lab_name": "Packet Interceptor"
    },
    4: {
        "id": 4,
        "title": "White Hats vs Black Hats",
        "phase": "Phase 1: Foundation & The Digital World",
        "analogy": "Digital locksmiths hired by the bank versus burglars trying to break in at midnight.",
        "lesson": (
            "Not all hackers are criminals! In cybersecurity, we classify hackers by their 'hat color':\n"
            "• **Black Hat Hackers**: Criminals who break into systems to steal data, money, or cause chaos without permission.\n"
            "• **White Hat Hackers (Ethical Hackers)**: Cybersecurity experts hired by companies to test their defenses and find weaknesses *before* the bad guys do.\n"
            "• **Grey Hat Hackers**: Hackers who don't have malicious intent but sometimes break into systems without explicit permission just to prove they can."
        ),
        "quiz": {
            "question": "What is the main role of a White Hat (Ethical) Hacker?",
            "options": [
                "To steal credit card numbers and sell them on the dark web",
                "To legally test and secure a system by finding vulnerabilities before criminal hackers do",
                "To sell computers at retail electronics stores",
                "To wear white baseball caps while gaming"
            ],
            "correct_idx": 1,
            "explanation": "White Hat hackers use the exact same skills and tools as criminals, but they do it legally and ethically to protect organizations!"
        },
        "lab_name": "Threat Actor Classifier Quiz"
    },
    5: {
        "id": 5,
        "title": "Passwords & Brute-Force Cracking",
        "phase": "Phase 2: Personal Protection & Identity",
        "analogy": "A flimsy door latch made of cardboard versus a titanium bank vault door with 10 rotating locks.",
        "lesson": (
            "Your password is your front door lock. Hackers don't sit there guessing passwords by hand; they use automated software that tries millions of combinations per second! This is called a **Brute-Force Attack**.\n\n"
            "If your password is a common word like `password123` or `sunshine`, an automated **Dictionary Attack** will crack it in 0.001 seconds! Adding length, numbers, and symbols increases the mathematical combinations from thousands to billions of years!"
        ),
        "quiz": {
            "question": "Why is 'P@ssw0rd!2026_Sec' hundreds of times safer than 'password123'?",
            "options": [
                "Because computers can only read lowercase letters",
                "The mix of length, symbols, numbers, and uppercase multiplies the number of mathematical combinations astronomically",
                "Because websites reject passwords that contain numbers",
                "It isn't safer; all passwords can be guessed in 5 seconds"
            ],
            "correct_idx": 1,
            "explanation": "Length is king in cryptography! Each extra character and symbol type exponentially increases the time required for a brute-force computer to guess it."
        },
        "lab_name": "Password Entropy & Speed Simulator"
    },
    6: {
        "id": 6,
        "title": "Multi-Factor Authentication (MFA)",
        "phase": "Phase 2: Personal Protection & Identity",
        "analogy": "A bank vault that requires a metal key AND a rotating 30-second digital fingerprint token.",
        "lesson": (
            "What happens if a hacker steals your password in a data breach? If you only have a password, they walk right into your account!\n\n"
            "**MFA (Multi-Factor Authentication)** stops them cold. MFA requires two separate pieces of evidence to log in:\n"
            "1. Something you **KNOW** (your password).\n"
            "2. Something you **HAVE** (a rotating 6-digit code on an Authenticator app on your phone).\n\n"
            "Even with your password, the hacker can't log in without physically holding your phone!"
        ),
        "quiz": {
            "question": "Which of the following is the best example of Multi-Factor Authentication?",
            "options": [
                "Entering your password twice on the same website",
                "Using a password PLUS a temporary 6-digit code generated by an Authenticator app on your phone",
                "Writing your password down on a sticky note under your keyboard",
                "Using the same password for your email and your bank"
            ],
            "correct_idx": 1,
            "explanation": "Combining something you KNOW (password) with something you HAVE (phone token) creates an almost unbreakable second layer of defense!"
        },
        "lab_name": "Interactive TOTP Token Generator"
    },
    7: {
        "id": 7,
        "title": "Phishing & Email Scams",
        "phase": "Phase 2: Personal Protection & Identity",
        "analogy": "A con artist disguised as a police officer knocking on your door asking for your house keys.",
        "lesson": (
            "Humans are the easiest part of any security system to hack! **Phishing** is when a cyber crook sends a fake email, text message, or website link designed to look exactly like a trusted company (like PayPal, Amazon, or your bank).\n\n"
            "How to spot them:\n"
            "• Look for tricky domain spelling typos (e.g., `paypaI.com` with a capital i, or `support-netflix-alert.com`).\n"
            "• Beware of urgent threats: *'Your account will be deleted in 2 hours unless you click here!'*\n"
            "• Hover over links before clicking to see where they really go!"
        ),
        "quiz": {
            "question": "You receive an email claiming to be from your bank: 'URGENT! Security breach! Click here to verify your password immediately!' What should you do?",
            "options": [
                "Click the link immediately and enter your bank pin to save your account",
                "Do NOT click the link! Inspect the sender address, or open a new browser tab and type your bank's official web address directly",
                "Forward the email to all your friends so they can enter their passwords too",
                "Reply to the email with your credit card number"
            ],
            "correct_idx": 1,
            "explanation": "Real banks and tech companies will never email or text you asking you to click a link to verify your password or PIN under urgent threats!"
        },
        "lab_name": "Phishing Detective Inbox"
    },
    8: {
        "id": 8,
        "title": "Social Engineering & SMS/Voice Scams",
        "phase": "Phase 2: Personal Protection & Identity",
        "analogy": "An actor calling you pretending to be IT support claiming your computer has a virus.",
        "lesson": (
            "**Social Engineering** is the psychological manipulation of people into performing actions or divulging confidential information. Hackers know it's much easier to trick a human than to break a 256-bit encryption firewall!\n\n"
            "• **Smishing**: Phishing via SMS text messages (e.g., fake package delivery fees from 'USPS' or 'FedEx').\n"
            "• **Vishing**: Phishing via phone calls (e.g., scammers pretending to be government tax officials demanding immediate payment by gift card!)."
        ),
        "quiz": {
            "question": "Someone calls you claiming to be from the government tax office, threatening you with jail time unless you immediately pay $500 in iTunes gift cards. What is this?",
            "options": [
                "A legitimate tax collection procedure",
                "A classic Vishing (Voice Phishing) social engineering scam! Hang up immediately.",
                "A software update bug",
                "An automated Wi-Fi router test"
            ],
            "correct_idx": 1,
            "explanation": "Government agencies and legitimate corporations NEVER demand payment or tax fines via retail gift cards or cryptocurrency over the phone!"
        },
        "lab_name": "SMS Scam Analyzer"
    },
    9: {
        "id": 9,
        "title": "What is Malware? Viruses, Worms & Trojans",
        "phase": "Phase 3: Digital Contagions & Malware",
        "analogy": "A wooden Trojan Horse statue gifted to a city with enemy soldiers hidden inside.",
        "lesson": (
            "**Malware** (Malicious Software) is any program designed to harm, exploit, or spy on your computer. Let's learn the 3 major types:\n"
            "• **Virus**: Needs a host file to ride on. It attaches to a legitimate program and spreads when you share or run the file.\n"
            "• **Worm**: An independent crawler! It doesn't need a host file; it crawls across network cables on its own, infecting every unprotected computer it touches.\n"
            "• **Trojan Horse**: Disguises itself as something useful or fun (like a free game download, a cheat code, or an invoice PDF). Once you open it, the enemy soldiers step out!"
        ),
        "quiz": {
            "question": "What is the key difference between a Computer Worm and a Trojan Horse?",
            "options": [
                "Worms only infect Mac computers while Trojans only infect Windows",
                "A Trojan relies on tricking the user into downloading and opening it by disguising itself, while a Worm can spread automatically across networks without user help",
                "Trojan horses are good for your computer's health",
                "Worms are physical insects living inside your CPU fan"
            ],
            "correct_idx": 1,
            "explanation": "Trojans use social engineering to trick you into inviting them in, whereas Worms are self-replicating network travelers!"
        },
        "lab_name": "Malware Behavioral Classifier"
    },
    10: {
        "id": 10,
        "title": "Spyware & Keyloggers",
        "phase": "Phase 3: Digital Contagions & Malware",
        "analogy": "An invisible spy bugging your room and peering over your shoulder to record every key you press.",
        "lesson": (
            "Imagine someone attaching a tiny wiretap to your keyboard. A **Keylogger** is a specialized type of **Spyware** that secretly records every keystroke you type—including your passwords, credit card numbers, private chats, and bank logins!\n\n"
            "Spyware often hides in free toolbar downloads, sketchy screen recorders, or pirated software. Once installed, it silently beams your typed secrets back to the hacker's command server."
        ),
        "quiz": {
            "question": "How does a Keylogger steal your online bank account password?",
            "options": [
                "By breaking open your monitor screen with a hammer",
                "By silently recording every key you press on your keyboard and sending the log to a hacker over the internet",
                "By deleting your web browser bookmarks",
                "By changing your desktop background wallpaper"
            ],
            "correct_idx": 1,
            "explanation": "Keyloggers capture your keystrokes silently in the background without causing obvious popups or crashes, making them very dangerous!"
        },
        "lab_name": "Keylogger Detection & Process Killer"
    },
    11: {
        "id": 11,
        "title": "Ransomware & Offline Backups",
        "phase": "Phase 3: Digital Contagions & Malware",
        "analogy": "A burglar breaking into your house, changing all the door locks, and leaving a ransom note demanding $10,000 for the new key.",
        "lesson": (
            "**Ransomware** is one of the most destructive cyber attacks in the world. Once activated, it rapidly scrambles and locks (encrypts) every family photo, work document, and database on your computer using an unbreakable cryptographic lock.\n\n"
            "The screen turns red with a countdown clock demanding Bitcoin ransom money! Why paying doesn't work: criminals often take the money and never give you the decryption key.\n"
            "The #1 defense is the **3-2-1 Backup Rule**: Keep an **offline backup hard drive** disconnected from your computer so ransomware can't reach it!"
        ),
        "quiz": {
            "question": "Why is keeping an OFFLINE backup hard drive the best defense against Ransomware?",
            "options": [
                "Because hard drives look cool on a desk",
                "If ransomware infects your computer, it cannot encrypt a backup hard drive that is physically unplugged and disconnected from the machine!",
                "Offline backups make your internet connection 50% cheaper",
                "Ransomware is afraid of USB cables"
            ],
            "correct_idx": 1,
            "explanation": "Air-gapping (physically unplugging) your backup drive ensures that no digital infection can spread to your precious saved files!"
        },
        "lab_name": "Ransomware Containment & Backup Restore"
    },
    12: {
        "id": 12,
        "title": "Antivirus & Quarantine Sandboxes",
        "phase": "Phase 3: Digital Contagions & Malware",
        "analogy": "A hospital quarantine ward where sick patients are kept inside an isolated glass room so they cannot infect the rest of the hospital.",
        "lesson": (
            "How do cybersecurity researchers and antivirus software test dangerous virus programs without destroying their own computers? They use a **Quarantine Sandbox**!\n\n"
            "A Sandbox is an isolated, virtual 'bubble' environment on your computer. If you run a suspicious file inside the sandbox and it turns out to be a vicious ransomware bomb, it only explodes inside the glass bubble! When you close the sandbox, the bubble vanishes, leaving your real computer 100% safe and clean."
        ),
        "quiz": {
            "question": "What is the purpose of a Quarantine Sandbox in cybersecurity?",
            "options": [
                "To play video games on the beach with real sand",
                "To safely open and test suspicious files in an isolated virtual bubble without risking infection to the real computer system",
                "To make keyboard typing sounds quieter",
                "To speed up downloading movies"
            ],
            "correct_idx": 1,
            "explanation": "Sandboxing lets defenders inspect malware behavior safely in an isolated cage without endangering the underlying operating system!"
        },
        "lab_name": "Hex Scanner & Sandbox Execution Lab"
    },
    13: {
        "id": 13,
        "title": "Wi-Fi Security & Public Airport Networks",
        "phase": "Phase 4: Web & Network Security",
        "analogy": "Shouting your private conversation across a crowded coffee shop where anyone sitting at a nearby table can hear every word.",
        "lesson": (
            "When you connect to a free public Wi-Fi network at an airport, hotel, or coffee shop (without a password), your radio signals broadcast outward in all directions through the air.\n\n"
            "Hackers sitting nearby can use free packet-sniffing tools or set up a fake **'Evil Twin' Wi-Fi router** named `Free-Airport-WiFi-Fast`. If you connect to their fake router, every web address and message you send passes directly through their laptop!"
        ),
        "quiz": {
            "question": "What is an 'Evil Twin' Wi-Fi attack?",
            "options": [
                "Two twin brothers working at a computer repair shop",
                "When a hacker sets up a rogue Wi-Fi access point with a legitimate-looking name (like 'Starbucks_Guest') to intercept traffic from people who connect to it",
                "When your Wi-Fi router has two antennas instead of four",
                "A horror movie about routers"
            ],
            "correct_idx": 1,
            "explanation": "Always verify network names with staff, and turn off your device's auto-connect feature when traveling!"
        },
        "lab_name": "Evil Twin Wi-Fi Detector"
    },
    14: {
        "id": 14,
        "title": "What is a VPN? (Virtual Private Network)",
        "phase": "Phase 4: Web & Network Security",
        "analogy": "Building an armored, bulletproof underground tunnel between your laptop and your destination through the middle of a crowded city.",
        "lesson": (
            "How do you safely use public airport Wi-Fi? You turn on a **VPN (Virtual Private Network)**!\n\n"
            "When a VPN is active, it takes all your network traffic and wraps it in heavy cryptographic armor before sending it out into the air. Even if a hacker is listening to the Wi-Fi airwaves or running an Evil Twin router, all they see is an impenetrable, gibberish encrypted tunnel flowing past them!"
        ),
        "quiz": {
            "question": "How does a VPN protect you on a public Wi-Fi network?",
            "options": [
                "By turning off your laptop's screen brightness",
                "By encrypting your entire internet connection into a secure tunnel so local eavesdroppers cannot read your traffic",
                "By giving you free unlimited airline tickets",
                "By deleting all the cookies on your computer"
            ],
            "correct_idx": 1,
            "explanation": "A VPN acts as an encrypted shield, keeping your browsing habits, location, and data private from local network snoopers!"
        },
        "lab_name": "VPN Tunnel Encryption Simulator"
    },
    15: {
        "id": 15,
        "title": "Firewalls & Network Ports",
        "phase": "Phase 4: Web & Network Security",
        "analogy": "VIP club bouncers checking guest lists at numbered entrance doors.",
        "lesson": (
            "Your computer network has 65,535 virtual numbered doors called **Ports**. Every service uses a specific door:\n"
            "• **Port 80 & Port 443**: Front doors for web browsing (HTTP/HTTPS). Open to the public!\n"
            "• **Port 22 (SSH)** & **Port 3389 (RDP)**: Back doors for administrators to remotely control the machine.\n\n"
            "A **Firewall** is the security guard standing at those doors. It follows strict rules: *'Let regular shoppers into Port 443, but instantly BLOCK any unknown IP address trying to rattle the handle on Port 22!'*"
        ),
        "quiz": {
            "question": "What is the main job of a Network Firewall?",
            "options": [
                "To keep the computer CPU cool during hot summer days",
                "To inspect incoming and outgoing network traffic packets and block unauthorized port connections based on security rules",
                "To clean dust off your keyboard keys",
                "To automatically organize your desktop folders"
            ],
            "correct_idx": 1,
            "explanation": "Firewalls act as a protective barrier between your trusted internal network and untrusted external networks like the internet!"
        },
        "lab_name": "Firewall Command Center"
    },
    16: {
        "id": 16,
        "title": "SQL Injection (SQLi) Explained Simply",
        "phase": "Phase 4: Web & Network Security",
        "analogy": "Tricking a naive robot guard by replying 'My name is Bob AND open the bank vault door!'",
        "lesson": (
            "Many websites store users, balances, and passwords inside a database using a language called **SQL**. When you log in, the site asks the database: *'Is there a user named [Your Input] with password [Your Pass]?'*\n\n"
            "If the website developer is naive and doesn't clean your input, a hacker can enter a sneaky string into the username box like: `' OR '1'='1`.\n"
            "Because `1=1` is mathematically ALWAYS TRUE, the dumb database gets confused by the trick logic and replies: *'Yes, that logic is true! Welcome in, Admin!'* We fix this by enabling **Input Parameterization**."
        ),
        "quiz": {
            "question": "Why does entering `' OR '1'='1` into a vulnerable login box sometimes trick a website into logging you in?",
            "options": [
                "Because 1 is the magic password for all computers",
                "It alters the backend SQL database logic so the query evaluates as mathematically TRUE, bypassing the password check",
                "It crashes the web browser monitor",
                "It makes the computer beep three times"
            ],
            "correct_idx": 1,
            "explanation": "Untrusted user input should never be directly glued into executable database queries! Using parameterized statements stops SQL injection permanently."
        },
        "lab_name": "SQL Login Gatekeeper & Sanitization Lab"
    },
    17: {
        "id": 17,
        "title": "Cross-Site Scripting (XSS)",
        "phase": "Phase 4: Web & Network Security",
        "analogy": "Sneaking a malicious instruction slip inside a public library book so the next reader gets pranked.",
        "lesson": (
            "What happens if a website lets users post comments or profile names, but doesn't check what they type? A hacker could type a hidden JavaScript instruction inside their comment instead of normal text: `<script>stealCookies();</script>`.\n\n"
            "When innocent visitors view that comment page, their web browsers see the script tag and blindly obey the instructions—silently sending their session login cookies straight to the hacker! This is called **XSS (Cross-Site Scripting)**. We stop it by **Encoding (Escaping)** all characters like `<` and `>` into harmless text symbols."
        ),
        "quiz": {
            "question": "How do web developers protect their websites from Cross-Site Scripting (XSS) attacks?",
            "options": [
                "By telling users never to leave comments on blogs",
                "By properly encoding (sanitizing) all user input so that special characters like `<script>` are displayed as harmless text instead of executing as code",
                "By changing the font color to blue",
                "By unplugging the web server every night at midnight"
            ],
            "correct_idx": 1,
            "explanation": "Output encoding ensures that even if someone types `<script>`, the browser renders it safely as text on the screen rather than executing it as a script!"
        },
        "lab_name": "Script Injection Inspector & Output Encoding"
    },
    18: {
        "id": 18,
        "title": "Cryptography & Cryptographic Hashing",
        "phase": "Phase 5: Advanced Defense & Cryptography",
        "analogy": "A human thumbprint: you can easily press your thumb on ink to make a print, but no one can take a print off paper and build a live thumb!",
        "lesson": (
            "In cryptography, a **Hash Function** (like SHA-256) is a one-way mathematical meat grinder. You can feed any file, password, or entire encyclopedia into it, and it instantly generates a unique 64-character hex string (a digital fingerprint).\n\n"
            "Why is this useful?\n"
            "1. **Password Storage**: Websites should NEVER save your plain passwords! They save the *hash fingerprint*. When you log in, they hash what you typed and see if the two fingerprints match!\n"
            "2. **File Integrity**: If a hacker secretly tampers with even 1 period inside a 1,000-page software file, the resulting hash fingerprint changes completely, triggering an instant security alarm!"
        ),
        "quiz": {
            "question": "Why is a cryptographic hash (like SHA-256) considered a 'one-way' function?",
            "options": [
                "Because data only travels east across the Atlantic ocean",
                "You can easily compute the hash fingerprint from a file, but it is mathematically impossible to reverse the fingerprint back into the original file",
                "Because hashes can only be computed once per day",
                "It requires a special one-way keyboard cable"
            ],
            "correct_idx": 1,
            "explanation": "Hashing is a one-way transformation! This is why databases can verify your password hash without ever knowing your actual plaintext password."
        },
        "lab_name": "SHA-256 Hasher & File Integrity Verifier"
    },
    19: {
        "id": 19,
        "title": "Denial of Service (DDoS) Attacks",
        "phase": "Phase 5: Advanced Defense & Cryptography",
        "analogy": "A malicious competitor hiring 10,000 fake cars to circle your restaurant's parking lot so real paying customers can't park or enter.",
        "lesson": (
            "A **DDoS (Distributed Denial of Service)** attack isn't about stealing data or passwords—it's about causing a massive digital traffic jam to knock a website offline!\n\n"
            "Hackers use a **Botnet** (thousands of computers, smart TVs, and routers that were previously infected with malware around the world). On the hacker's command, all 10,000 infected devices flood a single website with fake web requests simultaneously. The web server gets overwhelmed by the flood and crashes! Defenders stop this using **Rate-Limiting** and **Traffic Shaking Shields**."
        ),
        "quiz": {
            "question": "What is a Botnet used for during a DDoS attack?",
            "options": [
                "To play online chess tournaments against grandmasters",
                "A network of thousands of infected 'zombie' computers coordinated to flood a target server with massive traffic at the exact same time",
                "To vacuum clean the inside of computer servers",
                "To generate free cryptocurrency for the government"
            ],
            "correct_idx": 1,
            "explanation": "By distributing the attack across thousands of IP addresses globally, DDoS attacks become much harder for single firewalls to block without specialized mitigation filters!"
        },
        "lab_name": "DDoS Traffic Shaper & Rate Limiter"
    },
    20: {
        "id": 20,
        "title": "Zero-Day Vulnerabilities & Patching",
        "phase": "Phase 5: Advanced Defense & Cryptography",
        "analogy": "Discovering a secret crack in a castle wall before the castle builders even know it exists.",
        "lesson": (
            "What happens when a hacker discovers a brand new security flaw in Windows, iPhone, or Chrome that the software engineers have never seen before? This is called a **Zero-Day Vulnerability** because the developers have had *0 days* to fix it!\n\n"
            "When companies discover these flaws, their engineers work furiously to write a software update called a **Patch**. This is why your phone and laptop constantly prompt you to 'Update Now'—they are rushing to seal the cracks before hackers can climb through!"
        ),
        "quiz": {
            "question": "Why is it critical to install software updates (patches) on your phone and laptop as soon as they are released?",
            "options": [
                "Because updates make the battery heavier",
                "Software patches seal newly discovered security holes and Zero-Day vulnerabilities before hackers can exploit them to break in",
                "To delete your favorite photos",
                "Updates are only for changing the color of your app icons"
            ],
            "correct_idx": 1,
            "explanation": "Never hit 'Remind Me Tomorrow' for weeks on end! Timely patching is one of the most effective ways to secure any computer system against cyber attacks."
        },
        "lab_name": "Vulnerability Scanner & Patch Deployer"
    },
    21: {
        "id": 21,
        "title": "Incident Response & Cyber Forensics",
        "phase": "Phase 5: Advanced Defense & Cryptography",
        "analogy": "Crime scene detectives examining fingerprints, muddy shoeprints, and security camera tapes after a robbery.",
        "lesson": (
            "Even when a company has firewalls and passwords, breaches sometimes happen. When an alarm goes off, an elite team called **Incident Responders** jumps into action!\n\n"
            "How do they hunt the attacker? By analyzing **System Logs**. Every time a computer connects to a port, logs in, or opens a file, the operating system writes a timestamped note in a logbook. By chaining these log entries together, forensic investigators reconstruct the exact timeline of the intrusion to kick the hacker out and seal the breach!"
        ),
        "quiz": {
            "question": "Why are System Logs so valuable to cyber forensic investigators after a security breach?",
            "options": [
                "They can be printed out to make wallpaper for the office",
                "They provide a detailed, timestamped historical record of every login, file access, and network connection to trace how the attacker broke in",
                "They automatically recharge laptop batteries",
                "They prevent coffee from spilling on keyboards"
            ],
            "correct_idx": 1,
            "explanation": "Without logs, investigators would be flying blind! Centralized logging and SIEM tools allow security teams to trace the root cause of any cyber incident."
        },
        "lab_name": "System Log Timeline Analyzer"
    },
    22: {
        "id": 22,
        "title": "Capstone: The Grand Grid Defense!",
        "phase": "Phase 5: Advanced Defense & Cryptography",
        "analogy": "You are now the Chief Security Officer of a global digital metropolis! Apply all 21 layers of defense to protect the core.",
        "lesson": (
            "Congratulations! You have journeyed through the 5 phases of cybersecurity. You now understand that security isn't one silver bullet—it is **Defense in Depth** (building multiple overlapping layers of armor):\n\n"
            "1. **Perimeter Defense**: Firewalls, ports, and VPN tunnels.\n"
            "2. **Identity Armor**: Strong passwords, MFA tokens, and anti-phishing vigilance.\n"
            "3. **Endpoint Protection**: Antivirus sandboxes, malware detection, and offline backups.\n"
            "4. **Application Shielding**: SQL sanitization, XSS encoding, and patching Zero-Days.\n\n"
            "In this final capstone simulation, you will step into the Command Center and face a multi-layered cyber siege!"
        ),
        "quiz": {
            "question": "What does the cybersecurity principle of 'Defense in Depth' mean?",
            "options": [
                "Digging a deep basement under your computer desk",
                "Using multiple overlapping layers of security (firewalls + MFA + patching + backups) so that if one layer fails, the next layer stops the attacker",
                "Buying the most expensive antivirus software and turning off everything else",
                "Never turning your computer on"
            ],
            "correct_idx": 1,
            "explanation": "No single security tool is 100% perfect! Defense in depth ensures that an attacker must overcome multiple diverse barriers before reaching your data."
        },
        "lab_name": "Global Grid Defense Simulation"
    }
}

def get_curriculum_list():
    return [(mod_id, info["title"], info["phase"]) for mod_id, info in CURRICULUM.items()]
