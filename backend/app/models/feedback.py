import uuid
from sqlalchemy import Column, String, Integer, BigInteger, Double, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    role = Column(String(50), default="citizen", nullable=False)
    full_name = Column(String(150), nullable=True)
    phone_number = Column(String(20), nullable=True)
    preferred_language = Column(String(10), default="hi", nullable=False)
    preferred_city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    metadata_json = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_number = Column(String(30), unique=True, nullable=False)
    reporter_id = Column(UUID(as_uuid=True), nullable=True)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    ward_id = Column(UUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    locality_id = Column(UUID(as_uuid=True), ForeignKey("localities.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=True)
    title = Column(String(200), nullable=True)
    description = Column(String, nullable=False)
    normalized_text = Column(String, nullable=True)
    input_language = Column(String(10), default="hi")
    location_geometry = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    location_address = Column(String, nullable=True)
    severity_input = Column(String(20), default="medium")
    status = Column(String(50), default="submitted", nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=True, nullable=False)
    corroboration_count = Column(Integer, default=0, nullable=False)
    ai_metadata = Column(JSONB, default=dict, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    assigned_officer_name = Column(String(150), nullable=True)
    resolution_summary = Column(String, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    media = relationship("ReportMedia", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("ReportStatusHistory", back_populates="report", cascade="all, delete-orphan")
    evidence = relationship("ReportEvidence", back_populates="report", cascade="all, delete-orphan")


class ReportMedia(Base):
    __tablename__ = "report_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("citizen_reports.id", ondelete="CASCADE"), nullable=False)
    storage_path = Column(String(500), nullable=False)
    bucket_name = Column(String(100), default="report-media", nullable=False)
    media_type = Column(String(50), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=True)
    is_thumbnail = Column(Boolean, default=False)
    moderation_state = Column(String(50), default="pending")
    exif_metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    report = relationship("CitizenReport", back_populates="media")


class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("citizen_reports.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_user_id = Column(UUID(as_uuid=True), nullable=True)
    actor_role = Column(String(50), default="citizen")
    reason = Column(String(255), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    report = relationship("CitizenReport", back_populates="status_history")


class ReportEvidence(Base):
    __tablename__ = "report_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("citizen_reports.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    external_record_id = Column(String(150), nullable=True)
    title = Column(String(250), nullable=False)
    evidence_url = Column(String(500), nullable=True)
    confidence_score = Column(Double, default=1.0)
    evidence_details = Column(JSONB, default=dict)
    verified_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    report = relationship("CitizenReport", back_populates="evidence")


class ReportCorroboration(Base):
    __tablename__ = "report_corroborations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("citizen_reports.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    corroboration_type = Column(String(50), default="confirm_issue")
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class ModerationAction(Base):
    __tablename__ = "moderation_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("citizen_reports.id", ondelete="CASCADE"), nullable=False)
    moderator_id = Column(UUID(as_uuid=True), nullable=False)
    action_type = Column(String(50), nullable=False)
    justification = Column(String, nullable=False)
    metadata_json = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
