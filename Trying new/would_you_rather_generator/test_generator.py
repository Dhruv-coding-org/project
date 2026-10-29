"""
Unit tests for Would You Rather video generator and question database.
"""
import unittest
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

class TestQuestionDatabase(unittest.TestCase):
    def setUp(self):
        self.qpath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "questions.json")
        with open(self.qpath, "r", encoding="utf-8") as f:
            self.questions = json.load(f)

    def test_corpus_size(self):
        self.assertGreaterEqual(len(self.questions), 10, "Corpus must have at least 10 questions to avoid repetitive outputs")

    def test_question_schema(self):
        seen_ids = set()
        for q in self.questions:
            qid = q.get("id")
            self.assertIsNotNone(qid, "Question missing id")
            self.assertNotIn(qid, seen_ids, f"Duplicate question ID {qid}")
            seen_ids.add(qid)

            self.assertTrue(q.get("option_a"), f"Question {qid} missing option_a")
            self.assertTrue(q.get("option_b"), f"Question {qid} missing option_b")
            self.assertIsInstance(q.get("percentage_a"), int)
            self.assertIsInstance(q.get("percentage_b"), int)
            self.assertEqual(q["percentage_a"] + q["percentage_b"], 100, f"Percentages in Q{qid} must sum to 100")

class TestAssetsManager(unittest.TestCase):
    def test_assets_paths(self):
        import assets_manager
        assets = assets_manager.setup_assets()
        self.assertIn("font", assets)
        self.assertIn("ding", assets)
        self.assertIn("tick", assets)

if __name__ == "__main__":
    unittest.main()
