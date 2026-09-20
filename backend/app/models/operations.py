import uuid
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from app.core.database import Base


class DatasetUpload(Base):
    __tablename__ = "dataset_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploader_id = Column(UUID(as_uuid=True), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    file_format = Column(String(50), nullable=False)
    storage_path = Column(String(500), nullable=False)
    detected_crs = Column(String(50), default="EPSG:4326")
    target_layer_id = Column(UUID(as_uuid=True), ForeignKey("gis_layers.id", ondelete="SET NULL"), nullable=True)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    validation_status = Column(String(50), default="pending", nullable=False)
    total_features = Column(Integer, default=0)
    valid_features = Column(Integer, default=0)
    rejected_features = Column(Integer, default=0)
    validation_errors = Column(JSONB, default=list)
    preview_sample = Column(JSONB, default=list)
    is_imported = Column(Boolean, default=False, nullable=False)
    imported_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False)
    run_type = Column(String(50), default="scheduled_sync")
    status = Column(String(50), default="pending", nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    records_fetched = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_quarantined = Column(Integer, default=0)
    schema_version_observed = Column(String(20), nullable=True)
    error_summary = Column(String, nullable=True)
    execution_metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID(as_uuid=True), nullable=True)
    actor_role = Column(String(50), default="guest")
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String, nullable=True)
    diff_before = Column(JSONB, nullable=True)
    diff_after = Column(JSONB, nullable=True)
    metadata_json = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
