import unittest
from app.chunker import DocumentChunker

class MockPage:
    def __init__(self, page_number: int, text: str):
        self.page_number = page_number
        self.text = text

class TestDocumentChunker(unittest.TestCase):
    def test_chunker_basic(self):
        pages = [
            MockPage(page_number=1, text="This is page 1 content. It has some text for chunking."),
            MockPage(page_number=2, text="This is page 2 content. More enterprise details."),
        ]

        chunks = DocumentChunker.chunk_pages(pages, target_tokens=500)
        self.assertGreaterEqual(len(chunks), 1)
        self.assertEqual(chunks[0].page_start, 1)
        self.assertIn("page 1", chunks[0].chunk_text.lower())

if __name__ == "__main__":
    unittest.main()
