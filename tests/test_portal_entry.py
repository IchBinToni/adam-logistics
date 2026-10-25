"""Dependency-free checks for the public portal link; no live requests or logins."""

from html.parser import HTMLParser
from pathlib import Path
import unittest


class HeroLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_actions = False
        self.links = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "div" and "hero-actions" in attributes.get("class", "").split():
            self.in_actions = True
        if self.in_actions and tag == "a":
            self.current = {**attributes, "text": ""}

    def handle_data(self, data):
        if self.current is not None:
            self.current["text"] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.current is not None:
            self.links.append(self.current)
            self.current = None
        if tag == "div" and self.in_actions:
            self.in_actions = False


class PortalEntryTests(unittest.TestCase):
    def test_hero_keeps_existing_actions_and_adds_exact_https_login(self):
        parser = HeroLinks()
        parser.feed((Path(__file__).resolve().parents[1] / "index.html").read_text(encoding="utf-8-sig"))
        self.assertEqual([link["href"] for link in parser.links], [
            "logistik.html", "verleih.html",
            "https://portal.adam-logistics.de/kundenportal/anmelden/",
        ])
        self.assertEqual(parser.links[-1]["text"], "KUNDENPORTAL")
        self.assertTrue(all(link["class"] == "btn btn-primary" for link in parser.links))
        self.assertTrue(all("target" not in link for link in parser.links))


if __name__ == "__main__":
    unittest.main()
