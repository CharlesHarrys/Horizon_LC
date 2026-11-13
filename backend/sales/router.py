"""FastAPI Router and Business Logic for the Sales & Commercial Management Workspace."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.accounting import (
    Account,
    AccountNature,
    AccountType,
    FiscalPeriod,
    JournalEntry,
    JournalEntryLine,
)
from app.models.inventory import Item, KardexMovement, StockLevel, Warehouse
from app.models.sales import Customer, SalesCaiRange
from app.models.system import Company
from sales.models import (
    CommercialOffer,
    CommercialOfferItem,
    Reservation,
    ReservationItem,
    ReservationMovement,
    SalesFiscalDocument,
    SalesQuote,
    SalesQuoteLine,
    TablePreOrder,
    TablePreOrderLine,
)

sales_ws_router = APIRouter(tags=["Sales & Commercial Workspace Integration"])


# =============================================================================
# 1. DEFAULT MASTER CONFIG & SEEDING
# =============================================================================
DEFAULT_SAR_POINTS_CONFIG: Dict[str, Any] = {
    "001-004": {
        "sucursal": "Sucursal Principal - Caja 04",
        "01": {"cai": "7A4B2C-9D1E8F-4A5B6C-7D8E9F-0A1B2C-3D", "fecha_limite": "31/12/2027", "inicio": 1, "fin": 50000, "actual": 45231},
        "06": {"cai": "9C8B7A-6F5E4D-3C2B1A-0F9E8D-7C6B5A-11", "fecha_limite": "31/12/2027", "inicio": 1, "fin": 5000, "actual": 142},
        "05": {"cai": "3F2E1D-9A8B7C-6D5E4F-1A2B3C-4D5E6F-88", "fecha_limite": "31/12/2027", "inicio": 1, "fin": 2000, "actual": 28},
    },
    "001-001": {
        "sucursal": "Mostrador Central TGU - Caja 01",
        "01": {"cai": "1A2B3C-4D5E6F-7A8B9C-0D1E2F-3A4B5C-99", "fecha_limite": "30/06/2027", "inicio": 1, "fin": 25000, "actual": 12040},
        "06": {"cai": "6A5B4C-3D2E1F-9A8B7C-6D5E4F-1A2B3C-22", "fecha_limite": "30/06/2027", "inicio": 1, "fin": 3000, "actual": 85},
        "05": {"cai": "8E7D6C-5B4A3F-2E1D0C-9B8A7F-6E5D4C-44", "fecha_limite": "30/06/2027", "inicio": 1, "fin": 1000, "actual": 12},
    },
    "002-001": {
        "sucursal": "Sucursal San Pedro Sula - Caja 01",
        "01": {"cai": "4F5E6D-7C8B9A-1F2E3D-4C5B6A-7F8E9D-55", "fecha_limite": "31/10/2027", "inicio": 1, "fin": 40000, "actual": 8410},
        "06": {"cai": "2D3E4F-5A6B7C-8D9E0F-1A2B3C-4D5E6F-66", "fecha_limite": "31/10/2027", "inicio": 1, "fin": 2000, "actual": 19},
        "05": {"cai": "7B6A5C-4D3E2F-1A0B9C-8D7E6F-5A4B3C-77", "fecha_limite": "31/10/2027", "inicio": 1, "fin": 1000, "actual": 5},
    },
}

# Runtime mutable state for SAR correlatives backed by DB
SAR_RUNTIME_STATE: Dict[str, Any] = {
    k: {
        "sucursal": v["sucursal"],
        "01": dict(v["01"]),
        "06": dict(v["06"]),
        "05": dict(v["05"]),
    }
    for k, v in DEFAULT_SAR_POINTS_CONFIG.items()
}

DEFAULT_CUSTOMERS = {
    "CONSUMIDOR FINAL": {"tax_id": "99999999999999", "name": "CONSUMIDOR FINAL", "credit_limit": 0.0, "is_final_consumer": True},
    "INVERSIONES GLOBALES S. DE R.L.": {"tax_id": "08011990887766", "name": "INVERSIONES GLOBALES S. DE R.L.", "credit_limit": 100000.0, "is_final_consumer": False},
    "CONSTRUCCIONES MODERNAS S.A.": {"tax_id": "08011995112233", "name": "CONSTRUCCIONES MODERNAS S.A.", "credit_limit": 80000.0, "is_final_consumer": False},
    "COMERCIAL DEL VALLE S.A.": {"tax_id": "05011989445566", "name": "COMERCIAL DEL VALLE S.A.", "credit_limit": 50000.0, "is_final_consumer": False},
    "FERRETERÍA LARACH & CÍA S. DE R.L.": {"tax_id": "08011970123456", "name": "FERRETERÍA LARACH & CÍA S. DE R.L.", "credit_limit": 150000.0, "is_final_consumer": False},
    "DISTRIBUIDORA CUMMINS CENTROAMÉRICA HONDURAS": {"tax_id": "05011985223344", "name": "DISTRIBUIDORA CUMMINS CENTROAMÉRICA HONDURAS", "credit_limit": 200000.0, "is_final_consumer": False},
}

DEFAULT_CATALOG_PRODUCTS = {
    "SKU-001": {"code": "SKU-001", "name": "Laptop Dell Inspiron 15 (Core i5, 16GB)", "price": 18500.00, "cost": 14200.00, "landed_cost": 14200.00, "tax_code": "2"},
    "SKU-002": {"code": "SKU-002", "name": "Monitor LG UltraWide 29\" IPS", "price": 6200.00, "cost": 4600.00, "landed_cost": 4600.00, "tax_code": "2"},
    "SKU-003": {"code": "SKU-003", "name": "Teclado Mecánico RGB Redragon", "price": 1250.00, "cost": 850.00, "landed_cost": 850.00, "tax_code": "2"},
    "SKU-004": {"code": "SKU-004", "name": "Licencia Microsoft Office 365", "price": 2100.00, "cost": 1600.00, "landed_cost": 1600.00, "tax_code": "1"},
    "MENU-001": {"code": "MENU-001", "name": "Plato Ejecutivo / Servicio Mesa", "price": 380.00, "cost": 165.00, "landed_cost": 165.00, "tax_code": "2"},
    "MENU-002": {"code": "MENU-002", "name": "Bebida Natural / Café Especial", "price": 95.00, "cost": 35.00, "landed_cost": 35.00, "tax_code": "2"},
    "SERV-001": {"code": "SERV-001", "name": "Reserva Salón / Paquete Evento Corporativo", "price": 12500.00, "cost": 5200.00, "landed_cost": 5200.00, "tax_code": "2"},
}


def ensure_sales_workspace_seed(db: Session) -> Company:
    """Seeds default quotes, offers, preorders, reservations, inventory items, and CxC documents if empty."""
    company = db.scalar(select(Company).limit(1))
    if not company:
        company = Company(
            id=uuid.uuid4(),
            tax_id="08011990123456",
            legal_name="SOLUTIONS & APPLIANCES S.A.",
            trade_name="SOLUTIONS & APPLIANCES",
            operational_level=3,
            country_code="HND",
            currency_code="HNL",
            fiscal_year_start_month=1,
            is_active=True,
        )
        db.add(company)
        db.flush()

    # Ensure required accounting accounts exist
    required_accounts = [
        ("1.1.01.01.01", "Caja General / POS", AccountType.ASSET, AccountNature.DEBIT, 5),
        ("1.1.01.01.02", "Cheques y Valores en Caja", AccountType.ASSET, AccountNature.DEBIT, 5),
        ("1.1.01.02.01", "Banco Atlántida HNL", AccountType.ASSET, AccountNature.DEBIT, 5),
        ("1.1.01.02.02", "BAC Credomatic POS / HNL", AccountType.ASSET, AccountNature.DEBIT, 5),
        ("1.1.01.04.01", "Billetera Activos Digitales (USDT/BTC)", AccountType.ASSET, AccountNature.DEBIT, 5),
        ("1.1.02.01.01", "Clientes Nacionales CxC", AccountType.ASSET, AccountNature.DEBIT, 5),
        ("1.1.05.01", "Inventario de Mercaderías", AccountType.ASSET, AccountNature.DEBIT, 4),
        ("2.1.02.01", "ISV Débito Fiscal 15%", AccountType.LIABILITY, AccountNature.CREDIT, 4),
        ("2.1.05.01", "Anticipos de Clientes", AccountType.LIABILITY, AccountNature.CREDIT, 4),
        ("4.1.01.01", "Venta de Mercaderías", AccountType.REVENUE, AccountNature.CREDIT, 4),
        ("4.1.02.05", "Ingresos por Recargos / Nota Débito", AccountType.REVENUE, AccountNature.CREDIT, 4),
        ("4.1.03.01", "Devoluciones y Rebajas s/Ventas", AccountType.REVENUE, AccountNature.DEBIT, 4),
        ("5.1.01.01", "Costo de Ventas", AccountType.COST, AccountNature.DEBIT, 4),
    ]
    existing_codes = {
        a.code: a
        for a in db.scalars(select(Account).where(Account.company_id == company.id)).all()
    }
    for code, name, acc_type, nature, level in required_accounts:
        if code not in existing_codes:
            acc = Account(
                company_id=company.id,
                code=code,
                name=name,
                account_type=acc_type,
                nature=nature,
                level=level,
                is_postable=True,
                currency_code="HNL",
                is_active=True,
            )
            db.add(acc)
            existing_codes[code] = acc
    db.flush()

    # Ensure default Warehouse and Catalog Items in Inventory
    wh = db.scalar(select(Warehouse).where(Warehouse.company_id == company.id).limit(1))
    if not wh:
        wh = Warehouse(
            id=uuid.uuid4(),
            company_id=company.id,
            code="BOD-CENTRAL-01",
            name="Bodega Central Tegucigalpa",
            location="Tegucigalpa, F.M.",
            is_active=True,
            warehouse_type="MAIN",
            responsible_name="Jefe de Almacén",
        )
        db.add(wh)
        db.flush()

    inv_acc = existing_codes["1.1.05.01"]
    cogs_acc = existing_codes["5.1.01.01"]
    rev_acc = existing_codes["4.1.01.01"]

    existing_skus = {
        it.sku: it
        for it in db.scalars(select(Item).where(Item.company_id == company.id)).all()
    }
    for sku, pdata in DEFAULT_CATALOG_PRODUCTS.items():
        if sku not in existing_skus:
            is_srv = sku.startswith("SERV") or sku == "SKU-004"
            item_obj = Item(
                id=uuid.uuid4(),
                company_id=company.id,
                sku=sku,
                name=pdata["name"],
                description=pdata["name"],
                unit_of_measure="UND",
                item_type="PRODUCT",
                inventory_account_id=inv_acc.id,
                cogs_account_id=cogs_acc.id,
                revenue_account_id=rev_acc.id,
                reorder_point=Decimal("5.00"),
                is_active=True,
                purchase_uom="UND",
                production_uom="UND",
                purchase_to_base_factor=Decimal("1.0"),
                base_to_production_factor=Decimal("1.0"),
                default_isv_type="EXEMPT" if pdata["tax_code"] == "1" else "ISV_15",
                dai_percent=Decimal("0.00"),
                unit_weight_kg=Decimal("1.00"),
                unit_volume_cbm=Decimal("0.01"),
                requires_lot_tracking=False,
                requires_expiry_date=False,
                custom_values={"unit_price": pdata["price"], "landed_cost": pdata["cost"], "tax_code": pdata["tax_code"]},
            )
            db.add(item_obj)
            db.flush()
            existing_skus[sku] = item_obj

            stock = StockLevel(
                id=uuid.uuid4(),
                company_id=company.id,
                warehouse_id=wh.id,
                item_id=item_obj.id,
                current_stock=Decimal("100.00"),
                average_unit_cost=Decimal(str(pdata["cost"])),
                total_valuation=Decimal(str(pdata["cost"] * 100)),
                reserved_stock=Decimal("0.00"),
                available_stock=Decimal("100.00"),
            )
            db.add(stock)

    # Seed Quotes if empty
    if not db.scalar(select(SalesQuote).limit(1)):
        q1 = SalesQuote(
            id="COT-2026-0041",
            company_id=company.id,
            customer_name="INVERSIONES GLOBALES S. DE R.L.",
            customer_tax_id="08011990887766",
            credit_limit=Decimal("100000.00"),
            is_final_consumer=False,
            valid_until="2026-11-15",
            status="SENT",
            lines=[
                SalesQuoteLine(code="SKU-001", name="Laptop Dell Inspiron 15 (Core i5, 16GB)", quantity=Decimal("2"), unit_price=Decimal("18500.00"), landed_cost=Decimal("14200.00"), tax_code="2"),
                SalesQuoteLine(code="SKU-002", name="Monitor LG UltraWide 29\" IPS", quantity=Decimal("2"), unit_price=Decimal("6200.00"), landed_cost=Decimal("4600.00"), tax_code="2"),
            ],
        )
        q2 = SalesQuote(
            id="COT-2026-0042",
            company_id=company.id,
            customer_name="CONSTRUCCIONES MODERNAS S.A.",
            customer_tax_id="08011995112233",
            credit_limit=Decimal("80000.00"),
            is_final_consumer=False,
            valid_until="2026-11-12",
            status="DRAFT",
            lines=[
                SalesQuoteLine(code="SKU-003", name="Teclado Mecánico RGB Redragon", quantity=Decimal("5"), unit_price=Decimal("1250.00"), landed_cost=Decimal("850.00"), tax_code="2"),
            ],
        )
        db.add_all([q1, q2])

    # Seed Commercial Offers if empty
    if not db.scalar(select(CommercialOffer).limit(1)):
        off1 = CommercialOffer(
            code="COMBO-PRO-01",
            company_id=company.id,
            name="Combo Oficina Plus (Laptop + Monitor)",
            status="ACTIVA",
            valid_until="2026-11-30",
            price_regular=Decimal("24700.00"),
            price_promo=Decimal("21999.00"),
            cost_total=Decimal("18800.00"),
            items=[
                CommercialOfferItem(code="SKU-001", name="Laptop Dell Inspiron 15 (Core i5, 16GB)", quantity=Decimal("1"), unit_price=Decimal("18500.00"), cost=Decimal("14200.00"), tax_code="2"),
                CommercialOfferItem(code="SKU-002", name="Monitor LG UltraWide 29\" IPS", quantity=Decimal("1"), unit_price=Decimal("6200.00"), cost=Decimal("4600.00"), tax_code="2"),
            ],
        )
        off2 = CommercialOffer(
            code="COMBO-GAMER",
            company_id=company.id,
            name="Kit Gamer Starter (Teclado RGB + Monitor)",
            status="ACTIVA",
            valid_until="2026-11-28",
            price_regular=Decimal("7450.00"),
            price_promo=Decimal("6499.00"),
            cost_total=Decimal("5450.00"),
            items=[
                CommercialOfferItem(code="SKU-003", name="Teclado Mecánico RGB Redragon", quantity=Decimal("1"), unit_price=Decimal("1250.00"), cost=Decimal("850.00"), tax_code="2"),
                CommercialOfferItem(code="SKU-002", name="Monitor LG UltraWide 29\" IPS", quantity=Decimal("1"), unit_price=Decimal("6200.00"), cost=Decimal("4600.00"), tax_code="2"),
            ],
        )
        off3 = CommercialOffer(
            code="PROMO-MESA-CORP",
            company_id=company.id,
            name="Paquete Almuerzo Ejecutivo x10 PAX",
            status="ACTIVA",
            valid_until="2026-12-15",
            price_regular=Decimal("4750.00"),
            price_promo=Decimal("3990.00"),
            cost_total=Decimal("2000.00"),
            items=[
                CommercialOfferItem(code="MENU-001", name="Plato Ejecutivo / Servicio Mesa", quantity=Decimal("10"), unit_price=Decimal("380.00"), cost=Decimal("165.00"), tax_code="2"),
                CommercialOfferItem(code="MENU-002", name="Bebida Natural / Café Especial", quantity=Decimal("10"), unit_price=Decimal("95.00"), cost=Decimal("35.00"), tax_code="2"),
            ],
        )
        db.add_all([off1, off2, off3])

    # Seed Table PreOrders if empty
    if not db.scalar(select(TablePreOrder).limit(1)):
        p1 = TablePreOrder(
            id="PRE-MESA-04",
            company_id=company.id,
            table_label="MESA 04 - TERRAZA PRINCIPAL",
            pax=6,
            waiter="Daniel Alonso",
            opened_at="14:20",
            customer_name="CONSUMIDOR FINAL",
            customer_tax_id="99999999999999",
            credit_limit=Decimal("0.00"),
            is_final_consumer=True,
            close_justification="",
            status="OPEN",
            lines=[
                TablePreOrderLine(code="MENU-001", name="Plato Ejecutivo / Servicio Mesa", quantity=Decimal("6"), unit_price=Decimal("380.00"), cost=Decimal("165.00"), tax_code="2"),
                TablePreOrderLine(code="MENU-002", name="Bebida Natural / Café Especial", quantity=Decimal("6"), unit_price=Decimal("95.00"), cost=Decimal("35.00"), tax_code="2"),
            ],
        )
        p2 = TablePreOrder(
            id="PRE-VIP-01",
            company_id=company.id,
            table_label="SALÓN VIP 01 - GRUPO EJECUTIVO",
            pax=10,
            waiter="Arsenio Córdova",
            opened_at="13:45",
            customer_name="INVERSIONES GLOBALES S. DE R.L.",
            customer_tax_id="08011990887766",
            credit_limit=Decimal("100000.00"),
            is_final_consumer=False,
            close_justification="Grupo corporativo en reunión extendida autorizada por gerencia",
            status="OPEN",
            lines=[
                TablePreOrderLine(code="MENU-001", name="Plato Ejecutivo / Servicio Mesa", quantity=Decimal("10"), unit_price=Decimal("380.00"), cost=Decimal("165.00"), tax_code="2"),
                TablePreOrderLine(code="SKU-004", name="Servicio Proyección & Audio Sala", quantity=Decimal("1"), unit_price=Decimal("2100.00"), cost=Decimal("500.00"), tax_code="1"),
            ],
        )
        p3 = TablePreOrder(
            id="PRE-MOSTR-09",
            company_id=company.id,
            table_label="MOSTRADOR / PEDIDO EN ESPERA #09",
            pax=2,
            waiter="Daniel Alonso",
            opened_at="15:10",
            customer_name="COMERCIAL DEL VALLE S.A.",
            customer_tax_id="05011989445566",
            credit_limit=Decimal("50000.00"),
            is_final_consumer=False,
            close_justification="",
            status="OPEN",
            lines=[
                TablePreOrderLine(code="SKU-002", name="Monitor LG UltraWide 29\" IPS", quantity=Decimal("1"), unit_price=Decimal("6200.00"), cost=Decimal("4600.00"), tax_code="2"),
            ],
        )
        db.add_all([p1, p2, p3])

    # Seed Reservations if empty
    if not db.scalar(select(Reservation).limit(1)):
        r1 = Reservation(
            id="RES-2026-0012",
            company_id=company.id,
            event_date="2026-11-15",
            title="Evento Corporativo & Equipamiento Sala",
            customer_name="INVERSIONES GLOBALES S. DE R.L.",
            customer_tax_id="08011990887766",
            credit_limit=Decimal("100000.00"),
            is_final_consumer=False,
            status="ACTIVE",
            items=[
                ReservationItem(code="SERV-001", name="Reserva Salón / Paquete Evento Corporativo", quantity=Decimal("1"), unit_price=Decimal("12500.00"), cost=Decimal("5200.00"), tax_code="2"),
                ReservationItem(code="MENU-001", name="Plato Ejecutivo / Servicio Mesa (20 PAX)", quantity=Decimal("20"), unit_price=Decimal("380.00"), cost=Decimal("165.00"), tax_code="2"),
            ],
            movements=[
                ReservationMovement(movement_date="2026-11-02", concept="Apertura de Reserva (Cargo Inicial ISV inc.)", movement_type="CHARGE", amount=Decimal("23115.00")),
                ReservationMovement(movement_date="2026-11-02", concept="Anticipo #1 - Transferencia BAC #884120", movement_type="PAYMENT", amount=Decimal("10000.00")),
                ReservationMovement(movement_date="2026-11-08", concept="Anticipo #2 - Depósito Atlántida #110492", movement_type="PAYMENT", amount=Decimal("5000.00")),
            ],
        )
        r2 = Reservation(
            id="RES-2026-0015",
            company_id=company.id,
            event_date="2026-11-18",
            title="Reserva Lote Equipos Cómputo & Instalación",
            customer_name="CONSTRUCCIONES MODERNAS S.A.",
            customer_tax_id="08011995112233",
            credit_limit=Decimal("80000.00"),
            is_final_consumer=False,
            status="ACTIVE",
            items=[
                ReservationItem(code="SKU-001", name="Laptop Dell Inspiron 15 (Core i5, 16GB)", quantity=Decimal("3"), unit_price=Decimal("18500.00"), cost=Decimal("14200.00"), tax_code="2"),
            ],
            movements=[
                ReservationMovement(movement_date="2026-11-05", concept="Apertura de Reserva (Cargo Inicial ISV inc.)", movement_type="CHARGE", amount=Decimal("63825.00")),
                ReservationMovement(movement_date="2026-11-06", concept="Anticipo 50% Reserva de Stock - Cheque #4502", movement_type="PAYMENT", amount=Decimal("31912.50")),
            ],
        )
        r3 = Reservation(
            id="RES-2026-0019",
            company_id=company.id,
            event_date="2026-11-24",
            title="Almuerzo Ejecutivo Fin de Mes (15 Personas)",
            customer_name="COMERCIAL DEL VALLE S.A.",
            customer_tax_id="05011989445566",
            credit_limit=Decimal("50000.00"),
            is_final_consumer=False,
            status="ACTIVE",
            items=[
                ReservationItem(code="MENU-001", name="Plato Ejecutivo / Servicio Mesa", quantity=Decimal("15"), unit_price=Decimal("380.00"), cost=Decimal("165.00"), tax_code="2"),
                ReservationItem(code="MENU-002", name="Bebida Natural / Café Especial", quantity=Decimal("15"), unit_price=Decimal("95.00"), cost=Decimal("35.00"), tax_code="2"),
            ],
            movements=[
                ReservationMovement(movement_date="2026-11-09", concept="Apertura de Reserva (Cargo Inicial ISV inc.)", movement_type="CHARGE", amount=Decimal("8193.75")),
                ReservationMovement(movement_date="2026-11-09", concept="Anticipo Reserva de Mesa - POS VISA #9012", movement_type="PAYMENT", amount=Decimal("3000.00")),
            ],
        )
        r4 = Reservation(
            id="RES-2026-0022",
            company_id=company.id,
            event_date="2026-12-05",
            title="Convención Anual Distribuidores",
            customer_name="FERRETERÍA LARACH & CÍA S. DE R.L.",
            customer_tax_id="08011970123456",
            credit_limit=Decimal("150000.00"),
            is_final_consumer=False,
            status="ACTIVE",
            items=[
                ReservationItem(code="SERV-001", name="Reserva Salón / Paquete Evento Corporativo", quantity=Decimal("2"), unit_price=Decimal("12500.00"), cost=Decimal("5200.00"), tax_code="2"),
            ],
            movements=[
                ReservationMovement(movement_date="2026-11-09", concept="Apertura de Reserva (Cargo Inicial ISV inc.)", movement_type="CHARGE", amount=Decimal("28750.00")),
                ReservationMovement(movement_date="2026-11-09", concept="Anticipo Garantía de Fecha - ACH #77321", movement_type="PAYMENT", amount=Decimal("12000.00")),
            ],
        )
        db.add_all([r1, r2, r3, r4])

    # Seed initial CxC / Fiscal Documents if empty
    if not db.scalar(select(SalesFiscalDocument).limit(1)):
        doc1 = SalesFiscalDocument(
            company_id=company.id,
            document_number="000-001-01-00045210",
            doc_type_code="01",
            emission_point="001-004",
            cai="7A4B2C-9D1E8F-4A5B6C-7D8E9F-0A1B2C-3D",
            cai_deadline="31/12/2027",
            issue_date="2026-09-20",
            due_date="2026-10-20",
            customer_name="INVERSIONES GLOBALES S. DE R.L.",
            customer_tax_id="08011990887766",
            sale_condition="CREDITO",
            salesperson="Arsenio Córdova",
            subtotal_exempt=Decimal("0.00"),
            subtotal_grav15=Decimal("21304.35"),
            subtotal_grav18=Decimal("0.00"),
            isv15=Decimal("3195.65"),
            isv18=Decimal("0.00"),
            total_amount=Decimal("24500.00"),
            total_cost=Decimal("16500.00"),
            paid_amount=Decimal("10000.00"),
            balance_due=Decimal("14500.00"),
            status="VIGENTE",
            items_json=[],
            payments_json=[{"method": "CREDITO", "amount": 24500.00, "reference": "Plazo 30 Días", "account": "1.1.02.01.01 Clientes Nacionales CxC"}],
        )
        doc2 = SalesFiscalDocument(
            company_id=company.id,
            document_number="000-001-01-00045225",
            doc_type_code="01",
            emission_point="001-004",
            cai="7A4B2C-9D1E8F-4A5B6C-7D8E9F-0A1B2C-3D",
            cai_deadline="31/12/2027",
            issue_date="2026-10-28",
            due_date="2026-11-28",
            customer_name="COMERCIAL DEL VALLE S.A.",
            customer_tax_id="05011989445566",
            sale_condition="CREDITO",
            salesperson="Daniel Alonso",
            subtotal_exempt=Decimal("0.00"),
            subtotal_grav15=Decimal("29565.22"),
            subtotal_grav18=Decimal("0.00"),
            isv15=Decimal("4434.78"),
            isv18=Decimal("0.00"),
            total_amount=Decimal("34000.00"),
            total_cost=Decimal("24100.00"),
            paid_amount=Decimal("0.00"),
            balance_due=Decimal("34000.00"),
            status="VIGENTE",
            items_json=[],
            payments_json=[{"method": "CREDITO", "amount": 34000.00, "reference": "Plazo 30 Días", "account": "1.1.02.01.01 Clientes Nacionales CxC"}],
        )
        db.add_all([doc1, doc2])

    db.commit()
    return company


# =============================================================================
# HELPER: CREATE DOUBLE-ENTRY JOURNAL ENTRY IN GENERAL LEDGER
# =============================================================================
def create_accounting_entry(
    db: Session,
    company_id: uuid.UUID,
    entry_date_str: str,
    concept: str,
    source_doc_type: str,
    source_doc_id: str,
    lines_spec: List[Dict[str, Any]],
) -> Optional[JournalEntry]:
    """Creates a balanced JournalEntry + JournalEntryLines in the general accounting engine."""
    try:
        parsed_date = date.fromisoformat(entry_date_str[:10])
    except Exception:
        parsed_date = date(2026, 11, 10)

    period = db.scalar(
        select(FiscalPeriod).where(
            FiscalPeriod.company_id == company_id,
            FiscalPeriod.period_number == parsed_date.month,
        )
    )
    if not period:
        period = db.scalar(select(FiscalPeriod).where(FiscalPeriod.company_id == company_id).limit(1))
    if not period:
        return None

    accounts_map = {
        a.code: a
        for a in db.scalars(select(Account).where(Account.company_id == company_id)).all()
    }

    total_debit = Decimal("0.00")
    total_credit = Decimal("0.00")
    valid_lines = []

    for idx, lspec in enumerate(lines_spec, start=1):
        code = lspec.get("account_code", "").split(" ")[0].strip()
        acc = accounts_map.get(code)
        if not acc:
            # Fallback to prefix match or create on the fly
            for k, v in accounts_map.items():
                if code.startswith(k) or k.startswith(code):
                    acc = v
                    break
        if not acc:
            continue

        deb = Decimal(str(round(float(lspec.get("debit", 0.0)), 2)))
        cred = Decimal(str(round(float(lspec.get("credit", 0.0)), 2)))
        if deb == 0 and cred == 0:
            continue

        total_debit += deb
        total_credit += cred
        valid_lines.append(
            JournalEntryLine(
                id=uuid.uuid4(),
                company_id=company_id,
                account_id=acc.id,
                line_number=idx,
                description=lspec.get("description", concept),
                debit=deb,
                credit=cred,
                third_party_id=lspec.get("third_party_id"),
                third_party_name=lspec.get("third_party_name"),
            )
        )

    if not valid_lines:
        return None

    entry_num = f"AS-{parsed_date.year}-{str(uuid.uuid4().int)[:5]}"
    je = JournalEntry(
        id=uuid.uuid4(),
        company_id=company_id,
        period_id=period.id,
        entry_number=entry_num,
        entry_date=parsed_date,
        entry_type="REGULAR",
        status="POSTED",
        concept=concept,
        thread_id=uuid.uuid4(),
        source_document_type=source_doc_type,
        source_document_id=source_doc_id,
        total_debit=total_debit,
        total_credit=total_credit,
        currency_code="HNL",
        exchange_rate=Decimal("1.000000"),
        is_posted=True,
        posted_at=datetime.utcnow(),
        posted_by="SalesWorkspace Engine",
        is_locked=False,
        lines=valid_lines,
    )
    db.add(je)
    db.flush()
    return je


# =============================================================================
# ENDPOINTS 1: SAR PUNTOS DE EMISIÓN Y CAIs VIGENTES
# =============================================================================
@sales_ws_router.get("/sar/puntos-emision", summary="Listar todos los puntos de emisión SAR")
@sales_ws_router.get("/sar/puntos-emision/", include_in_schema=False)
def list_sar_emission_points():
    return {"points": SAR_RUNTIME_STATE}


@sales_ws_router.get("/sar/puntos-emision/{codigo}", summary="Consultar lotes CAI activos por punto de emisión")
@sales_ws_router.get("/sar/puntos-emision/{codigo}/", include_in_schema=False)
def get_sar_emission_point(codigo: str, doc_type: str = "01"):
    clean_code = codigo.strip()
    punto = SAR_RUNTIME_STATE.get(clean_code)
    if not punto:
        raise HTTPException(status_code=404, detail=f"Punto de emisión {clean_code} no tiene lotes CAI asignados")

    lote = punto.get(doc_type) or punto.get("01")
    disponibles = max(0, (int(lote["fin"]) - int(lote["actual"])) + 1)

    # Check deadline validity (DD/MM/YYYY)
    is_expired = False
    try:
        d_parts = lote["fecha_limite"].split("/")
        limit_date = date(int(d_parts[2]), int(d_parts[1]), int(d_parts[0]))
        if limit_date < date(2026, 11, 10):
            is_expired = True
    except Exception:
        pass

    correlativo = f"{clean_code}-{doc_type}-{str(lote['actual']).zfill(8)}"
    rango_txt = f"{str(lote['inicio']).zfill(8)} al {str(lote['fin']).zfill(8)}"
    return {
        "punto_emision": clean_code,
        "sucursal": punto["sucursal"],
        "doc_type": doc_type,
        "cai": lote["cai"],
        "fecha_limite": lote["fecha_limite"],
        "inicio": lote["inicio"],
        "fin": lote["fin"],
        "actual": lote["actual"],
        "disponibles": disponibles,
        "correlativo_formateado": correlativo,
        "correlativo_sugerido": correlativo,
        "rango_texto": rango_txt,
        "vencido": is_expired,
        "bloqueado": is_expired or disponibles <= 0,
        "lote_activo": {
            **lote,
            "disponibles": disponibles,
            "correlativo_sugerido": correlativo,
            "correlativo_formateado": correlativo,
            "rango_texto": rango_txt,
            "vencido": is_expired,
            "bloqueado": is_expired or disponibles <= 0,
        },
        "lotes": {
            "01": punto["01"],
            "06": punto["06"],
            "05": punto["05"],
        },
    }


# =============================================================================
# ENDPOINTS 2: CATÁLOGO DE CLIENTES Y PRODUCTOS CON LANDED COST
# =============================================================================
@sales_ws_router.get("/sales/catalog", summary="Obtener catálogo real de clientes y productos con Landed Cost")
@sales_ws_router.get("/sales/catalog/", include_in_schema=False)
def get_sales_catalog(db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    items = db.scalars(select(Item).where(Item.company_id == company.id, Item.is_active == True)).all()
    stocks = {
        s.item_id: s
        for s in db.scalars(select(StockLevel).where(StockLevel.company_id == company.id)).all()
    }

    products_dict = dict(DEFAULT_CATALOG_PRODUCTS)
    for it in items:
        st = stocks.get(it.id)
        cv = it.custom_values or {}
        base_def = DEFAULT_CATALOG_PRODUCTS.get(it.sku, {})
        l_cost = float(st.average_unit_cost) if st and st.average_unit_cost > 0 else float(cv.get("landed_cost", base_def.get("cost", 100.0)))
        u_price = float(cv.get("unit_price", base_def.get("price", l_cost * 1.35)))
        t_code = str(cv.get("tax_code", "1" if it.default_isv_type == "EXEMPT" else "2"))
        products_dict[it.sku] = {
            "code": it.sku,
            "name": it.name,
            "price": u_price,
            "unit_price": u_price,
            "cost": l_cost,
            "landed_cost": l_cost,
            "tax_code": t_code,
            "available_stock": float(st.available_stock) if st else 100.0,
        }

    customers_dict = dict(DEFAULT_CUSTOMERS)
    db_customers = db.scalars(select(Customer).where(Customer.company_id == company.id, Customer.is_active == True)).all()
    for c in db_customers:
        customers_dict[c.legal_name] = {
            "tax_id": c.tax_id,
            "name": c.legal_name,
            "credit_limit": float(c.credit_limit),
            "is_final_consumer": c.tax_id == "99999999999999",
        }

    return {
        "customers": customers_dict,
        "products": products_dict,
    }


# =============================================================================
# ENDPOINTS 3A: SECCIÓN 1 - COTIZACIONES (SalesQuote / SalesQuoteLine)
# =============================================================================
def serialize_quote(q: SalesQuote) -> Dict[str, Any]:
    subtotal_neto = 0.0
    total_cost = 0.0
    items_out = []
    for l in q.lines:
        qty = float(l.quantity)
        up = float(l.unit_price)
        lc = float(l.landed_cost)
        subtotal_neto += qty * up
        total_cost += qty * lc
        items_out.append({
            "code": l.code,
            "name": l.name,
            "quantity": qty,
            "unit_price": up,
            "cost": lc,
            "landed_cost": lc,
            "tax_code": l.tax_code,
        })
    margin_pct = ((subtotal_neto - total_cost) / subtotal_neto * 100.0) if subtotal_neto > 0 else 0.0
    return {
        "id": q.id,
        "customer": {
            "tax_id": q.customer_tax_id,
            "name": q.customer_name,
            "credit_limit": float(q.credit_limit),
            "is_final_consumer": q.is_final_consumer,
        },
        "validUntil": q.valid_until,
        "status": q.status,
        "margin_pct": round(margin_pct, 1),
        "items": items_out,
    }


@sales_ws_router.get("/sales/quotes", summary="Listar cotizaciones comerciales")
@sales_ws_router.get("/sales/quotes/", include_in_schema=False)
def list_quotes(db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    quotes = db.scalars(select(SalesQuote).order_by(SalesQuote.created_at.desc())).all()
    return [serialize_quote(q) for q in quotes]


@sales_ws_router.post("/sales/quotes", summary="Crear nueva cotización comercial")
@sales_ws_router.post("/sales/quotes/", include_in_schema=False)
def create_quote(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    q_id = payload.get("id") or f"COT-2026-00{43 + len(db.scalars(select(SalesQuote)).all())}"
    cust = payload.get("customer") or DEFAULT_CUSTOMERS["INVERSIONES GLOBALES S. DE R.L."]
    existing = db.get(SalesQuote, q_id)
    if existing:
        return serialize_quote(existing)

    lines_data = payload.get("items", [])
    q = SalesQuote(
        id=q_id,
        company_id=company.id,
        customer_name=cust.get("name", "INVERSIONES GLOBALES S. DE R.L."),
        customer_tax_id=cust.get("tax_id", "08011990887766"),
        credit_limit=Decimal(str(cust.get("credit_limit", 100000))),
        is_final_consumer=bool(cust.get("is_final_consumer", False)),
        valid_until=payload.get("validUntil", "2026-11-25"),
        status=payload.get("status", "DRAFT"),
        lines=[
            SalesQuoteLine(
                code=it.get("code", "SKU-001"),
                name=it.get("name", "Producto"),
                quantity=Decimal(str(it.get("quantity", 1))),
                unit_price=Decimal(str(it.get("unit_price", 0))),
                landed_cost=Decimal(str(it.get("cost", it.get("landed_cost", 0)))),
                tax_code=str(it.get("tax_code", "2")),
            )
            for it in lines_data
        ],
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return serialize_quote(q)


@sales_ws_router.patch("/sales/quotes/{quote_id}", summary="Actualizar líneas o estado de cotización")
@sales_ws_router.patch("/sales/quotes/{quote_id}/", include_in_schema=False)
def update_quote(quote_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    q = db.get(SalesQuote, quote_id)
    if not q:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if "status" in payload:
        q.status = payload["status"]
    if "validUntil" in payload:
        q.valid_until = payload["validUntil"]
    if "customer" in payload and isinstance(payload["customer"], dict):
        q.customer_name = payload["customer"].get("name", q.customer_name)
        q.customer_tax_id = payload["customer"].get("tax_id", q.customer_tax_id)
    if "items" in payload and isinstance(payload["items"], list):
        q.lines.clear()
        db.flush()
        for it in payload["items"]:
            q.lines.append(
                SalesQuoteLine(
                    code=it.get("code", "SKU-001"),
                    name=it.get("name", "Producto"),
                    quantity=Decimal(str(it.get("quantity", 1))),
                    unit_price=Decimal(str(it.get("unit_price", 0))),
                    landed_cost=Decimal(str(it.get("cost", it.get("landed_cost", 0)))),
                    tax_code=str(it.get("tax_code", "2")),
                )
            )
    db.commit()
    db.refresh(q)
    return serialize_quote(q)


# =============================================================================
# ENDPOINTS 3B: SECCIÓN 1 - OFERTAS Y COMBOS (CommercialOffer / CommercialOfferItem)
# =============================================================================
def serialize_offer(off: CommercialOffer) -> Dict[str, Any]:
    return {
        "code": off.code,
        "name": off.name,
        "status": off.status,
        "validUntil": off.valid_until,
        "priceRegular": float(off.price_regular),
        "pricePromo": float(off.price_promo),
        "costTotal": float(off.cost_total),
        "items": [
            {
                "code": it.code,
                "name": it.name,
                "quantity": float(it.quantity),
                "unit_price": float(it.unit_price),
                "cost": float(it.cost),
                "tax_code": it.tax_code,
            }
            for it in off.items
        ],
    }


@sales_ws_router.get("/sales/offers", summary="Listar catálogo de ofertas, combos y promociones")
@sales_ws_router.get("/sales/offers/", include_in_schema=False)
def list_offers(db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    offers = db.scalars(select(CommercialOffer)).all()
    return [serialize_offer(o) for o in offers]


@sales_ws_router.post("/sales/offers", summary="Crear nueva oferta o combo promocional")
@sales_ws_router.post("/sales/offers/", include_in_schema=False)
def create_offer(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    code = (payload.get("code") or f"COMBO-{len(db.scalars(select(CommercialOffer)).all()) + 1:02d}").upper()
    existing = db.get(CommercialOffer, code)
    if existing:
        return serialize_offer(existing)

    items_data = payload.get("items", [])
    off = CommercialOffer(
        code=code,
        company_id=company.id,
        name=payload.get("name", "Nuevo Combo Promocional"),
        status=payload.get("status", "ACTIVA"),
        valid_until=payload.get("validUntil", "2026-12-31"),
        price_regular=Decimal(str(payload.get("priceRegular", 0))),
        price_promo=Decimal(str(payload.get("pricePromo", 0))),
        cost_total=Decimal(str(payload.get("costTotal", 0))),
        items=[
            CommercialOfferItem(
                code=it.get("code", "SKU-001"),
                name=it.get("name", "Componente"),
                quantity=Decimal(str(it.get("quantity", 1))),
                unit_price=Decimal(str(it.get("unit_price", 0))),
                cost=Decimal(str(it.get("cost", 0))),
                tax_code=str(it.get("tax_code", "2")),
            )
            for it in items_data
        ],
    )
    db.add(off)
    db.commit()
    db.refresh(off)
    return serialize_offer(off)


# =============================================================================
# ENDPOINTS 4A: SECCIÓN 2 - PRE-ÓRDENES DE PISO / MESAS (TablePreOrder)
# =============================================================================
def serialize_preorder(p: TablePreOrder) -> Dict[str, Any]:
    return {
        "id": p.id,
        "tableLabel": p.table_label,
        "pax": p.pax,
        "waiter": p.waiter,
        "openedAt": p.opened_at,
        "status": p.status,
        "closeJustification": p.close_justification,
        "customer": {
            "tax_id": p.customer_tax_id,
            "name": p.customer_name,
            "credit_limit": float(p.credit_limit),
            "is_final_consumer": p.is_final_consumer,
        },
        "items": [
            {
                "code": l.code,
                "name": l.name,
                "quantity": float(l.quantity),
                "unit_price": float(l.unit_price),
                "cost": float(l.cost),
                "tax_code": l.tax_code,
            }
            for l in p.lines
        ],
    }


@sales_ws_router.get("/sales/preorders", summary="Listar pre-órdenes abiertas en piso/mesas")
@sales_ws_router.get("/sales/preorders/", include_in_schema=False)
def list_preorders(status: str = "OPEN", db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    stmt = select(TablePreOrder)
    if status != "ALL":
        stmt = stmt.where(TablePreOrder.status == status)
    preorders = db.scalars(stmt).all()
    return [serialize_preorder(p) for p in preorders]


@sales_ws_router.post("/sales/preorders", summary="Abrir nueva pre-orden de mesa o mostrador")
@sales_ws_router.post("/sales/preorders/", include_in_schema=False)
def create_preorder(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    p_id = payload.get("id") or f"PRE-MESA-{10 + len(db.scalars(select(TablePreOrder)).all())}"
    existing = db.get(TablePreOrder, p_id)
    if existing:
        return serialize_preorder(existing)

    cust = payload.get("customer") or DEFAULT_CUSTOMERS["CONSUMIDOR FINAL"]
    lines_data = payload.get("items", [])
    pre = TablePreOrder(
        id=p_id,
        company_id=company.id,
        table_label=payload.get("tableLabel", "MESA PRINCIPAL"),
        pax=int(payload.get("pax", 2)),
        waiter=payload.get("waiter", "Daniel Alonso"),
        opened_at=payload.get("openedAt", datetime.now().strftime("%H:%M")),
        customer_name=cust.get("name", "CONSUMIDOR FINAL"),
        customer_tax_id=cust.get("tax_id", "99999999999999"),
        credit_limit=Decimal(str(cust.get("credit_limit", 0))),
        is_final_consumer=bool(cust.get("is_final_consumer", True)),
        close_justification=payload.get("closeJustification", ""),
        status=payload.get("status", "OPEN"),
        lines=[
            TablePreOrderLine(
                code=it.get("code", "MENU-001"),
                name=it.get("name", "Producto"),
                quantity=Decimal(str(it.get("quantity", 1))),
                unit_price=Decimal(str(it.get("unit_price", 0))),
                cost=Decimal(str(it.get("cost", 0))),
                tax_code=str(it.get("tax_code", "2")),
            )
            for it in lines_data
        ],
    )
    db.add(pre)
    db.commit()
    db.refresh(pre)
    return serialize_preorder(pre)


@sales_ws_router.patch("/sales/preorders/{preorder_id}", summary="Actualizar ítems, justificación o estado de pre-orden")
@sales_ws_router.patch("/sales/preorders/{preorder_id}/", include_in_schema=False)
def update_preorder(preorder_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    pre = db.get(TablePreOrder, preorder_id)
    if not pre:
        raise HTTPException(status_code=404, detail="Pre-orden no encontrada")

    if "closeJustification" in payload:
        pre.close_justification = str(payload["closeJustification"] or "")
    if "close_justification" in payload:
        pre.close_justification = str(payload["close_justification"] or "")
    if "status" in payload:
        pre.status = payload["status"]
    if "items" in payload and isinstance(payload["items"], list):
        pre.lines.clear()
        db.flush()
        for it in payload["items"]:
            pre.lines.append(
                TablePreOrderLine(
                    code=it.get("code", "MENU-001"),
                    name=it.get("name", "Producto"),
                    quantity=Decimal(str(it.get("quantity", 1))),
                    unit_price=Decimal(str(it.get("unit_price", 0))),
                    cost=Decimal(str(it.get("cost", 0))),
                    tax_code=str(it.get("tax_code", "2")),
                )
            )
    db.commit()
    db.refresh(pre)
    return serialize_preorder(pre)


@sales_ws_router.post("/sales/preorders/validate-cash-close", summary="Regla de Auditoría de Caja para Pre-órdenes Abiertas")
@sales_ws_router.post("/sales/preorders/validate-cash-close/", include_in_schema=False)
def validate_cash_close_preorders(db: Session = Depends(get_db)):
    """Impide el cierre de turno de caja si existen pre-órdenes en estado OPEN sin close_justification."""
    ensure_sales_workspace_seed(db)
    open_preorders = db.scalars(select(TablePreOrder).where(TablePreOrder.status == "OPEN")).all()
    unjustified = [
        {"id": p.id, "tableLabel": p.table_label, "waiter": p.waiter}
        for p in open_preorders
        if not p.close_justification or len(p.close_justification.strip()) < 4
    ]
    if unjustified:
        return {
            "can_close": False,
            "message": f"Cierre de turno bloqueado: existen {len(unjustified)} pre-órdenes abiertas sin justificación de auditoría.",
            "unjustified_preorders": [u["id"] for u in unjustified],
            "unjustified_details": unjustified,
        }
    return {"can_close": True, "unjustified_preorders": [], "open_justified_count": len(open_preorders)}


# =============================================================================
# ENDPOINTS 4B: SECCIÓN 2 - AGENDA DE RESERVAS Y ANTICIPOS (Reservation)
# =============================================================================
def serialize_reservation(r: Reservation) -> Dict[str, Any]:
    return {
        "id": r.id,
        "eventDate": r.event_date,
        "title": r.title,
        "status": r.status,
        "customer": {
            "tax_id": r.customer_tax_id,
            "name": r.customer_name,
            "credit_limit": float(r.credit_limit),
            "is_final_consumer": r.is_final_consumer,
        },
        "items": [
            {
                "code": it.code,
                "name": it.name,
                "quantity": float(it.quantity),
                "unit_price": float(it.unit_price),
                "cost": float(it.cost),
                "tax_code": it.tax_code,
            }
            for it in r.items
        ],
        "movements": [
            {
                "date": m.movement_date,
                "concept": m.concept,
                "type": m.movement_type,
                "amount": float(m.amount),
            }
            for m in r.movements
        ],
    }


@sales_ws_router.get("/sales/reservations", summary="Listar agenda de reservaciones y anticipos")
@sales_ws_router.get("/sales/reservations/", include_in_schema=False)
def list_reservations(db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    res_list = db.scalars(select(Reservation).where(Reservation.status == "ACTIVE")).all()
    return [serialize_reservation(r) for r in res_list]


@sales_ws_router.post("/sales/reservations", summary="Crear nueva reservación con anticipo inicial y asiento contable")
@sales_ws_router.post("/sales/reservations/", include_in_schema=False)
def create_reservation(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    r_id = payload.get("id") or f"RES-2026-00{25 + len(db.scalars(select(Reservation)).all())}"
    existing = db.get(Reservation, r_id)
    if existing:
        return serialize_reservation(existing)

    cust = payload.get("customer") or DEFAULT_CUSTOMERS["INVERSIONES GLOBALES S. DE R.L."]
    items_data = payload.get("items", [])
    movements_data = payload.get("movements", [])

    res = Reservation(
        id=r_id,
        company_id=company.id,
        event_date=payload.get("eventDate", "2026-11-22"),
        title=payload.get("title", "Reserva Corporativa"),
        customer_name=cust.get("name", "INVERSIONES GLOBALES S. DE R.L."),
        customer_tax_id=cust.get("tax_id", "08011990887766"),
        credit_limit=Decimal(str(cust.get("credit_limit", 100000))),
        is_final_consumer=bool(cust.get("is_final_consumer", False)),
        status="ACTIVE",
        items=[
            ReservationItem(
                code=it.get("code", "SERV-001"),
                name=it.get("name", "Reserva"),
                quantity=Decimal(str(it.get("quantity", 1))),
                unit_price=Decimal(str(it.get("unit_price", 0))),
                cost=Decimal(str(it.get("cost", 0))),
                tax_code=str(it.get("tax_code", "2")),
            )
            for it in items_data
        ],
    )
    db.add(res)
    db.flush()

    for m in movements_data:
        m_type = m.get("type", "CHARGE")
        m_amt = Decimal(str(m.get("amount", 0)))
        m_date = m.get("date", date.today().isoformat())
        m_concept = m.get("concept", "Movimiento de Reserva")
        je_id = None
        if m_type == "PAYMENT" and m_amt > 0:
            je = create_accounting_entry(
                db=db,
                company_id=company.id,
                entry_date_str=m_date,
                concept=f"Anticipo de Reserva {r_id} - {cust.get('name')} ({m_concept})",
                source_doc_type="RESERVATION_ADVANCE",
                source_doc_id=r_id,
                lines_spec=[
                    {"account_code": "1.1.01.01.01", "description": f"Ingreso Caja/Banco Anticipo {r_id}", "debit": float(m_amt), "credit": 0.0, "third_party_id": cust.get("tax_id"), "third_party_name": cust.get("name")},
                    {"account_code": "2.1.05.01", "description": f"Pasivo Anticipos de Clientes {r_id}", "debit": 0.0, "credit": float(m_amt), "third_party_id": cust.get("tax_id"), "third_party_name": cust.get("name")},
                ],
            )
            if je:
                je_id = je.id

        res.movements.append(
            ReservationMovement(
                movement_date=m_date,
                concept=m_concept,
                movement_type=m_type,
                amount=m_amt,
                journal_entry_id=je_id,
            )
        )

    db.commit()
    db.refresh(res)
    return serialize_reservation(res)


@sales_ws_router.post("/sales/reservations/{reservation_id}/advances", summary="Registrar anticipo o cargo adicional en reserva")
@sales_ws_router.post("/sales/reservations/{reservation_id}/advances/", include_in_schema=False)
def add_reservation_advance(reservation_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    res = db.get(Reservation, reservation_id)
    if not res:
        raise HTTPException(status_code=404, detail="Reservación no encontrada")

    m_type = payload.get("type", "PAYMENT")
    m_date = payload.get("date", date.today().isoformat())
    m_amount = Decimal(str(payload.get("amount", 0)))
    m_concept = payload.get("concept", "Anticipo de Clientes")

    if "item" in payload and isinstance(payload["item"], dict):
        it = payload["item"]
        res.items.append(
            ReservationItem(
                code=it.get("code", "SERV-001"),
                name=it.get("name", "Servicio Adicional"),
                quantity=Decimal(str(it.get("quantity", 1))),
                unit_price=Decimal(str(it.get("unit_price", 0))),
                cost=Decimal(str(it.get("cost", 0))),
                tax_code=str(it.get("tax_code", "2")),
            )
        )

    je_id = None
    if m_type == "PAYMENT" and m_amount > 0:
        je = create_accounting_entry(
            db=db,
            company_id=company.id,
            entry_date_str=m_date,
            concept=f"Anticipo de Reserva {res.id} - {res.customer_name} ({m_concept})",
            source_doc_type="RESERVATION_ADVANCE",
            source_doc_id=res.id,
            lines_spec=[
                {"account_code": "1.1.01.01.01", "description": f"Ingreso Anticipo Reserva {res.id}", "debit": float(m_amount), "credit": 0.0, "third_party_id": res.customer_tax_id, "third_party_name": res.customer_name},
                {"account_code": "2.1.05.01", "description": f"Anticipos de Clientes {res.id}", "debit": 0.0, "credit": float(m_amount), "third_party_id": res.customer_tax_id, "third_party_name": res.customer_name},
            ],
        )
        if je:
            je_id = je.id

    res.movements.append(
        ReservationMovement(
            movement_date=m_date,
            concept=m_concept,
            movement_type=m_type,
            amount=m_amount,
            journal_entry_id=je_id,
        )
    )
    db.commit()
    db.refresh(res)
    return {
        "reservation": serialize_reservation(res),
        "journal_entry_id": str(je_id) if je_id else None,
    }


# =============================================================================
# ENDPOINTS 5: SECCIÓN 3 - EMISIÓN FISCAL ATÓMICA, KARDEX Y PARTIDA CONTABLE
# =============================================================================
@sales_ws_router.post("/sales/documents/emit", summary="Emisión transaccional atómica de Factura (01), NC (06) o ND (05)")
@sales_ws_router.post("/sales/documents/emit/", include_in_schema=False)
def emit_fiscal_document(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)

    emission_point = (payload.get("emission_point") or payload.get("punto_emision") or "001-004").strip()
    doc_type = (payload.get("doc_type_code") or "01").strip()
    punto_cfg = SAR_RUNTIME_STATE.get(emission_point)
    if not punto_cfg:
        raise HTTPException(status_code=400, detail=f"Punto de emisión {emission_point} no autorizado en SAR")

    lote = punto_cfg.get(doc_type) or punto_cfg["01"]
    disponibles = (int(lote["fin"]) - int(lote["actual"])) + 1
    if disponibles <= 0:
        raise HTTPException(status_code=400, detail=f"Rango CAI agotado para el punto {emission_point} (Tipo {doc_type})")

    # Validate deadline
    try:
        d_parts = lote["fecha_limite"].split("/")
        limit_date = date(int(d_parts[2]), int(d_parts[1]), int(d_parts[0]))
        if limit_date < date(2026, 11, 10):
            raise HTTPException(status_code=400, detail=f"CAI vencido el {lote['fecha_limite']}")
    except HTTPException:
        raise
    except Exception:
        pass

    doc_number = (payload.get("correlativo") or payload.get("document_number") or f"{emission_point}-{doc_type}-{str(lote['actual']).zfill(8)}").strip()
    issue_date = payload.get("issue_date") or date.today().isoformat()
    cust = payload.get("customer") or DEFAULT_CUSTOMERS["CONSUMIDOR FINAL"]
    customer_name = cust.get("name", "CONSUMIDOR FINAL")
    customer_rtn = cust.get("tax_id", "99999999999999")
    sale_condition = payload.get("sale_condition", "CONTADO")
    source_code = payload.get("source_code") or payload.get("pre_order_code") or ""
    affected_invoice = payload.get("reference_invoice") or payload.get("affected_invoice_number") or ""
    items = payload.get("items") or []
    payments = payload.get("payments") or []

    if not items:
        raise HTTPException(status_code=400, detail="El documento fiscal debe contener al menos una línea de detalle.")

    # Calculate totals and expand combos for inventory Kardex
    wh = db.scalar(select(Warehouse).where(Warehouse.company_id == company.id).limit(1))
    offers_map = {
        o.code: o
        for o in db.scalars(select(CommercialOffer)).all()
    }
    items_by_sku = {
        it.sku: it
        for it in db.scalars(select(Item).where(Item.company_id == company.id)).all()
    }

    base_exento = Decimal("0.00")
    base_grav15 = Decimal("0.00")
    total_cogs = Decimal("0.00")
    kardex_components: List[Dict[str, Any]] = []

    for line in items:
        code = str(line.get("code", "SKU-001")).strip()
        qty = Decimal(str(line.get("quantity", 1)))
        u_price = Decimal(str(line.get("unit_price", 0)))
        tax_code = str(line.get("tax_code", "2"))
        sub = (qty * u_price).quantize(Decimal("0.01"))

        if tax_code == "1":
            base_exento += sub
        else:
            base_grav15 += sub

        # Check if this line is a CommercialOffer Combo
        if code in offers_map:
            combo = offers_map[code]
            for comp in combo.items:
                comp_qty = qty * comp.quantity
                comp_cost = comp.cost
                total_cogs += (comp_qty * comp_cost).quantize(Decimal("0.01"))
                kardex_components.append({
                    "sku": comp.code,
                    "name": comp.name,
                    "qty": comp_qty,
                    "unit_cost": comp_cost,
                })
        else:
            db_item = items_by_sku.get(code)
            u_cost = Decimal(str(line.get("cost", line.get("landed_cost", 0))))
            if u_cost <= 0 and db_item and db_item.custom_values:
                u_cost = Decimal(str(db_item.custom_values.get("landed_cost", float(u_price) * 0.72)))
            total_cogs += (qty * u_cost).quantize(Decimal("0.01"))
            kardex_components.append({
                "sku": code,
                "name": line.get("name", code),
                "qty": qty,
                "unit_cost": u_cost,
            })

    isv15 = (base_grav15 * Decimal("0.15")).quantize(Decimal("0.01"))
    total_venta = (base_exento + base_grav15 + isv15).quantize(Decimal("0.01"))
    base_ingresos = (base_exento + base_grav15).quantize(Decimal("0.01"))

    # Process Inventory Stock & Kardex with select_for_update()
    if wh and doc_type in ("01", "06"):
        for comp in kardex_components:
            db_item = items_by_sku.get(comp["sku"])
            if not db_item:
                continue
            stock_lvl = db.scalar(
                select(StockLevel)
                .where(StockLevel.company_id == company.id, StockLevel.warehouse_id == wh.id, StockLevel.item_id == db_item.id)
                .with_for_update()
            )
            if not stock_lvl:
                continue

            qty_mov = comp["qty"]
            u_cost = stock_lvl.average_unit_cost if stock_lvl.average_unit_cost > 0 else comp["unit_cost"]
            tot_cost = (qty_mov * u_cost).quantize(Decimal("0.01"))

            if doc_type == "01":
                # Factura: salida de bodega
                stock_lvl.current_stock = max(Decimal("0.00"), stock_lvl.current_stock - qty_mov)
                stock_lvl.available_stock = max(Decimal("0.00"), stock_lvl.available_stock - qty_mov)
                stock_lvl.total_valuation = (stock_lvl.current_stock * u_cost).quantize(Decimal("0.01"))
                stock_lvl.last_movement_at = datetime.utcnow()

                km = KardexMovement(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    warehouse_id=wh.id,
                    item_id=db_item.id,
                    movement_date=date.today(),
                    movement_type="SALE_OUT",
                    reference_document_type="SAR_INVOICE_01",
                    reference_document_id=doc_number,
                    thread_id=uuid.uuid4(),
                    quantity_in=Decimal("0.00"),
                    unit_cost_in=Decimal("0.00"),
                    total_cost_in=Decimal("0.00"),
                    quantity_out=qty_mov,
                    unit_cost_out=u_cost,
                    total_cost_out=tot_cost,
                    balance_quantity=stock_lvl.current_stock,
                    average_unit_cost=u_cost,
                    balance_total_cost=stock_lvl.total_valuation,
                    notes=f"Salida por Factura SAR {doc_number} - {customer_name}",
                )
                db.add(km)
            elif doc_type == "06":
                # Nota de Crédito: retorno a bodega
                stock_lvl.current_stock = stock_lvl.current_stock + qty_mov
                stock_lvl.available_stock = stock_lvl.available_stock + qty_mov
                stock_lvl.total_valuation = (stock_lvl.current_stock * u_cost).quantize(Decimal("0.01"))
                stock_lvl.last_movement_at = datetime.utcnow()

                km = KardexMovement(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    warehouse_id=wh.id,
                    item_id=db_item.id,
                    movement_date=date.today(),
                    movement_type="ADJUSTMENT_IN",
                    reference_document_type="SAR_CREDIT_NOTE_06",
                    reference_document_id=doc_number,
                    thread_id=uuid.uuid4(),
                    quantity_in=qty_mov,
                    unit_cost_in=u_cost,
                    total_cost_in=tot_cost,
                    quantity_out=Decimal("0.00"),
                    unit_cost_out=Decimal("0.00"),
                    total_cost_out=Decimal("0.00"),
                    balance_quantity=stock_lvl.current_stock,
                    average_unit_cost=u_cost,
                    balance_total_cost=stock_lvl.total_valuation,
                    notes=f"Reingreso por Nota de Crédito SAR {doc_number} (Ref: {affected_invoice})",
                )
                db.add(km)

    # Build Double-Entry Accounting Lines
    je_lines_spec: List[Dict[str, Any]] = []
    method_account_map = {
        "EFECTIVO": "1.1.01.01.01",
        "TARJETA": "1.1.01.02.02",
        "TRANSFERENCIA": "1.1.01.02.01",
        "CRYPTO": "1.1.01.04.01",
        "CREDITO": "1.1.02.01.01",
        "OTROS": "1.1.01.01.02",
    }

    if not payments:
        default_method = "CREDITO" if sale_condition == "CREDITO" else "EFECTIVO"
        payments = [{"method": default_method, "amount": float(total_venta), "reference": "Mostrador", "account": method_account_map[default_method]}]

    if doc_type == "01":
        # 1. Factura (01): DEBE cuentas según modalPaymentsList contra HABER 4.1.01.01 + 2.1.02.01 + Costo de Ventas
        for p in payments:
            m_key = str(p.get("method", "EFECTIVO")).upper()
            acc_code = method_account_map.get(m_key, "1.1.01.01.01")
            p_amt = float(p.get("amount", 0))
            if p_amt > 0:
                je_lines_spec.append({
                    "account_code": acc_code,
                    "description": f"Cobro {m_key} Factura {doc_number} ({p.get('reference', '')})",
                    "debit": p_amt,
                    "credit": 0.0,
                    "third_party_id": customer_rtn,
                    "third_party_name": customer_name,
                })
        je_lines_spec.append({
            "account_code": "4.1.01.01",
            "description": f"Venta de Mercaderías Factura {doc_number}",
            "debit": 0.0,
            "credit": float(base_ingresos),
            "third_party_id": customer_rtn,
            "third_party_name": customer_name,
        })
        if isv15 > 0:
            je_lines_spec.append({
                "account_code": "2.1.02.01",
                "description": f"ISV Débito Fiscal 15% Factura {doc_number}",
                "debit": 0.0,
                "credit": float(isv15),
                "third_party_id": customer_rtn,
                "third_party_name": customer_name,
            })
        if total_cogs > 0:
            je_lines_spec.append({
                "account_code": "5.1.01.01",
                "description": f"Costo de Ventas Factura {doc_number}",
                "debit": float(total_cogs),
                "credit": 0.0,
            })
            je_lines_spec.append({
                "account_code": "1.1.05.01",
                "description": f"Descargo Inventario Bodega Factura {doc_number}",
                "debit": 0.0,
                "credit": float(total_cogs),
            })

    elif doc_type == "06":
        # 2. Nota de Crédito (06): Invertir asiento
        je_lines_spec.append({
            "account_code": "4.1.03.01",
            "description": f"Devoluciones y Rebajas s/Ventas NC {doc_number} (Fac: {affected_invoice})",
            "debit": float(base_ingresos),
            "credit": 0.0,
            "third_party_id": customer_rtn,
            "third_party_name": customer_name,
        })
        if isv15 > 0:
            je_lines_spec.append({
                "account_code": "2.1.02.01",
                "description": f"Reversión ISV Débito Fiscal 15% NC {doc_number}",
                "debit": float(isv15),
                "credit": 0.0,
            })
        credit_target = "1.1.02.01.01" if sale_condition == "CREDITO" else "1.1.01.01.01"
        je_lines_spec.append({
            "account_code": credit_target,
            "description": f"Aplicación Nota de Crédito {doc_number} a {customer_name}",
            "debit": 0.0,
            "credit": float(total_venta),
            "third_party_id": customer_rtn,
            "third_party_name": customer_name,
        })
        if total_cogs > 0:
            je_lines_spec.append({
                "account_code": "1.1.05.01",
                "description": f"Retorno a Inventario de Mercaderías NC {doc_number}",
                "debit": float(total_cogs),
                "credit": 0.0,
            })
            je_lines_spec.append({
                "account_code": "5.1.01.01",
                "description": f"Reversión Costo de Ventas NC {doc_number}",
                "debit": 0.0,
                "credit": float(total_cogs),
            })

    elif doc_type == "05":
        # 3. Nota de Débito (05)
        debit_target = "1.1.02.01.01" if sale_condition == "CREDITO" else "1.1.01.01.01"
        je_lines_spec.append({
            "account_code": debit_target,
            "description": f"Cargo por Nota de Débito {doc_number} (Fac: {affected_invoice})",
            "debit": float(total_venta),
            "credit": 0.0,
            "third_party_id": customer_rtn,
            "third_party_name": customer_name,
        })
        je_lines_spec.append({
            "account_code": "4.1.02.05",
            "description": f"Ingresos por Recargos / Nota Débito {doc_number}",
            "debit": 0.0,
            "credit": float(base_ingresos),
        })
        if isv15 > 0:
            je_lines_spec.append({
                "account_code": "2.1.02.01",
                "description": f"ISV Débito Fiscal 15% ND {doc_number}",
                "debit": 0.0,
                "credit": float(isv15),
            })

    je = create_accounting_entry(
        db=db,
        company_id=company.id,
        entry_date_str=issue_date,
        concept=f"Emisión Fiscal SAR ({doc_type}) {doc_number} - {customer_name}",
        source_doc_type=f"SAR_DOC_{doc_type}",
        source_doc_id=doc_number,
        lines_spec=je_lines_spec,
    )

    # Calculate credit balance for CxC
    credit_amount = sum(
        Decimal(str(p.get("amount", 0)))
        for p in payments
        if str(p.get("method", "")).upper() == "CREDITO"
    )
    paid_amount = max(Decimal("0.00"), total_venta - credit_amount)

    # Mark linked PreOrder or Reservation as INVOICED if applicable
    salesperson_name = payload.get("salesperson") or "Daniel Alonso"
    if source_code:
        pre = db.get(TablePreOrder, source_code)
        if pre:
            pre.status = "INVOICED"
            salesperson_name = pre.waiter or salesperson_name
        res = db.get(Reservation, source_code)
        if res:
            res.status = "INVOICED"
        quote = db.get(SalesQuote, source_code)
        if quote:
            quote.status = "INVOICED"

    due_date_str = (date.today() + timedelta(days=30)).isoformat()
    fiscal_doc = SalesFiscalDocument(
        id=uuid.uuid4(),
        company_id=company.id,
        document_number=doc_number,
        doc_type_code=doc_type,
        emission_point=emission_point,
        cai=lote["cai"],
        cai_deadline=lote["fecha_limite"],
        issue_date=issue_date,
        due_date=due_date_str,
        customer_name=customer_name,
        customer_tax_id=customer_rtn,
        sale_condition="CREDITO" if credit_amount > 0 else sale_condition,
        source_code=source_code,
        affected_invoice_number=affected_invoice,
        salesperson=salesperson_name,
        subtotal_exempt=base_exento,
        subtotal_grav15=base_grav15,
        subtotal_grav18=Decimal("0.00"),
        isv15=isv15,
        isv18=Decimal("0.00"),
        total_amount=total_venta,
        total_cost=total_cogs,
        paid_amount=paid_amount,
        balance_due=credit_amount,
        status="VIGENTE",
        journal_entry_id=je.id if je else None,
        items_json=items,
        payments_json=payments,
    )
    db.add(fiscal_doc)

    # Advance SAR correlative
    lote["actual"] = int(lote["actual"]) + 1
    next_disponibles = max(0, (int(lote["fin"]) - int(lote["actual"])) + 1)
    next_correlativo = f"{emission_point}-{doc_type}-{str(lote['actual']).zfill(8)}"

    db.commit()

    return {
        "status": "EMITTED",
        "correlativo": doc_number,
        "document_number": doc_number,
        "doc_type_code": doc_type,
        "cai": lote["cai"],
        "total_amount": float(total_venta),
        "total_cost": float(total_cogs),
        "base_exento": float(base_exento),
        "base_grav15": float(base_grav15),
        "isv15": float(isv15),
        "credit_balance": float(credit_amount),
        "credit_balance_cxc": float(credit_amount),
        "journal_entry_id": str(je.id) if je else None,
        "journal_entry_number": je.entry_number if je else None,
        "journal_lines": je_lines_spec,
        "next_correlativo": next_correlativo,
        "facturas_disponibles": next_disponibles,
    }


@sales_ws_router.post("/sales/documents/void", summary="Anulación de Factura Fiscal SAR con reversión de inventario y asiento")
@sales_ws_router.post("/sales/documents/void/", include_in_schema=False)
def void_fiscal_document(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    doc_number = (payload.get("correlativo") or payload.get("document_number") or "").strip()
    motivo = (payload.get("reason") or payload.get("motivo") or "").strip()
    pin = (payload.get("supervisor_pin") or payload.get("pin") or "").strip()

    if not doc_number:
        raise HTTPException(status_code=400, detail="Número de factura requerido para anular")
    if len(motivo) < 4:
        raise HTTPException(status_code=400, detail="Motivo de auditoría requerido (mínimo 4 caracteres)")
    if not pin:
        raise HTTPException(status_code=403, detail="PIN de Supervisor requerido para autorizar la anulación")

    doc = db.scalar(select(SalesFiscalDocument).where(SalesFiscalDocument.document_number == doc_number))
    wh = db.scalar(select(Warehouse).where(Warehouse.company_id == company.id).limit(1))

    if doc:
        # Reverse inventory if it was a valid invoice
        if doc.status != "ANULADA" and wh and doc.items_json:
            for line in doc.items_json:
                sku = line.get("code")
                qty = Decimal(str(line.get("quantity", 1)))
                db_item = db.scalar(select(Item).where(Item.company_id == company.id, Item.sku == sku))
                if db_item:
                    st = db.scalar(
                        select(StockLevel)
                        .where(StockLevel.company_id == company.id, StockLevel.warehouse_id == wh.id, StockLevel.item_id == db_item.id)
                        .with_for_update()
                    )
                    if st:
                        st.current_stock += qty
                        st.available_stock += qty

        # Void accounting entry if linked
        if doc.journal_entry_id:
            je = db.get(JournalEntry, doc.journal_entry_id)
            if je:
                je.is_reversed = True
                je.status = "REVERSED"

        doc.status = "ANULADA"
        doc.void_reason = motivo
        doc.subtotal_exempt = Decimal("0.00")
        doc.subtotal_grav15 = Decimal("0.00")
        doc.subtotal_grav18 = Decimal("0.00")
        doc.isv15 = Decimal("0.00")
        doc.isv18 = Decimal("0.00")
        doc.total_amount = Decimal("0.00")
        doc.balance_due = Decimal("0.00")
    else:
        # Register the voided correlative in L 0.00 for the SAR Sales Book
        doc = SalesFiscalDocument(
            id=uuid.uuid4(),
            company_id=company.id,
            document_number=doc_number,
            doc_type_code="01",
            emission_point=doc_number[:7] if len(doc_number) >= 7 else "001-004",
            cai=SAR_RUNTIME_STATE["001-004"]["01"]["cai"],
            cai_deadline="31/12/2027",
            issue_date=date.today().isoformat(),
            due_date=date.today().isoformat(),
            customer_name="COMPROBANTE ANULADO",
            customer_tax_id="99999999999999",
            sale_condition="CONTADO",
            subtotal_exempt=Decimal("0.00"),
            subtotal_grav15=Decimal("0.00"),
            subtotal_grav18=Decimal("0.00"),
            isv15=Decimal("0.00"),
            isv18=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            total_cost=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
            balance_due=Decimal("0.00"),
            status="ANULADA",
            void_reason=motivo,
            items_json=[],
            payments_json=[],
        )
        db.add(doc)

    db.commit()
    return {
        "status": "ANULADA",
        "correlativo": doc_number,
        "document_number": doc_number,
        "total_amount": 0.00,
        "libro_ventas_total": 0.00,
        "motivo": motivo,
    }


# =============================================================================
# ENDPOINTS 6: SECCIÓN 4 - CARTERA CXC, ABONOS, PRESUPUESTOS Y COMISIONES
# =============================================================================
@sales_ws_router.get("/sales/cxc", summary="Consultar cartera CxC activa y KPIs de Antigüedad de Saldos (Aging)")
@sales_ws_router.get("/sales/cxc/", include_in_schema=False)
def get_cxc_portfolio(db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    docs = db.scalars(
        select(SalesFiscalDocument)
        .where(SalesFiscalDocument.status == "VIGENTE", SalesFiscalDocument.balance_due > Decimal("0.01"))
        .order_by(SalesFiscalDocument.created_at.desc())
    ).all()

    ref_today = date(2026, 11, 10)
    corriente = 0.0
    vencido = 0.0
    critico = 0.0
    invoices_out = []

    for d in docs:
        bal = float(d.balance_due)
        try:
            due = date.fromisoformat(d.due_date[:10])
            days_overdue = (ref_today - due).days
        except Exception:
            days_overdue = 0

        if days_overdue <= 0:
            corriente += bal
        elif days_overdue <= 30:
            vencido += bal
        else:
            critico += bal

        invoices_out.append({
            "number": d.document_number,
            "customer": d.customer_name,
            "dueDate": d.due_date,
            "original": float(d.total_amount),
            "balance": bal,
            "daysOverdue": max(0, days_overdue),
        })

    total_cxc = corriente + vencido + critico
    return {
        "kpis": {
            "corriente": round(corriente, 2),
            "vencido": round(vencido, 2),
            "critico": round(critico, 2),
            "total": round(total_cxc, 2),
        },
        "invoices": invoices_out,
    }


@sales_ws_router.post("/sales/cxc/payments", summary="Registrar recibo de caja / abono a factura al crédito CxC")
@sales_ws_router.post("/sales/cxc/payments/", include_in_schema=False)
def register_cxc_payment(payload: Dict[str, Any], db: Session = Depends(get_db)):
    company = ensure_sales_workspace_seed(db)
    inv_number = (payload.get("invoice_number") or "").strip()
    monto = Decimal(str(payload.get("amount", 0)))
    cuenta_destino = (payload.get("account_code") or "1.1.01.01.01").strip()
    referencia = (payload.get("reference") or "REC-CAJA").strip()

    doc = db.scalar(select(SalesFiscalDocument).where(SalesFiscalDocument.document_number == inv_number))
    if not doc:
        raise HTTPException(status_code=404, detail=f"Factura {inv_number} no encontrada en Cartera CxC")

    if monto <= 0 or monto > doc.balance_due + Decimal("0.05"):
        raise HTTPException(status_code=400, detail="Monto de abono inválido o superior al saldo pendiente")

    doc.balance_due = max(Decimal("0.00"), doc.balance_due - monto)
    doc.paid_amount = doc.paid_amount + monto

    # Generar asiento contable (Debe: Caja/Banco seleccionado vs Haber: 1.1.02.01.01 Clientes Nacionales CxC)
    je = create_accounting_entry(
        db=db,
        company_id=company.id,
        entry_date_str=date.today().isoformat(),
        concept=f"Recibo de Abono CxC Factura {inv_number} - {doc.customer_name} (Ref: {referencia})",
        source_doc_type="CXC_RECEIPT",
        source_doc_id=referencia,
        lines_spec=[
            {
                "account_code": cuenta_destino,
                "description": f"Ingreso por Cobro CxC Fac {inv_number} ({referencia})",
                "debit": float(monto),
                "credit": 0.0,
                "third_party_id": doc.customer_tax_id,
                "third_party_name": doc.customer_name,
            },
            {
                "account_code": "1.1.02.01.01",
                "description": f"Abono a Clientes Nacionales CxC Fac {inv_number}",
                "debit": 0.0,
                "credit": float(monto),
                "third_party_id": doc.customer_tax_id,
                "third_party_name": doc.customer_name,
            },
        ],
    )

    db.commit()
    return {
        "status": "OK",
        "invoice_number": inv_number,
        "abono_aplicado": float(monto),
        "new_balance": float(doc.balance_due),
        "nuevo_saldo": float(doc.balance_due),
        "journal_entry_id": str(je.id) if je else None,
        "cxc_snapshot": get_cxc_portfolio(db),
    }


@sales_ws_router.get("/sales/control/metrics", summary="Métricas de Presupuesto de Ventas y Comisiones sobre Cobrado")
@sales_ws_router.get("/sales/control/metrics/", include_in_schema=False)
def get_sales_control_metrics(db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    docs = db.scalars(
        select(SalesFiscalDocument).where(SalesFiscalDocument.status == "VIGENTE")
    ).all()

    # Base figures for Nov 2026 + real emitted documents
    base_facturado_daniel = 182500.00
    base_cobrado_daniel = 154000.00
    base_facturado_arsenio = 141500.00
    base_cobrado_arsenio = 121500.00

    extra_facturado = 0.0
    extra_cobrado = 0.0
    for d in docs:
        if d.document_number not in ("000-001-01-00045210", "000-001-01-00045225"):
            sign = -1.0 if d.doc_type_code == "06" else 1.0
            f_amt = float(d.total_amount) * sign
            c_amt = float(d.paid_amount) * sign
            extra_facturado += f_amt
            extra_cobrado += c_amt
            if "Arsenio" in (d.salesperson or ""):
                base_facturado_arsenio += f_amt
                base_cobrado_arsenio += c_amt
            else:
                base_facturado_daniel += f_amt
                base_cobrado_daniel += c_amt

    meta_mensual = 450000.00
    real_ejecutado = 324000.00 + extra_facturado
    pct_ejecutado = round((real_ejecutado / meta_mensual) * 100.0, 1) if meta_mensual > 0 else 0.0

    tasa_comision = 0.03
    comision_daniel = round(max(0.0, base_cobrado_daniel) * tasa_comision, 2)
    comision_arsenio = round(max(0.0, base_cobrado_arsenio) * tasa_comision, 2)
    total_comisiones = round(comision_daniel + comision_arsenio, 2)

    return {
        "budget_meta": meta_mensual,
        "meta_presupuestada": meta_mensual,
        "budget_executed": round(real_ejecutado, 2),
        "real_ejecutado": round(real_ejecutado, 2),
        "pct_ejecutado": pct_ejecutado,
        "commissions_liquidated": total_comisiones,
        "total_comisiones": total_comisiones,
        "weighted_margin_pct": 28.4,
        "margen_bruto_ponderado": 28.4,
        "salespeople": [
            {
                "name": "Daniel Alonso (Ventas Piso / POS)",
                "billed": round(base_facturado_daniel, 2),
                "collected": round(base_cobrado_daniel, 2),
                "rate": 0.03,
                "commission": comision_daniel,
                "status": "AUTORIZADO",
            },
            {
                "name": "Arsenio Córdova (Cuentas Clave / B2B)",
                "billed": round(base_facturado_arsenio, 2),
                "collected": round(base_cobrado_arsenio, 2),
                "rate": 0.03,
                "commission": comision_arsenio,
                "status": "AUTORIZADO",
            },
        ],
        "vendedores": [
            {
                "nombre": "Daniel Alonso (Ventas Piso / POS)",
                "total_facturado": round(base_facturado_daniel, 2),
                "total_cobrado": round(base_cobrado_daniel, 2),
                "tasa_pct": 3.0,
                "comision_devengada": comision_daniel,
                "estado": "AUTORIZADO",
            },
            {
                "nombre": "Arsenio Córdova (Cuentas Clave / B2B)",
                "total_facturado": round(base_facturado_arsenio, 2),
                "total_cobrado": round(base_cobrado_arsenio, 2),
                "tasa_pct": 3.0,
                "comision_devengada": comision_arsenio,
                "estado": "AUTORIZADO",
            },
        ],
    }


# =============================================================================
# ENDPOINTS 7: LIBRO FISCAL DE VENTAS SAR (ALIMENTA libro_ventas_ledger.html)
# =============================================================================
@sales_ws_router.get("/sales/book", summary="Libro Fiscal de Ventas SAR (01 Facturas, 06 NC, 05 ND y ANULADAS)")
@sales_ws_router.get("/sales/book/", include_in_schema=False)
def get_sar_sales_book(db: Session = Depends(get_db)):
    ensure_sales_workspace_seed(db)
    docs = db.scalars(
        select(SalesFiscalDocument).order_by(SalesFiscalDocument.issue_date.desc(), SalesFiscalDocument.created_at.desc())
    ).all()

    rows = []
    for d in docs:
        sign = -1.0 if d.doc_type_code == "06" and d.status != "ANULADA" else 1.0
        tipo_map = {"01": "FACTURA", "06": "NOTA_CREDITO", "05": "NOTA_DEBITO"}
        rows.append({
            "id": str(d.id),
            "fecha": d.issue_date,
            "num_doc": d.document_number,
            "factura": d.document_number,
            "tipo_doc": tipo_map.get(d.doc_type_code, "FACTURA"),
            "doc_type_code": d.doc_type_code,
            "cai": d.cai,
            "rtn": d.customer_tax_id,
            "cliente": d.customer_name,
            "condicion": "ANULADA" if d.status == "ANULADA" else d.sale_condition,
            "exento": 0.0 if d.status == "ANULADA" else round(float(d.subtotal_exempt) * sign, 2),
            "gravado_15": 0.0 if d.status == "ANULADA" else round(float(d.subtotal_grav15) * sign, 2),
            "grav15": 0.0 if d.status == "ANULADA" else round(float(d.subtotal_grav15) * sign, 2),
            "gravado_18": 0.0 if d.status == "ANULADA" else round(float(d.subtotal_grav18) * sign, 2),
            "grav18": 0.0 if d.status == "ANULADA" else round(float(d.subtotal_grav18) * sign, 2),
            "isv_15": 0.0 if d.status == "ANULADA" else round(float(d.isv15) * sign, 2),
            "isv15": 0.0 if d.status == "ANULADA" else round(float(d.isv15) * sign, 2),
            "isv_18": 0.0 if d.status == "ANULADA" else round(float(d.isv18) * sign, 2),
            "isv18": 0.0 if d.status == "ANULADA" else round(float(d.isv18) * sign, 2),
            "total": 0.0 if d.status == "ANULADA" else round(float(d.total_amount) * sign, 2),
            "estado_sar": d.status,
            "estado": d.status,
            "asiento_id": str(d.journal_entry_id) if d.journal_entry_id else "SAR-OK",
        })
    return rows
