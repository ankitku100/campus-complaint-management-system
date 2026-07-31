# Backend

Express API for CampusCare. See the repository root `README.md` for configuration and run instructions.

The API uses MongoDB Atlas exclusively, seeds one fixed admin on startup, and rejects startup when `MONGODB_URI` is not an Atlas `mongodb+srv://` URI.
