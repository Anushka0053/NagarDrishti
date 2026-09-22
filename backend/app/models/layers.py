import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class Sector(Base):
    __tablename__ = "sectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), nullable=False, unique=True)
    name_en = Column(String(100), nullable=False)
    name_hi = Column(String(100), nullable=False)
    icon = Column(String(50), default="layers")
    display_order = Column(Integer, default=0, nullable=False)
    color_hex = Column(String(10), default="#2563EB")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    layers = relationship("GISLayer", back_populates="sector")


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), nullable=False, unique=True)
    name_en = Column(String(200), nullable=False)
    name_hi = Column(String(200), nullable=False)
    short_name_en = Column(String(50), nullable=True)
    short_name_hi = Column(String(50), nullable=True)
    nodal_officer_name = Column(String(150), nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    portal_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    layers = relationship("GISLayer", back_populates="department")


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_key = Column(String(100), nullable=False, unique=True)
    name_en = Column(String(200), nullable=False)
    name_hi = Column(String(200), nullable=False)
    provider = Column(String(200), nullable=False)
    authority_level = Column(String(50), default="conditional_official", nullable=False)
    homepage_url = Column(String(255), nullable=True)
    api_docs_url = Column(String(255), nullable=True)
    service_endpoint_url = Column(String(255), nullable=True)
    access_type = Column(String(50), default="open_api")
    license_type = Column(String(100), default="Government Open Data (GODL-India)")
    attribution_text_en = Column(String(255), nullable=False)
    attribution_text_hi = Column(String(255), nullable=False)
    geographic_coverage = Column(String(100), default="Madhya Pradesh")
    expected_refresh_interval = Column(String(50), default="monthly")
    schema_version = Column(String(20), default="1.0")
    last_source_update = Column(DateTime(timezone=True), nullable=True)
    last_successful_sync = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(50), default="healthy")
    notes = Column(String, nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    layers = relationship("GISLayer", back_populates="source")


class GISLayer(Base):
    __tablename__ = "gis_layers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), nullable=False, unique=True)
    name_en = Column(String(200), nullable=False)
    name_hi = Column(String(200), nullable=False)
    description_en = Column(String, nullable=True)
    description_hi = Column(String, nullable=True)
    sector_id = Column(UUID(as_uuid=True), ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    geometry_type = Column(String(50), nullable=False)
    source_type = Column(String(50), default="internal_postgis", nullable=False)
    external_layer_name = Column(String(150), nullable=True)
    service_url_template = Column(String(500), nullable=True)
    city_ids = Column(ARRAY(UUID(as_uuid=True)), default=list)
    min_zoom = Column(Integer, default=0, nullable=False)
    max_zoom = Column(Integer, default=22, nullable=False)
    default_visibility = Column(Boolean, default=False, nullable=False)
    is_queryable = Column(Boolean, default=True, nullable=False)
    is_clusterable = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    style_config = Column(JSONB, default=dict, nullable=False)
    legend_config = Column(JSONB, default=dict, nullable=False)
    filter_config = Column(JSONB, default=dict)
    freshness_sla_days = Column(Integer, default=30)
    is_active = Column(Boolean, default=True, nullable=False)
    default_provenance = Column(String(50), default="official_verified", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    sector = relationship("Sector", back_populates="layers")
    department = relationship("Department", back_populates="layers")
    source = relationship("DataSource", back_populates="layers")
    features = relationship("GISFeature", back_populates="layer", cascade="all, delete-orphan")


class DataCoverage(Base):
    __tablename__ = "data_coverage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    layer_id = Column(UUID(as_uuid=True), ForeignKey("gis_layers.id", ondelete="CASCADE"), nullable=True)
    sector_id = Column(UUID(as_uuid=True), ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    coverage_status = Column(String(50), default="unavailable", nullable=False)
    feature_count = Column(Integer, default=0, nullable=False)
    geographic_coverage = Column(String(100), default="Municipal Area")
    temporal_coverage = Column(String(100), nullable=True)
    authority_level = Column(String(50), nullable=True)
    provenance_type = Column(String(50), default="official_verified", nullable=False)
    last_source_update = Column(DateTime(timezone=True), nullable=True)
    last_successful_sync = Column(DateTime(timezone=True), nullable=True)
    completeness_notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    layer = relationship("GISLayer")
    city = relationship("City")
    sector = relationship("Sector")
    source = relationship("DataSource")

