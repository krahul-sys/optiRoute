from __future__ import annotations

from pydantic import BaseModel, Field


class WarehouseIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    x_coord: float
    y_coord: float
    capacity_kg: float = Field(default=1000, gt=0)


class RouteIn(BaseModel):
    source_id: int
    dest_id: int
    distance_km: float = Field(gt=0)


class PackageIn(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    description: str | None = None
    weight_kg: float = Field(gt=0)
    declared_value: float = Field(ge=0)
    priority: int = Field(ge=1, le=5)
    warehouse_id: int | None = None


class StatusIn(BaseModel):
    status: str


class RouteOptimizeIn(BaseModel):
    source_id: int
    target_id: int


class SortIn(BaseModel):
    algorithm: str = "quicksort"
    rows: list[dict] | None = None


class HuffmanIn(BaseModel):
    text: str
