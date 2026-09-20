import uuid
from sqlalchemy import Column, String, Integer, Double, Boolean, Date, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from geoalchemy2 import Geometry
from app.core.database import Base


class IssueCluster(Base):
    __tablename__ = "issue_clusters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    ward_id = Column(UUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(100), nullable=False)
    cluster_title_en = Column(String(200), nullable=True)
    cluster_title_hi = Column(String(200), nullable=True)
    cluster_geometry = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)
    centroid = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    report_count = Column(Integer, default=1, nullable=False)
    unresolved_count = Column(Integer, default=1, nullable=False)
    composite_risk_score = Column(Double, default=0.0, nullable=False)
    cluster_status = Column(String(50), default="active", nullable=False)
    first_reported_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    last_reported_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    score = Column(Double, nullable=False)
    score_grade = Column(String(20), nullable=True)
    components = Column(JSONB, nullable=False)
    formula_version = Column(String(50), default="v1.0", nullable=False)
    computed_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class PublicRecord(Base):
    __tablename__ = "public_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    record_type = Column(String(100), nullable=False)
    title_en = Column(String(300), nullable=False)
    title_hi = Column(String(300), nullable=False)
    reference_number = Column(String(100), nullable=True)
    content_summary_en = Column(String, nullable=True)
    content_summary_hi = Column(String, nullable=True)
    structured_data = Column(JSONB, default=dict)
    record_date = Column(Date, nullable=False)
    original_document_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class NewsMention(Base):
    __tablename__ = "news_mentions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    publication_name = Column(String(150), nullable=False)
    headline = Column(String(300), nullable=False)
    article_excerpt = Column(String, nullable=True)
    article_url = Column(String(500), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False)
    sentiment_label = Column(String(50), nullable=True)
    is_approved = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope_type = Column(String(50), nullable=False)
    scope_id = Column(UUID(as_uuid=True), nullable=False)
    language = Column(String(10), default="hi", nullable=False)
    model_provider = Column(String(50), default="sarvam_ai", nullable=False)
    model_name = Column(String(100), default="sarvam-2b", nullable=False)
    prompt_version = Column(String(50), default="v1.0", nullable=False)
    source_bundle = Column(JSONB, nullable=False)
    referenced_source_ids = Column(ARRAY(UUID(as_uuid=True)), default=list)
    report_content = Column(String, nullable=False)
    generation_duration_ms = Column(Integer, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    is_current = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    field_name = Column(String(100), nullable=False)
    source_language = Column(String(10), nullable=False)
    target_language = Column(String(10), nullable=False)
    source_text_hash = Column(String(64), nullable=False)
    translated_text = Column(String, nullable=False)
    model_name = Column(String(50), default="sarvam-translate")
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class SavedPlaceRoute(Base):
    __tablename__ = "saved_places_routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    item_type = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String, nullable=True)
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True)
    payload = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
