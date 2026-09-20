import uuid
from sqlalchemy import Column, String, Integer, Double, Boolean, Date, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


class AdminUnit(Base):
    __tablename__ = "admin_units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("admin_units.id", ondelete="SET NULL"), nullable=True)
    unit_type = Column(String(50), nullable=False)
    name_en = Column(String(200), nullable=False)
    name_hi = Column(String(200), nullable=False)
    slug = Column(String(250), nullable=False, unique=True)
    lgd_code = Column(String(50), nullable=True)
    census_code = Column(String(50), nullable=True)
    state_code = Column(String(10), default="MP")
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True)
    centroid = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    metadata_json = Column("metadata", JSONB, default=dict)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    children = relationship("AdminUnit", backref="parent", remote_side=[id])


class City(Base):
    __tablename__ = "cities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_unit_id = Column(UUID(as_uuid=True), ForeignKey("admin_units.id", ondelete="RESTRICT"), nullable=True)
    district_id = Column(UUID(as_uuid=True), ForeignKey("admin_units.id", ondelete="SET NULL"), nullable=True)
    name_en = Column(String(150), nullable=False)
    name_hi = Column(String(150), nullable=False)
    slug = Column(String(150), nullable=False, unique=True)
    ulb_type = Column(String(50), default="nagar_nigam", nullable=False)
    lgd_code = Column(String(50), nullable=True)
    center_latitude = Column(Double, nullable=False)
    center_longitude = Column(Double, nullable=False)
    default_zoom = Column(Integer, default=12, nullable=False)
    min_zoom = Column(Integer, default=9, nullable=False)
    max_zoom = Column(Integer, default=19, nullable=False)
    bbox_southwest = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    bbox_northeast = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    boundary_geometry = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True)
    population_census = Column(Integer, nullable=True)
    area_sq_km = Column(Double, nullable=True)
    is_reference_city = Column(Boolean, default=False, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    settings = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    wards = relationship("Ward", back_populates="city", cascade="all, delete-orphan")


class Ward(Base):
    __tablename__ = "wards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    admin_unit_id = Column(UUID(as_uuid=True), ForeignKey("admin_units.id", ondelete="SET NULL"), nullable=True)
    ward_number = Column(Integer, nullable=False)
    ward_code = Column(String(50), nullable=True)
    name_en = Column(String(150), nullable=False)
    name_hi = Column(String(150), nullable=False)
    zone_number = Column(Integer, nullable=True)
    zone_name_en = Column(String(100), nullable=True)
    zone_name_hi = Column(String(100), nullable=True)
    corporator_name = Column(String(150), nullable=True)
    corporator_contact = Column(String(50), nullable=True)
    sanitation_inspector_contact = Column(String(50), nullable=True)
    population = Column(Integer, nullable=True)
    area_sq_km = Column(Double, nullable=True)
    geometry = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    centroid = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    properties = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    city = relationship("City", back_populates="wards")


class Locality(Base):
    __tablename__ = "localities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id = Column(UUID(as_uuid=True), ForeignKey("cities.id", ondelete="CASCADE"), nullable=True)
    ward_id = Column(UUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True)
    admin_unit_id = Column(UUID(as_uuid=True), ForeignKey("admin_units.id", ondelete="SET NULL"), nullable=True)
    name_en = Column(String(150), nullable=False)
    name_hi = Column(String(150), nullable=False)
    pincode = Column(String(10), nullable=True)
    locality_type = Column(String(50), default="mohalla")
    geometry = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True)
    centroid = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    properties = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
