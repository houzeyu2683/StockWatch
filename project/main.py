import logging
from dotenv import load_dotenv
import uvicorn
from api import app

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Launching API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)