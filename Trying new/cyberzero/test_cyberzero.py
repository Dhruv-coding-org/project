"""
Unit tests for CyberZero Academy engine and simulators.
"""
import unittest
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.curriculum import CURRICULUM
from engine.simulators import calculate_password_entropy, lookup_dns, get_phishing_emails, generate_totp
from engine.progress import get_rank_info, UserProfile, RANKS, BADGE_DEFINITIONS, save_profile, load_profile

class TestCurriculum(unittest.TestCase):
    def test_all_modules_present(self):
        self.assertEqual(len(CURRICULUM), 22, "Curriculum must have exactly 22 modules")
        for i in range(1, 23):
            self.assertIn(i, CURRICULUM, f"Module {i} must be defined")
            m = CURRICULUM[i]
            self.assertTrue(m.get("title"), f"Module {i} missing title")
            self.assertTrue(m.get("quiz"), f"Module {i} missing quiz")
            self.assertIn("question", m["quiz"], f"Module {i} quiz missing question")
            self.assertIn("correct_idx", m["quiz"], f"Module {i} quiz missing correct_idx")
            self.assertTrue(len(m["quiz"]["options"]) >= 2, f"Module {i} quiz must have options")

    def test_badges_cover_all_modules(self):
        for i in range(1, 23):
            self.assertIn(i, BADGE_DEFINITIONS, f"Badge {i} must be defined in BADGE_DEFINITIONS")

class TestSimulators(unittest.TestCase):
    def test_password_entropy(self):
        weak = calculate_password_entropy("123456")
        self.assertIn("Weak", weak["strength"])
        self.assertTrue(weak["score"] <= 30)

        strong = calculate_password_entropy("Cyb3r#Z3r0_Gtwy!2026")
        self.assertIn("Titanium", strong["strength"])
        self.assertEqual(strong["score"], 100)

    def test_dns_lookup(self):
        res = lookup_dns("google.com")
        self.assertEqual(res["domain"], "google.com")
        self.assertEqual(res["resolved_ip"], "142.250.190.46")

    def test_totp_generation(self):
        totp = generate_totp()
        self.assertEqual(len(totp["token"]), 6)
        self.assertTrue(totp["token"].isdigit())
        self.assertTrue(0 < totp["expires_in"] <= 30)

    def test_phishing_corpus(self):
        emails = get_phishing_emails()
        self.assertTrue(len(emails) >= 5)
        phishing_count = sum(1 for e in emails if e["is_phishing"])
        safe_count = sum(1 for e in emails if not e["is_phishing"])
        self.assertGreater(phishing_count, 0)
        self.assertGreater(safe_count, 0)

class TestProgressEngine(unittest.TestCase):
    def test_ranks_order(self):
        prev_xp = -1
        for xp, title in RANKS:
            self.assertGreater(xp, prev_xp, f"Rank {title} XP must be monotonically increasing")
            prev_xp = xp

    def test_rank_info_calculation(self):
        lvl, title = get_rank_info(0)
        self.assertEqual(lvl, 1)
        self.assertEqual(title, "Novice Cyber Scout")

        lvl22, title22 = get_rank_info(20000)
        self.assertEqual(lvl22, 22)
        self.assertEqual(title22, "Grandmaster Cyber Guardian")

    def test_atomic_profile_roundtrip(self):
        prof = load_profile()
        initial_theme = prof.theme
        prof.theme = "Matrix Green"
        save_profile(prof)

        reloaded = load_profile()
        self.assertEqual(reloaded.theme, "Matrix Green")
        
        # Restore original theme
        prof.theme = initial_theme
        save_profile(prof)

if __name__ == "__main__":
    unittest.main()
