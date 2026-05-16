import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


# python -m pytest tests/ -v

# python -m pytest tests/ --cov=backend --cov-report=html
