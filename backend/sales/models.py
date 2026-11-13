"""Relational models for the Sales & Commercial Management Workspace (Horizon LC)."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class SalesQuote(Base, TimestampMixin):
    """Cotización comercial emitida a clientes o prospectos (#subview-comercial)."""
    __tablename__ = "sal_quotes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # Ej. COT-2026-0041
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_tax_id: Mapped[str] = mapped_column(String(30), nullable=False, default="99999999999999")
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    is_final_consumer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    valid_until: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="DRAFT")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    lines: Mapped[List["SalesQuoteLine"]] = relationship(
        "SalesQuoteLine",
        back_populates="quote",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class SalesQuoteLine(Base, TimestampMixin):
    """Línea de detalle de una cotización comercial con costo puesto en bodega (landed_cost)."""
    __tablename__ = "sal_quote_lines"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    quote_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sal_quotes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(60), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("1.00"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    landed_cost: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    tax_code: Mapped[str] = mapped_column(String(10), nullable=False, default="2")  # '1'=Exento, '2'=15%

    quote: Mapped["SalesQuote"] = relationship("SalesQuote", back_populates="lines")


class CommercialOffer(Base, TimestampMixin):
    """Oferta comercial, combo o paquete promocional con control de margen (#panel-mode-offers)."""
    __tablename__ = "sal_commercial_offers"

    code: Mapped[str] = mapped_column(String(50), primary_key=True)  # Ej. COMBO-PRO-01
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVA")
    valid_until: Mapped[str] = mapped_column(String(20), nullable=False)
    price_regular: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    price_promo: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    cost_total: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))

    items: Mapped[List["CommercialOfferItem"]] = relationship(
        "CommercialOfferItem",
        back_populates="offer",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class CommercialOfferItem(Base, TimestampMixin):
    """Sub-ítem componente de un combo/oferta para rebaja atómica de inventario al facturar."""
    __tablename__ = "sal_commercial_offer_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    offer_code: Mapped[str] = mapped_column(
        String(50), ForeignKey("sal_commercial_offers.code", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(60), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("1.00"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    cost: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    tax_code: Mapped[str] = mapped_column(String(10), nullable=False, default="2")

    offer: Mapped["CommercialOffer"] = relationship("CommercialOffer", back_populates="items")


class TablePreOrder(Base, TimestampMixin):
    """Pre-orden abierta en piso, mesa o atención en mostrador (#panel-mode-preordenes)."""
    __tablename__ = "sal_table_preorders"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # Ej. PRE-MESA-04
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    table_label: Mapped[str] = mapped_column(String(255), nullable=False)
    pax: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    waiter: Mapped[str] = mapped_column(String(150), nullable=False, default="Daniel Alonso")
    opened_at: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False, default="CONSUMIDOR FINAL")
    customer_tax_id: Mapped[str] = mapped_column(String(30), nullable=False, default="99999999999999")
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    is_final_consumer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    close_justification: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="OPEN")  # OPEN | INVOICED | CANCELLED

    lines: Mapped[List["TablePreOrderLine"]] = relationship(
        "TablePreOrderLine",
        back_populates="preorder",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class TablePreOrderLine(Base, TimestampMixin):
    """Ítems de comanda o consumo cargados a una pre-orden."""
    __tablename__ = "sal_table_preorder_lines"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    preorder_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sal_table_preorders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(60), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("1.00"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    cost: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    tax_code: Mapped[str] = mapped_column(String(10), nullable=False, default="2")

    preorder: Mapped["TablePreOrder"] = relationship("TablePreOrder", back_populates="lines")


class Reservation(Base, TimestampMixin):
    """Agenda de reservaciones de eventos, salones o lotes de inventario (#panel-mode-reservas)."""
    __tablename__ = "sal_reservations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)  # Ej. RES-2026-0012
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    event_date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_tax_id: Mapped[str] = mapped_column(String(30), nullable=False, default="99999999999999")
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    is_final_consumer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ACTIVE")  # ACTIVE | INVOICED | CANCELLED

    items: Mapped[List["ReservationItem"]] = relationship(
        "ReservationItem",
        back_populates="reservation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    movements: Mapped[List["ReservationMovement"]] = relationship(
        "ReservationMovement",
        back_populates="reservation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ReservationItem(Base, TimestampMixin):
    """Producto o servicio incluido dentro de una reservación."""
    __tablename__ = "sal_reservation_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reservation_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sal_reservations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(60), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("1.00"))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    cost: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    tax_code: Mapped[str] = mapped_column(String(10), nullable=False, default="2")

    reservation: Mapped["Reservation"] = relationship("Reservation", back_populates="items")


class ReservationMovement(Base, TimestampMixin):
    """Movimiento financiero de la reserva (CHARGE de apertura/adición o PAYMENT de anticipo)."""
    __tablename__ = "sal_reservation_movements"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    reservation_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("sal_reservations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    movement_date: Mapped[str] = mapped_column(String(20), nullable=False)
    concept: Mapped[str] = mapped_column(String(255), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)  # CHARGE | PAYMENT
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    journal_entry_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)

    reservation: Mapped["Reservation"] = relationship("Reservation", back_populates="movements")


class SalesFiscalDocument(Base, TimestampMixin):
    """Comprobante fiscal SAR emitido desde el Workspace de Ventas (01 Factura, 06 NC, 05 ND, ANULADA)."""
    __tablename__ = "sal_fiscal_documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)
    document_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    doc_type_code: Mapped[str] = mapped_column(String(10), nullable=False, default="01")  # '01', '06', '05'
    emission_point: Mapped[str] = mapped_column(String(20), nullable=False, default="001-004")
    cai: Mapped[str] = mapped_column(String(100), nullable=False)
    cai_deadline: Mapped[str] = mapped_column(String(20), nullable=False, default="31/12/2027")
    issue_date: Mapped[str] = mapped_column(String(20), nullable=False)
    due_date: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_tax_id: Mapped[str] = mapped_column(String(30), nullable=False)
    sale_condition: Mapped[str] = mapped_column(String(20), nullable=False, default="CONTADO")
    source_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    affected_invoice_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    salesperson: Mapped[str] = mapped_column(String(150), nullable=False, default="Daniel Alonso")
    subtotal_exempt: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    subtotal_grav15: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    subtotal_grav18: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    isv15: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    isv18: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    total_cost: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    balance_due: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=Decimal("0.00"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="VIGENTE")  # VIGENTE | ANULADA
    void_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    journal_entry_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True)
    items_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    payments_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
