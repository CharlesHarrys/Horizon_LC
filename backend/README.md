# Enterprise ERP Suite - Backend

Backend modular y multi-tenant construido con **FastAPI**, **SQLAlchemy 2.0** y **PostgreSQL**, diseñado bajo estándares internacionales de contabilidad (**NIIF**) y normativas tributarias de **Honduras (SAR)**.

---

## 🏛️ Estructura del Proyecto

```
backend/
├── app/
│   ├── api/                           # Controladores y Endpoints REST
│   │   └── v1/
│   │       ├── router.py              # Agregador de rutas v1
│   │       ├── companies.py           # Gestión de Empresas / Inquilinos
│   │       ├── custom_fields.py       # Definiciones de campos dinámicos JSONB
│   │       └── accounts.py            # Catálogo de Cuentas NIIF y Árbol Jerárquico
│   ├── core/                          # Núcleo del sistema
│   │   ├── config.py                  # Variables de entorno y configuración
│   │   ├── database.py                # Conexión SQLAlchemy 2.0 y gestión de sesiones
│   │   ├── exceptions.py              # Excepciones de dominio fiscal y contable
│   │   └── security.py                # Utilidades criptográficas y de seguridad
│   ├── models/                        # Modelos Declarativos de Base de Datos
│   │   ├── base.py                    # Base, UUID, Timestamps, Multi-tenancy y JSONB Mixins
│   │   ├── system.py                  # sys_companies, sys_custom_field_definitions, audit_logs
│   │   └── accounting.py              # acc_accounts (Catálogo jerárquico NIIF)
│   ├── schemas/                       # Validación de entrada/salida (Pydantic v2)
│   │   ├── common.py                  # Esquemas base y paginación
│   │   ├── company.py                 # Esquemas para empresas y validación RTN
│   │   ├── custom_field.py            # Esquemas de metadatos para campos dinámicos
│   │   └── account.py                 # Esquemas contables y representación en árbol
│   ├── services/                      # Lógica de Negocio y Reglas de Dominio
│   │   ├── company_service.py         # CRUD y lógica de empresas
│   │   ├── custom_field_service.py    # Gestión de campos personalizados
│   │   └── account_service.py         # Validaciones de árbol jerárquico y postabilidad
│   ├── utils/                         # Utilidades y Validadores
│   │   └── validators.py              # Validador de RTN Honduras y jerarquía de cuentas
│   └── main.py                        # Punto de entrada de la aplicación FastAPI
├── migrations/                        # Migraciones automáticas con Alembic
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── alembic.ini                        # Configuración de Alembic
├── requirements.txt                   # Dependencias de Python
└── README.md                          # Documentación del proyecto
```

---

## 🗄️ Modelos de Base de Datos (Fase 1 y 2)

### 1. `sys_companies` (Empresas / Multi-Tenant)
- Aislamiento multi-inquilino estricto mediante `company_id`.
- Soporte para **3 Niveles Operativos**:
  - `1`: Servicios (sin Kardex).
  - `2`: Híbrido - Comercio & Servicios (Kardex Costo Promedio Ponderado + Landed Cost).
  - `3`: Manufactura (Inventario tripartito: MPD, PP, PT + MOD + CIF).
- Control de RTN hondureño validado (14 dígitos), moneda funcional base (`HNL`, `USD`) y campo `custom_values` en formato `JSONB`.

### 2. `sys_custom_field_definitions` (Campos Dinámicos)
- Permite extender entidades (`acc_accounts`, `pur_invoices`, etc.) en tiempo de ejecución sin ejecutar migraciones DDL.
- Tipos soportados: `text`, `number`, `boolean`, `date`, `select`, `currency`.

### 3. `acc_accounts` (Catálogo de Cuentas Jerárquico NIIF)
- Formato jerárquico estricto (ej. `1.1.01.01.0001`).
- Clasificación NIIF: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`, `COST`.
- Naturaleza contable: `DEBIT` (Deudora) y `CREDIT` (Acreedora).
- Regla de Integridad Contable: **Solo las cuentas hoja (`is_postable = True`) pueden recibir asientos**.
- Bandera `is_revaluation_subject` para corrida automática mensual de revaluación cambiaria según tipo de cambio oficial BCH.

### 4. `audit_logs` (Bitácora de Auditoría)
- Registro inmutable de transacciones, modificaciones de registros y bloqueos de períodos (*Soft/Hard Close*) con captura diferencial `before_state`, `after_state` y `changes` en `JSONB`.

---

## 🚀 Puesta en Marcha

### 1. Instalación de dependencias
```bash
cd backend
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configuración de Base de Datos
Asegúrese de configurar las credenciales en `connect.env` o `.env`:
```env
DATABASE_URL=postgresql://usuario_erp:password_seguro@localhost:5432/erp_database
SECRET_KEY=clave_secreta_jwt_para_sesiones
STORAGE_PATH=./storage/evidence/
```

### 3. Ejecutar Migraciones
```bash
alembic upgrade head
```

### 4. Iniciar el Servidor de Desarrollo
```bash
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva disponible en:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`
