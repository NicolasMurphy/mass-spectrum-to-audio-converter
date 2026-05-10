import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


# python -m pytest tests/ -v

# python -m pytest tests/ --cov=backend --cov-report=html
