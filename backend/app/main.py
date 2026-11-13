import sys, os
BASE_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_BACKEND_DIR not in sys.path:
    sys.path.insert(0, BASE_BACKEND_DIR)

"""Main entry point for the FastAPI Enterprise ERP Application."""
import uuid
import calendar
from datetime import date
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, SessionLocal, auto_migrate_sqlite_schema
from app.models.base import Base
from app.models.system import Company
from app.models.accounting import (
    Account,
    AccountType,
    AccountNature,
    FiscalPeriod,
)
import app.models.procurement
import app.models.inventory
import app.models.sales
import app.models.auxiliaries
import sales.models
from sales.router import sales_ws_router, ensure_sales_workspace_seed
from app.api.v1.router import api_router


def seed_development_defaults(db: Session) -> None:
    """Inicializa automáticamente empresa, períodos fiscales y catálogo contable de desarrollo."""
    # 1. Crear empresa predeterminada de desarrollo si sys_companies está vacía
    stmt_comp = select(Company).limit(1)
    company = db.scalar(stmt_comp)
    if not company:
        company = Company(
            id=uuid.uuid4(),
            tax_id="08011995123456",
            legal_name="Empresa Demo Honduras S.A.",
            trade_name="Empresa Demo Honduras",
            operational_level=3,
            country_code="HND",
            currency_code="HNL",
            fiscal_year_start_month=1,
            is_active=True,
        )
        db.add(company)
        db.flush()

    # 2. Crear períodos fiscales 2026 si no existen
    stmt_fp = select(FiscalPeriod).where(FiscalPeriod.company_id == company.id).limit(1)
    if not db.scalar(stmt_fp):
        for m in range(1, 13):
            _, last_day = calendar.monthrange(2026, m)
            fp = FiscalPeriod(
                company_id=company.id,
                fiscal_year=2026,
                period_number=m,
                name=f"Período {m:02d}-2026",
                start_date=date(2026, m, 1),
                end_date=date(2026, m, last_day),
                is_locked=False,
                is_hard_closed=False,
            )
            db.add(fp)
        db.flush()

    # 3. Crear catálogo contable de desarrollo si no existen cuentas
    stmt_acc = select(Account).where(Account.company_id == company.id).limit(1)
    if not db.scalar(stmt_acc):
        accounts_data = [
            ("1.1.01.01", "Fondo Fijo Caja Chica Principal", AccountType.ASSET, AccountNature.DEBIT, 4, True),
            ("1.1.01.02", "Bancos Nacionales Moneda Local", AccountType.ASSET, AccountNature.DEBIT, 4, True),
            ("1.1.02", "Cuentas por Cobrar Clientes", AccountType.ASSET, AccountNature.DEBIT, 3, True),
            ("1.1.03", "Inventario de Mercaderías", AccountType.ASSET, AccountNature.DEBIT, 3, True),
            ("1.1.05", "ISV Crédito Fiscal 15% / 18%", AccountType.ASSET, AccountNature.DEBIT, 3, True),
            ("1.1.06", "Anticipos a Proveedores", AccountType.ASSET, AccountNature.DEBIT, 3, True),
            ("1.1.07.01", "Seguros Pagados por Adelantado", AccountType.ASSET, AccountNature.DEBIT, 4, True),
            ("1.2.01.01", "Equipo de Cómputo (NIC 16)", AccountType.ASSET, AccountNature.DEBIT, 4, True),
            ("2.1.01", "Cuentas por Pagar Proveedores", AccountType.LIABILITY, AccountNature.CREDIT, 3, True),
            ("2.1.02", "ISV Débito Fiscal", AccountType.LIABILITY, AccountNature.CREDIT, 3, True),
            ("2.1.03.01", "Retención 1% ISV por Enterar (SAR)", AccountType.LIABILITY, AccountNature.CREDIT, 4, True),
            ("2.1.04", "Banco / Liquidación Aduanas", AccountType.LIABILITY, AccountNature.CREDIT, 3, True),
            ("3.1.01", "Capital Social Suscrito y Pagado", AccountType.EQUITY, AccountNature.CREDIT, 3, True),
            ("4.1.01", "Venta de Mercaderías y Servicios", AccountType.REVENUE, AccountNature.CREDIT, 3, True),
            ("5.1.01", "Costo de Ventas Mercaderías", AccountType.COST, AccountNature.DEBIT, 3, True),
            ("5.2.01.03", "Honorarios Profesionales Legales", AccountType.EXPENSE, AccountNature.DEBIT, 4, True),
            ("5.2.01.04", "Servicios Públicos (ENEE / SANAA)", AccountType.EXPENSE, AccountNature.DEBIT, 4, True),
            ("5.2.01.08", "Papelería y Útiles de Oficina", AccountType.EXPENSE, AccountNature.DEBIT, 4, True),
            ("5.2.01.10", "Gasto por Seguros Devengados", AccountType.EXPENSE, AccountNature.DEBIT, 4, True),
            ("5.2.01.20", "Gasto de Depreciación Equipos (NIC 16)", AccountType.EXPENSE, AccountNature.DEBIT, 4, True),
        ]
        for code, name, acc_type, nature, level, is_postable in accounts_data:
            acc = Account(
                company_id=company.id,
                code=code,
                name=name,
                account_type=acc_type,
                nature=nature,
                level=level,
                is_postable=is_postable,
                currency_code="HNL",
                is_active=True,
            )
            db.add(acc)
        db.flush()

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestor de ciclo de vida: crea tablas relacionales, auto-migra columnas faltantes y siembra datos iniciales."""
    # 1. Crear tablas relacionales si no existen
    Base.metadata.create_all(bind=engine)

    # 2. Auto-migrar columnas faltantes en SQLite
    auto_migrate_sqlite_schema(engine)

    # 3. Sembrar datos predeterminados
    with SessionLocal() as db:
        seed_development_defaults(db)
        ensure_sales_workspace_seed(db)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="""
    ## Enterprise ERP Suite Backend API
    - **Multi-tenant Architecture:** Aislamiento estricto por `company_id`.
    - **NIIF & SAR Honduras:** Plan de cuentas jerárquico y validaciones fiscales.
    - **Campos Dinámicos:** Extensibilidad en tiempo de ejecución vía metadatos JSONB.
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

from fastapi import Request
from fastapi.responses import JSONResponse
from sales.models import TablePreOrder

@app.middleware("http")
async def audit_open_preorders_on_cash_close(request: Request, call_next):
    path_lower = request.url.path.lower()
    if request.method in ("POST", "PUT", "PATCH") and (
        ("cash-sessions" in path_lower and ("close" in path_lower or "cierre" in path_lower))
        or ("pos/sessions" in path_lower and ("close" in path_lower or "cierre" in path_lower))
    ):
        with SessionLocal() as db:
            open_orders = db.scalars(
                select(TablePreOrder).where(TablePreOrder.status == "OPEN")
            ).all()
            unjustified = [
                o.id for o in open_orders
                if not (o.close_justification and len(o.close_justification.strip()) > 3)
            ]
            if unjustified:
                return JSONResponse(
                    status_code=400,
                    content={
                        "detail": f"Auditoría de Caja: No se puede cerrar turno. Pre-órdenes abiertas sin justificación en #input-preorden-justificacion: {', '.join(unjustified)}",
                        "unjustified_preorders": unjustified,
                    },
                )
    return await call_next(request)

app.include_router(sales_ws_router, prefix=settings.API_V1_STR)
app.include_router(sales_ws_router, prefix="/api")
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

# Static files mounting
static_dir_candidates = [
    Path(__file__).resolve().parent.parent.parent / "static",
    Path(__file__).resolve().parent.parent / "static",
    Path("static").resolve(),
]
for s_dir in static_dir_candidates:
    if s_dir.exists():
        app.mount("/static", StaticFiles(directory=str(s_dir)), name="static")
        break


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for container orchestrators and monitoring."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/workspace", response_class=HTMLResponse, tags=["Workspace Ground Truth"])
@app.get("/compras", response_class=HTMLResponse, tags=["Workspace Ground Truth"])
@app.get("/workspace_compras", response_class=HTMLResponse, tags=["Workspace Ground Truth"])
@app.get("/workspace-compras", response_class=HTMLResponse, tags=["Workspace Ground Truth"])
@app.get("/workspace_compras.html", response_class=HTMLResponse, tags=["Workspace Ground Truth"])
@app.get("/compras.html", response_class=HTMLResponse, tags=["Workspace Ground Truth"])
def get_workspace_compras():
    """Sirve la interfaz Ground Truth del Workspace de Compras & Egresos."""
    from pathlib import Path
    html_path = Path(__file__).parent.parent.parent / "workspace_compras.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent / "public" / "workspace_compras.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace HTML no encontrado</h1>", status_code=404)


@app.get("/compras/libro-compras", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro_compras_ledger.html", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro-compras-ledger", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro_compras_ledger", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro-compras", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro_compras", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace_libro_compras", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace-libro-compras", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
def get_libro_compras_page():
    """Sirve la interfaz visual del Libro Fiscal de Compras SAR (Crédito Fiscal)."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "libro_compras_ledger.html",
        Path(__file__).parent.parent.parent / "workspace_libros_fiscales.html",
        Path(__file__).parent.parent.parent / "templates" / "libros_fiscales.html",
        Path(__file__).parent.parent.parent / "libro_compras.html",
        Path(__file__).parent.parent / "public" / "workspace_libros_fiscales.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_libros_fiscales.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Libro de Compras HTML no encontrado</h1>", status_code=404)



@app.get("/cxp", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
@app.get("/workspace_cxp", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
@app.get("/workspace-cxp", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
@app.get("/pagos", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
def get_workspace_cxp():
    """Sirve la interfaz operativa de Gestión de Pagos & CxP (Facturas Comerciales, Pagos Varios y Lotes ACH)."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "templates" / "cxp.html",
        Path(__file__).parent.parent.parent / "workspace_cxp.html",
        Path(__file__).parent.parent / "templates" / "cxp.html",
        Path(__file__).parent.parent / "public" / "workspace_cxp.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_cxp.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace CXP HTML no encontrado</h1>", status_code=404)


@app.get("/proveedores/estados-de-cuenta", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
@app.get("/proveedores/estados_cuenta", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
@app.get("/estados-de-cuenta-proveedores", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
@app.get("/proveedores", response_class=HTMLResponse, tags=["Accounts Payable & Treasury Workspace"])
def get_proveedores_estados_cuenta():
    """Sirve la interfaz independiente de Estados de Cuenta & Antigüedad de Proveedores."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "templates" / "proveedores_estados_cuenta.html",
        Path(__file__).parent.parent.parent / "workspace_proveedores_estados_cuenta.html",
        Path(__file__).parent.parent / "templates" / "proveedores_estados_cuenta.html",
        Path(__file__).parent.parent / "public" / "workspace_proveedores_estados_cuenta.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_proveedores_estados_cuenta.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Estados de Cuenta de Proveedores HTML no encontrado</h1>", status_code=404)


@app.get("/cxc", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
@app.get("/workspace_cxc", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
@app.get("/workspace-cxc", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
@app.get("/cartera", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
@app.get("/workspace_cartera", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
@app.get("/workspace-cartera", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
@app.get("/clientes", response_class=HTMLResponse, tags=["Accounts Receivable & Treasury Workspace"])
def get_workspace_cxc():
    """Sirve la interfaz del Workspace de Cuentas por Cobrar & Cartera de Clientes."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "workspace_cartera.html",
        Path(__file__).parent.parent.parent / "templates" / "cartera.html",
        Path(__file__).parent.parent.parent / "workspace_cxc.html",
        Path(__file__).parent.parent / "public" / "workspace_cartera.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_cartera.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace CXC / Cartera HTML no encontrado</h1>", status_code=404)



@app.get("/sales_workspace.html", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/sales_workspace", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/ventas", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/workspace_ventas", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/workspace-ventas", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/workspace_ventas.html", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/ventas.html", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/ingresos", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/workspace_ingresos", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
@app.get("/workspace_ingresos.html", response_class=HTMLResponse, tags=["Sales & Billing Workspace"])
def get_workspace_ventas():
    """Sirve la interfaz del Workspace de Ventas & Gestión Comercial (sales_workspace.html / workspace_ventas.html)."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "sales_workspace.html",
        Path(__file__).parent.parent.parent / "workspace_ventas.html",
        Path(__file__).parent.parent / "public" / "workspace_ventas.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_ventas.html",
    ]
    for html_path in candidates:
        if html_path.exists():
            return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Ventas HTML no encontrado</h1>", status_code=404)


@app.get("/libro_ventas_ledger.html", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro_ventas_ledger", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace_libro_ventas.html", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro-ventas", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libro_ventas", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace_libro_ventas", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace-libro-ventas", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/ventas/libro-ventas", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libros-fiscales", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/libros_fiscales", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace_libros_fiscales", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/workspace-libros-fiscales", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/det-live", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
@app.get("/sar-252", response_class=HTMLResponse, tags=["Fiscal Reporting UI"])
def get_libro_ventas_page():
    """Sirve la interfaz visual unificada de Libros Fiscales SAR, Ventas, Compras y Conciliación DET Live."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "libro_ventas_ledger.html",
        Path(__file__).parent.parent.parent / "workspace_libro_ventas.html",
        Path(__file__).parent.parent.parent / "workspace_libros_fiscales.html",
        Path(__file__).parent.parent.parent / "templates" / "libros_fiscales.html",
        Path(__file__).parent.parent.parent / "libro_compras_ledger.html",
        Path(__file__).parent.parent / "public" / "workspace_libros_fiscales.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_libros_fiscales.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Libro de Ventas / Libros Fiscales HTML no encontrado</h1>", status_code=404)



@app.get("/pos-reconciliation", response_class=HTMLResponse, tags=["POS Batch Reconciliation & Acquiring"])
@app.get("/pos_reconciliation", response_class=HTMLResponse, tags=["POS Batch Reconciliation & Acquiring"])
@app.get("/workspace_pos_reconciliation", response_class=HTMLResponse, tags=["POS Batch Reconciliation & Acquiring"])
@app.get("/workspace-pos-reconciliation", response_class=HTMLResponse, tags=["POS Batch Reconciliation & Acquiring"])
@app.get("/adquirencia", response_class=HTMLResponse, tags=["POS Batch Reconciliation & Acquiring"])
@app.get("/adquirencia/conciliacion", response_class=HTMLResponse, tags=["POS Batch Reconciliation & Acquiring"])
def get_pos_reconciliation_page():
    """Sirve la interfaz del Módulo de Conciliación de Lotes POS vs. Depósitos Bancarios."""
    from pathlib import Path
    html_path = Path(__file__).parent.parent.parent / "workspace_pos_reconciliation.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent / "public" / "workspace_pos_reconciliation.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_pos_reconciliation.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Conciliación POS HTML no encontrado</h1>", status_code=404)


@app.get("/bancos", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/workspace_bancos", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/workspace-bancos", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/workspace_bancos.html", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/bancos.html", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/tesoreria", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/workspace_tesoreria", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/workspace_tesoreria.html", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/conciliacion-bancaria", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
@app.get("/workspace_conciliacion_bancaria", response_class=HTMLResponse, tags=["Smart Bank & Auto-Reconciliation"])
def get_workspace_bancos_page():
    """Sirve la interfaz del Módulo Bancario Inteligente, Conciliación Predictiva y Auto-Posteo Contable."""
    from pathlib import Path
    html_path = Path(__file__).parent.parent.parent / "workspace_bancos.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent / "public" / "workspace_bancos.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_bancos.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Bancos HTML no encontrado</h1>", status_code=404)


@app.get("/bancos/proyecciones", response_class=HTMLResponse, tags=["Business Intelligence & Projections"])
@app.get("/proyecciones", response_class=HTMLResponse, tags=["Business Intelligence & Projections"])
@app.get("/workspace_proyecciones.html", response_class=HTMLResponse, tags=["Business Intelligence & Projections"])
@app.get("/workspace_proyecciones", response_class=HTMLResponse, tags=["Business Intelligence & Projections"])
@app.get("/workspace-proyecciones", response_class=HTMLResponse, tags=["Business Intelligence & Projections"])
@app.get("/bi", response_class=HTMLResponse, tags=["Business Intelligence & Projections"])
def get_workspace_proyecciones_page():
    """Sirve la interfaz del Dashboard Studio de Proyecciones Financieras & BI."""
    from pathlib import Path
    html_path = Path(__file__).parent.parent.parent / "workspace_proyecciones.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent / "public" / "workspace_proyecciones.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_proyecciones.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Proyecciones HTML no encontrado</h1>", status_code=404)


@app.get("/logistica", response_class=HTMLResponse, tags=["Logistics & Supply Chain"])
@app.get("/logistica-general", response_class=HTMLResponse, tags=["Logistics & Supply Chain"])
@app.get("/workspace_logistica_general.html", response_class=HTMLResponse, tags=["Logistics & Supply Chain"])
@app.get("/workspace_logistica_general", response_class=HTMLResponse, tags=["Logistics & Supply Chain"])
@app.get("/inventarios", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/workspace_inventarios.html", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/workspace_inventario.html", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/workspace_inventarios", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/workspace-inventarios", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/inventario", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/workspace_inventario", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/workspace-inventario", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
@app.get("/kardex", response_class=HTMLResponse, tags=["Inventory & Continuous Kardex (CPP)"])
def get_workspace_inventario_page():
    """Sirve la interfaz oficial del Módulo Unificado de Logística General, Inventarios, Producción y Control."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "workspace_logistica_general.html",
        Path(__file__).parent.parent / "templates" / "workspace_logistica_general.html",
        Path(__file__).parent.parent.parent / "templates" / "workspace_logistica_general.html",
        Path(__file__).parent.parent / "public" / "workspace_logistica_general.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_logistica_general.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Logística General HTML no encontrado</h1>", status_code=404)
@app.get("/produccion", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
@app.get("/workspace_produccion", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
@app.get("/workspace-produccion", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
@app.get("/recetas", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
@app.get("/escandallos", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
@app.get("/ordenes-produccion", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
@app.get("/ordenes_produccion", response_class=HTMLResponse, tags=["Manufacturing & Recipe Costing"])
def get_workspace_produccion_page():
    """Sirve la interfaz oficial de Gestión de Producción, Recetas/Escandallos y Órdenes de Fabricación."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "templates" / "produccion.html",
        Path(__file__).parent.parent.parent / "workspace_produccion.html",
        Path(__file__).parent.parent / "templates" / "produccion.html",
        Path(__file__).parent.parent / "public" / "workspace_produccion.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_produccion.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Producción HTML no encontrado</h1>", status_code=404)


@app.get("/contabilidad", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/workspace_contabilidad_metro_format_2.html", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/workspace_contabilidad_metro_format_2", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/workspace_contabilidad", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/workspace-contabilidad", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/workspace_contabilidad.html", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/contabilidad.html", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/diario", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
@app.get("/libro-diario", response_class=HTMLResponse, tags=["General Ledger & Journal Entries"])
def get_workspace_contabilidad_page():
    """Sirve la interfaz oficial del Módulo de Contabilidad Central & Libro Diario Multimoneda."""
    from pathlib import Path
    html_path = Path(__file__).parent.parent.parent / "workspace_contabilidad_metro_format_2.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent.parent / "workspace_contabilidad.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent / "public" / "workspace_contabilidad.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_contabilidad.html"
    if not html_path.exists():
        html_path = Path(__file__).parent.parent.parent / "templates" / "contabilidad.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
@app.get("/presupuestos", response_class=HTMLResponse, tags=["Budgeting & Financial Simulation"])
@app.get("/workspace_presupuestos", response_class=HTMLResponse, tags=["Budgeting & Financial Simulation"])
@app.get("/workspace-presupuestos", response_class=HTMLResponse, tags=["Budgeting & Financial Simulation"])
@app.get("/workspace_presupuestos.html", response_class=HTMLResponse, tags=["Budgeting & Financial Simulation"])
@app.get("/simulador-financiero", response_class=HTMLResponse, tags=["Budgeting & Financial Simulation"])
def get_presupuestos_page():
    """Sirve la interfaz oficial del Módulo de Control Presupuestario Maestro y Simulador Financiero What-If."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "workspace_presupuestos.html",
        Path(__file__).parent.parent / "templates" / "workspace_presupuestos.html",
        Path(__file__).parent.parent.parent / "templates" / "workspace_presupuestos.html",
        Path(__file__).parent.parent / "public" / "workspace_presupuestos.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_presupuestos.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Workspace Presupuestos HTML no encontrado</h1>", status_code=404)


@app.get("/estados-financieros", response_class=HTMLResponse, tags=["Financial Statements & NIIF Reporting"])
@app.get("/eeff", response_class=HTMLResponse, tags=["Financial Statements & NIIF Reporting"])
@app.get("/balance-general", response_class=HTMLResponse, tags=["Financial Statements & NIIF Reporting"])
@app.get("/workspace_estados_financieros.html", response_class=HTMLResponse, tags=["Financial Statements & NIIF Reporting"])
@app.get("/workspace_estados_financieros", response_class=HTMLResponse, tags=["Financial Statements & NIIF Reporting"])
@app.get("/workspace-estados-financieros", response_class=HTMLResponse, tags=["Financial Statements & NIIF Reporting"])
def get_estados_financieros_page():
    """Sirve la interfaz del Módulo Oficial de Estados Financieros NIIF & Cierre Contable."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "workspace_estados_financieros.html",
        Path(__file__).parent.parent.parent / "templates" / "estados_financieros.html",
        Path(__file__).parent.parent / "public" / "workspace_estados_financieros.html",
        Path(__file__).parent.parent.parent / "frontend" / "public" / "workspace_estados_financieros.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Estados Financieros HTML no encontrado</h1>", status_code=404)




@app.get("/rrhh", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
@app.get("/workspace_rrhh", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
@app.get("/workspace-rrhh", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
@app.get("/workspace_rrhh.html", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
@app.get("/rrhh.html", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
@app.get("/planillas", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
@app.get("/activos-fijos", response_class=HTMLResponse, tags=["Human Resources & Payroll"])
def get_workspace_rrhh_page():
    """Sirve la interfaz oficial del Módulo de Planillas, Nómina & Activos Fijos NIIF."""
    from pathlib import Path
    candidates = [
        Path(__file__).parent.parent.parent / "workspace_rrhh.html",
        Path(__file__).parent.parent / "templates" / "workspace_rrhh.html",
        Path(__file__).parent.parent.parent / "templates" / "workspace_rrhh.html",
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Módulo de Planillas & Activos Fijos HTML no encontrado</h1>", status_code=404)


@app.get("/", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
@app.get("/dashboard", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
@app.get("/dashboard.html", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
@app.get("/lobby", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
@app.get("/workspace_lobby", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
@app.get("/workspace-lobby", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
@app.get("/workspace_lobby.html", response_class=HTMLResponse, tags=["Main Lobby & Control Center"])
def get_lobby_page():
    """Sirve el Centro de Control Principal y Hub de Ecosistema ERP (Horizon Ledger Cockpit)."""
    from pathlib import Path
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "workspace_lobby.html",
        Path(__file__).resolve().parent.parent.parent / "templates" / "workspace_lobby.html",
        Path(__file__).resolve().parent.parent / "templates" / "workspace_lobby.html",
        Path(__file__).resolve().parent.parent.parent / "templates" / "dashboard.html",
        Path(__file__).resolve().parent.parent / "templates" / "dashboard.html",
        Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "workspace_lobby.html",
        Path(__file__).resolve().parent.parent / "public" / "workspace_lobby.html",
        Path("workspace_lobby.html").resolve(),
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Dashboard / Lobby HTML no encontrado</h1>", status_code=404)


@app.get("/lobby-lab", response_class=HTMLResponse, tags=["Design Prototyping Lab"])
@app.get("/lobby_preview_lab", response_class=HTMLResponse, tags=["Design Prototyping Lab"])
@app.get("/workspace_lobby_lab", response_class=HTMLResponse, tags=["Design Prototyping Lab"])
def get_lobby_lab():
    """Sirve el Laboratorio Interactivo de Prototipos de Diseño del Lobby."""
    from pathlib import Path
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "lobby_preview_lab.html",
        Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "lobby_preview_lab.html",
        Path(__file__).resolve().parent.parent / "public" / "lobby_preview_lab.html",
        Path("lobby_preview_lab.html").resolve(),
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Lobby Preview Lab HTML no encontrado</h1>", status_code=404)











@app.get("/entorno_config.html", response_class=HTMLResponse, tags=["System Governance & Master Config"])
@app.get("/entorno_config", response_class=HTMLResponse, tags=["System Governance & Master Config"])
@app.get("/entorno-config", response_class=HTMLResponse, tags=["System Governance & Master Config"])
@app.get("/configuracion", response_class=HTMLResponse, tags=["System Governance & Master Config"])
def get_entorno_config_page():
    """Sirve el Módulo de Gobierno Corporativo, Parámetros SAR/NIIF y Bases de Datos Maestras (entorno_config.html)."""
    from pathlib import Path
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "entorno_config.html",
        Path(__file__).resolve().parent.parent.parent / "templates" / "entorno_config.html",
        Path(__file__).resolve().parent.parent / "templates" / "entorno_config.html",
        Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "entorno_config.html",
        Path("entorno_config.html").resolve(),
    ]
    for p in candidates:
        if p.exists():
            return HTMLResponse(content=p.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Configuración del Sistema HTML no encontrado</h1>", status_code=404)
