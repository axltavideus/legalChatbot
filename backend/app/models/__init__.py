"""Package init — import all models so SQLAlchemy discovers them for Base.metadata.create_all."""
from app.models.user import User, UserRole
from app.models.regulation import Regulation, RegulationType, RegulationStatus, HIERARCHY_LEVEL
from app.models.pasal_chunk import PasalChunk, ChunkStatus
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.models.folder import Folder
from app.models.saved_item import SavedItem
from app.models.feedback import Feedback, FeedbackType, FeedbackReason, FeedbackStatus

__all__ = [
    "User", "UserRole",
    "Regulation", "RegulationType", "RegulationStatus", "HIERARCHY_LEVEL",
    "PasalChunk", "ChunkStatus",
    "Conversation",
    "Message", "MessageRole",
    "Folder",
    "SavedItem",
    "Feedback", "FeedbackType", "FeedbackReason", "FeedbackStatus",
]

