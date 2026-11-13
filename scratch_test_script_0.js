
    // =========================================================================
    // DICCIONARIO DE PREFIJOS DE CENTROS DE COSTOS (BUG 2 CORREGIDO)
    // =========================================================================
    const DICCIONARIO_PREFIJOS_CC = {
      CC: { nombre: 'Centro de Costos', badge: 'hds-badge-soft' },
      FT: { nombre: 'Fase de Proyecto', badge: 'hds-badge-cyan' },
      CP: { nombre: 'Centro de Producción', badge: 'hds-badge-solid' },
      MA: { nombre: 'Mantenimiento', badge: 'hds-badge-ember' }
    };

    // =========================================================================
    // ESTADO Y ARREGLOS MAESTROS DEL SISTEMA ERP HORIZON LC
    // =========================================================================
    let rolUsuarioSesion = 'N3'; // N1, N2 o N3
    let bovedaSeleccionada = 'N3';
    let segmentoActivo = 'config'; // 'config', 'prefs', 'bases'
    let factorFechaCatalogo = 1.0;
    let estadoOctubre2026 = '🟢 ABIERTO OPERATIVO';
    let estadoPeriodo13 = false;

    // 1. Establecimientos SAR
    const establecimientosSAR = [
      { codigo: '000', punto: '001', nombre: 'Casa Matriz TGU · Administración y Ventas', direccion: 'Blvd. Morazán, Torre Horizon Piso 8, Tegucigalpa M.D.C.', responsable: 'Lic. Carlos Hernández', estado: 'Activo' },
      { codigo: '000', punto: '002', nombre: 'Casa Matriz TGU · Caja Facturación Directa POS', direccion: 'Blvd. Morazán, Torre Horizon PB, Tegucigalpa M.D.C.', responsable: 'Lic. Elena Valladares', estado: 'Activo' },
      { codigo: '001', punto: '001', nombre: 'Sucursal SPS · Centro Logístico e Industrial', direccion: 'Anillo Periférico Norte, Complejo Industrial, San Pedro Sula', responsable: 'Ing. Marco Valle', estado: 'Activo' }
    ];

    // 2. Rangos CAI
    const caisAutorizados = [
      { doc: '05 · Comprobante de Retención', cai: '9F8E7D-6C5B4A-3210FE-DCBA98-765432-05', rango: '000-001-05-00000001 al 00001000', fechaLimite: '31/12/2026', estado: 'Vigente' },
      { doc: '01 · Factura Comercial', cai: '1A2B3C-4D5E6F-7890AB-CDEF12-345678-01', rango: '000-001-01-00000001 al 00015000', fechaLimite: '31/12/2026', estado: 'Vigente' }
    ];

    // 3. Centros de Costos (CC, FT, CP, MA)
    const centrosCostos = [
      { codigo: 'CC-01-101', categoria: 'Centro de Costos', badge: 'hds-badge-soft', nombre: 'Administración y Finanzas Central', desc: 'Administración y Finanzas Central', responsable: 'Lic. Carlos Hernández · TGU', resp: 'Lic. Carlos Hernández · TGU', presupuesto: 150000.00, fechaInicio: '01/01/2026', inicio: '01/01/2026', fechaCierre: 'En proceso', cierre: 'En proceso', estado: 'Activo' },
      { codigo: 'FT-02-201', categoria: 'Fase de Proyecto', badge: 'hds-badge-cyan', nombre: 'Cimentación y Obra Gris Nave Industrial', desc: 'Cimentación y Obra Gris Nave Industrial', responsable: 'Ing. Marco Valle · SPS', resp: 'Ing. Marco Valle · SPS', presupuesto: 850000.00, fechaInicio: '15/08/2026', inicio: '15/08/2026', fechaCierre: '30/11/2026', cierre: '30/11/2026', estado: 'Activo' },
      { codigo: 'CP-01-305', categoria: 'Centro de Producción', badge: 'hds-badge-solid', nombre: 'Línea de Ensamble y Empaque #3', desc: 'Línea de Ensamble y Empaque #3', responsable: 'Ing. Sandra López · Cortés', resp: 'Ing. Sandra López · Cortés', presupuesto: 420000.00, fechaInicio: '01/09/2026', inicio: '01/09/2026', fechaCierre: 'En proceso', cierre: 'En proceso', estado: 'Activo' },
      { codigo: 'MA-03-110', categoria: 'Mantenimiento', badge: 'hds-badge-ember', nombre: 'Overhaul Preventivo Flota Cabezales', desc: 'Overhaul Preventivo Flota Cabezales', responsable: 'Jefe Taller · Plantel Norte', resp: 'Jefe Taller · Plantel Norte', presupuesto: 95000.00, fechaInicio: '01/10/2026', inicio: '01/10/2026', fechaCierre: '31/10/2026', cierre: '31/10/2026', estado: 'Activo' }
    ];

    // 4. Catálogo Maestro de Cuentas Contables (NIIF / SAR — Centralizado para todo el ERP y Módulo de Compras)
    const catalogoCuentasNIIF = [
      // GRUPO 1: ACTIVO
      { codigo: '1.1.01', nombre: 'Efectivo y Equivalentes de Efectivo', desc: 'NIC 7 · Cajas Generales, Cajas Chicas y Bancos Locales/USD', naturaleza: 'DEBE', tipo: 'MAYOR', saldoBase: 1850400.00, estado: 'Activa' },
      { codigo: '1.1.01.01', nombre: 'Fondo Fijo de Caja Chica Administración', desc: 'NIC 7 · Vinculado a Auxiliar de Caja Chica (Reembolsos)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 25000.00, estado: 'Activa' },
      { codigo: '1.1.01.02', nombre: 'Banco Atlántida Cta. Cheques HNL', desc: 'NIC 7 · Conciliación Bancaria Automatizada ACH', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 1825400.00, estado: 'Activa' },
      { codigo: '1.1.03.01', nombre: 'Anticipos a Proveedores Locales y Exterior', desc: 'NIC 1 · Saldos a Favor Aplicables en Auxiliar de Anticipos', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 45000.00, estado: 'Activa' },
      { codigo: '1.1.04.01', nombre: 'Crédito Fiscal ISV 15% por Acreditar', desc: 'Ley ISV SAR · Alimentado por Compras Locales Gravadas 15%', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 68420.00, estado: 'Activa' },
      { codigo: '1.1.04.02', nombre: 'Crédito Fiscal ISV 18% por Acreditar', desc: 'Ley ISV SAR · Alimentado por Compras Gravadas 18%', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 12400.00, estado: 'Activa' },
      { codigo: '1.1.05', nombre: 'Inventarios y Activos Corrientes Operativos', desc: 'NIC 2 · Mercaderías, Materias Primas e Insumos', naturaleza: 'DEBE', tipo: 'MAYOR', saldoBase: 980000.00, estado: 'Activa' },
      { codigo: '1.1.05.01', nombre: 'Inventario Mercaderías para la Venta', desc: 'NIC 2 · Kardex Promedio Ponderado Comercial', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 540000.00, estado: 'Activa' },
      { codigo: '1.1.05.02', nombre: 'Inventario Materias Primas e Insumos', desc: 'NIC 2 · Insumos Industriales y Órdenes de Compra', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 320000.00, estado: 'Activa' },
      { codigo: '1.1.05.03', nombre: 'Inventario Producto en Proceso', desc: 'NIC 2 · Costeo de Transformación y Planta', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 120000.00, estado: 'Activa' },
      { codigo: '1.1.07.01', nombre: 'ISV Crédito Fiscal Pagado en Aduana (15%)', desc: 'Aduanas SAR · Liquidación DUA / Boletín Importación 15%', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 70762.77, estado: 'Activa' },
      { codigo: '1.1.07.02', nombre: 'ISV Crédito Fiscal Pagado en Aduana (18%)', desc: 'Aduanas SAR · Liquidación DUA / Boletín Importación 18%', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 0.00, estado: 'Activa' },
      { codigo: '1.1.08', nombre: 'Gastos Pagados por Anticipado (Activos Diferidos)', desc: 'NIIF · Seguros, Rentas y Licencias Amortizables', naturaleza: 'DEBE', tipo: 'MAYOR', saldoBase: 216000.00, estado: 'Activa' },
      { codigo: '1.1.08.01', nombre: 'Pólizas de Seguro y Fianzas Pagadas por Anticipado', desc: 'NIIF · Dispara Auxiliar de Activos Diferidos (Amortización)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 144000.00, estado: 'Activa' },
      { codigo: '1.1.08.02', nombre: 'Rentas y Alquileres Pagados por Anticipado', desc: 'NIIF · Dispara Auxiliar de Activos Diferidos (Amortización)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 48000.00, estado: 'Activa' },
      { codigo: '1.1.08.03', nombre: 'Suscripciones y Licencias de Software Anual', desc: 'NIIF · Dispara Auxiliar de Activos Diferidos (Amortización)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 24000.00, estado: 'Activa' },
      { codigo: '1.2.01', nombre: 'Propiedad, Planta y Equipo (Neto)', desc: 'NIC 16 · Activos Fijos Capitalizables (Umbral >= L 5,000)', naturaleza: 'DEBE', tipo: 'MAYOR', saldoBase: 3420000.00, estado: 'Activa' },
      { codigo: '1.2.01.01', nombre: 'Maquinaria y Equipo Industrial (NIC 16)', desc: 'NIC 16 · Dispara Auxiliar de Activos Fijos (Vida útil 10 años)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 1850000.00, estado: 'Activa' },
      { codigo: '1.2.01.02', nombre: 'Equipo de Transporte y Logística', desc: 'NIC 16 · Dispara Auxiliar de Activos Fijos (Vida útil 5 años)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 890000.00, estado: 'Activa' },
      { codigo: '1.2.01.03', nombre: 'Mobiliario y Equipo de Oficina', desc: 'NIC 16 · Dispara Auxiliar de Activos Fijos (Vida útil 10 años)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 260000.00, estado: 'Activa' },
      { codigo: '1.2.01.04', nombre: 'Equipo de Computación y Servidores ERP', desc: 'NIC 16 · Dispara Auxiliar de Activos Fijos (Vida útil 5 años)', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 420000.00, estado: 'Activa' },

      // GRUPO 2: PASIVO
      { codigo: '2.1.01', nombre: 'Cuentas y Documentos por Pagar Comerciales', desc: 'NIIF 9 · Pasivos Financieros a Corto Plazo', naturaleza: 'HABER', tipo: 'MAYOR', saldoBase: 730200.00, estado: 'Activa' },
      { codigo: '2.1.01.01', nombre: 'Proveedores Locales Comerciales (CxP)', desc: 'NIIF 9 · Cuenta Puente por Defecto en Facturas de Compra', naturaleza: 'HABER', tipo: 'DETALLE', saldoBase: 645200.00, estado: 'Activa' },
      { codigo: '2.1.01.02', nombre: 'Acreedores por Fletes, Transporte y Aduanas (DUA)', desc: 'NIIF 9 · Liquidaciones Aduaneras y Logística Internacional', naturaleza: 'HABER', tipo: 'DETALLE', saldoBase: 85000.00, estado: 'Activa' },
      { codigo: '2.1.03', nombre: 'Obligaciones Tributarias y Retenciones SAR por Pagar', desc: 'SAR Honduras · Impuestos Retenidos en la Fuente', naturaleza: 'HABER', tipo: 'MAYOR', saldoBase: 34250.00, estado: 'Activa' },
      { codigo: '2.1.03.01', nombre: 'Retenciones ISR / ISV por Pagar SAR (Art. 50: 1% / 10% / 12.5%)', desc: 'SAR Código 05 · Alimentado por Auxiliar de Retenciones', naturaleza: 'HABER', tipo: 'DETALLE', saldoBase: 19850.00, estado: 'Activa' },
      { codigo: '2.1.03.02', nombre: 'ISV Débito Fiscal por Pagar SAR', desc: 'Ley ISV SAR · Impuesto sobre Ventas Generado', naturaleza: 'HABER', tipo: 'DETALLE', saldoBase: 14400.00, estado: 'Activa' },

      // GRUPO 3: PATRIMONIO
      { codigo: '3.1.01.01', nombre: 'Capital Social Suscrito y Pagado', desc: 'NIC 1 · Patrimonio Constitutivo de la Sociedad (N3)', naturaleza: 'HABER', tipo: 'DETALLE', saldoBase: 2500000.00, estado: 'Activa' },

      // GRUPO 4: INGRESOS
      { codigo: '4.1.01.01', nombre: 'Ingresos por Ventas de Bienes y Servicios Giro Principal', desc: 'NIIF 15 · Facturación Comercial con CAI Vigente', naturaleza: 'HABER', tipo: 'DETALLE', saldoBase: 3180400.00, estado: 'Activa' },

      // GRUPO 5: COSTOS Y GASTOS OPERATIVOS (COMPRAS Y SERVICIOS)
      { codigo: '5.1.01', nombre: 'Costos y Gastos de Operación, Aduanas y Logística', desc: 'NIC 2 / NIIF · Gastos Operativos Directos e Importación', naturaleza: 'DEBE', tipo: 'MAYOR', saldoBase: 543230.00, estado: 'Activa' },
      { codigo: '5.1.01.01', nombre: 'Honorarios Profesionales y Consultoría Externa', desc: 'Art. 50 Ley ISR · Dispara Retención 12.5% y Multicentro', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 185000.00, estado: 'Activa' },
      { codigo: '5.1.01.02', nombre: 'Gastos de Operación y Muelle', desc: 'Operaciones · Servicios Portuarios y Acarreos Internos', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 95000.00, estado: 'Activa' },
      { codigo: '5.1.02.01', nombre: 'Derechos Arancelarios a la Importación (DAI)', desc: 'Aduanas SAR · Aranceles Liquidados en Póliza DUA', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 247880.00, estado: 'Activa' },
      { codigo: '5.1.02.02', nombre: 'Tasas por Servicios de Aduana (TSA)', desc: 'Aduanas SAR · Tasas Administrativas de Importación', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 15350.00, estado: 'Activa' },
      { codigo: '5.2.01', nombre: 'Gastos Generales de Administración y Ventas', desc: 'NIIF · Gastos Operativos Sujetos a Centros de Costos', naturaleza: 'DEBE', tipo: 'MAYOR', saldoBase: 495000.00, estado: 'Activa' },
      { codigo: '5.2.01.01', nombre: 'Servicios Públicos (ENEE / SANAA / Telecomunicaciones)', desc: 'Gasto Operativo · Energía Eléctrica, Agua e Internet', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 64000.00, estado: 'Activa' },
      { codigo: '5.2.01.02', nombre: 'Arrendamiento de Locales y Bodegas Operativas', desc: 'NIIF 16 / SAR · Sujeto a Retención 10% y Centros de Costos', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 180000.00, estado: 'Activa' },
      { codigo: '5.2.01.03', nombre: 'Combustibles y Lubricantes de Flota', desc: 'Operaciones · Consumo de Flota Vehicular y Generadores', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 125000.00, estado: 'Activa' },
      { codigo: '5.2.01.04', nombre: 'Mantenimiento y Reparaciones Generales', desc: 'Operaciones · Repuestos, Herramientas y Mantenimiento', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 126000.00, estado: 'Activa' },
      { codigo: '6.1.01.05', nombre: 'Gasto Amortización Alquiler de Inmuebles', desc: 'NIIF · Devengo Mensual de Activos Diferidos', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 12000.00, estado: 'Activa' },
      { codigo: '6.1.01.15', nombre: 'Gasto Amortización Seguros y Fianzas', desc: 'NIIF · Devengo Mensual de Pólizas Corporativas', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 24000.00, estado: 'Activa' },
      { codigo: '6.1.01.18', nombre: 'Gasto Amortización Licencias de Software', desc: 'NIIF · Devengo Mensual de Licenciamiento ERP/Cloud', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 6000.00, estado: 'Activa' },
      { codigo: '6.1.02.01', nombre: 'Gasto Depreciación Maquinaria y Equipo', desc: 'NIC 16 · Depreciación Acumulada Mensual Planta', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 35000.00, estado: 'Activa' },
      { codigo: '6.1.02.02', nombre: 'Gasto Depreciación Mobiliario y Equipo', desc: 'NIC 16 · Depreciación Acumulada Mensual Oficinas', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 8500.00, estado: 'Activa' },
      { codigo: '6.1.02.03', nombre: 'Gasto Depreciación Equipo de Cómputo', desc: 'NIC 16 · Depreciación Acumulada Mensual TI', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 14000.00, estado: 'Activa' },
      { codigo: '6.1.02.04', nombre: 'Gasto Depreciación Vehículos y Transporte', desc: 'NIC 16 · Depreciación Acumulada Mensual Flota', naturaleza: 'DEBE', tipo: 'DETALLE', saldoBase: 22000.00, estado: 'Activa' }
    ];

    // 5. Motor Extensible de Reglas Activas NIIF / SAR
    const rulesRegistry = [
      {
        code: 'NIIF-NIC16',
        title: 'Capitalización Obligatoria de Activos Fijos (NIC 16)',
        desc: 'Si una línea con cuenta de Activo Fijo (1.2.*) iguala o supera el umbral, exige completar el Auxiliar de Activos Fijos.',
        tier: 'N3',
        thresholdLabel: 'Umbral L',
        thresholdValue: '5,000.00',
        active: true,
        auditWarning: 'No se ejecutaron procedimientos automatizados de capitalización y depreciación en base a la NIC 16.'
      },
      {
        code: 'NIIF-DIF01',
        title: 'Amortización Diferida Obligatoria en Gastos Anticipados',
        desc: 'Exige programar la tabla de devengo mensual en el Auxiliar de Activos Diferidos al imputar cuentas 1.1.05.* / 1.1.08.*.',
        tier: 'N3',
        thresholdLabel: 'Plazo mín (meses)',
        thresholdValue: '2',
        active: true,
        auditWarning: 'No se aplicó control de amortización mensual automática para Activos Diferidos.'
      },
      {
        code: 'SAR-REC00',
        title: 'Bloqueo Estricto de ISV en Recibos Comerciales sin CAI',
        desc: 'Impide acreditar ISV 15%/18% cuando el documento es un Recibo Comercial sin formato ni CAI autorizado por el SAR.',
        tier: 'N3',
        thresholdLabel: 'Tolerancia ISV',
        thresholdValue: 'L 0.00',
        active: true,
        auditWarning: 'Contingencia Fiscal SAR: Se desactivó el bloqueo de crédito fiscal ISV sobre documentos sin CAI.'
      },
      {
        code: 'FRD-SPLIT',
        title: 'Detección Antifraude de Compras Fraccionadas',
        desc: 'Alerta y bloquea cuando se ingresan múltiples facturas del mismo proveedor en la misma semana justo debajo del umbral de L 5,000.',
        tier: 'N3',
        thresholdLabel: 'Ventana (días)',
        thresholdValue: '7',
        active: true,
        auditWarning: 'Control Interno COSO: Se desactivó el detector de fraccionamiento de compras (Split Invoicing).'
      },
      {
        code: 'FRD-ACHDUP',
        title: 'Protección Atómica Antiduplicidad de Referencias ACH / Cheques',
        desc: 'Rechaza cualquier intento de reutilizar un número de comprobante bancario en más de una liquidación de pago.',
        tier: 'N3',
        thresholdLabel: 'Modo',
        thresholdValue: 'Estricto',
        active: true,
        auditWarning: 'Riesgo de Tesorería: Se deshabilitó la validación de unicidad de referencias bancarias ACH.'
      },
      {
        code: 'SAR-RET05',
        title: 'Exigir Retención en la Fuente (1%, 10%, 12.5%) según Giro/Cuenta',
        desc: 'Desbloquea y exige emitir Comprobante de Retención SAR Tipo 05 en Honorarios, Alquileres o proveedores sujetos al 1%.',
        tier: 'N2',
        thresholdLabel: 'Base mín L',
        thresholdValue: '1,000.00',
        active: true,
        auditWarning: 'No se aplicó validación automática de retenciones en la fuente (Art. 50 Ley ISR).'
      },
      {
        code: 'OPS-3WAY',
        title: 'Validación Triangular 3-Way Match (OC ↔ GRN ↔ Factura)',
        desc: 'Bloquea facturas que superen el porcentaje de tolerancia frente a la Orden de Compra autorizada.',
        tier: 'N3',
        thresholdLabel: 'Tolerancia %',
        thresholdValue: '5.0%',
        active: true,
        auditWarning: 'Se omitió la conciliación triangular obligatoria (3-Way Match) en compras.'
      },
      {
        code: 'OPS-MC100',
        title: 'Cuadre Estricto al 100.00% en Auxiliar Multicentro de Costos',
        desc: 'Impide asentar transacciones con centro de costo MULTICENTRO si existe descuadre mayor a L 0.00.',
        tier: 'N2',
        thresholdLabel: 'Descuadre máx',
        thresholdValue: 'L 0.00',
        active: true,
        auditWarning: 'Contabilidad Analítica: Se permitieron imputaciones multicentro sin validación de cuadre al 100%.'
      }
    ];

    // 6. Usuarios y Perfiles Activos
    const usuariosPerfiles = [
      { nombre: 'Carlos Hernández', cargo: 'Contador General / CFO', nivel: 'N3', modulos: 'Todos los Módulos + Gobierno N3', estado: 'Activo' },
      { nombre: 'Elena Valladares', cargo: 'Coordinadora Senior Tributaria SAR', nivel: 'N2', modulos: 'Compras, Cuentas por Pagar, Bancos & Nómina', estado: 'Activo' },
      { nombre: 'Jorge Domínguez', cargo: 'Operador de Compras y Almacén', nivel: 'N1', modulos: 'Compras, Inventarios', estado: 'Activo' }
    ];

    // 7. Bitácora Inmutable de Auditoría (Audit Trail Log)
    const auditLog = [
      { fecha: '20/10/2026 08:30:12', usuario: 'Carlos Hernández (N3)', modulo: 'Gobierno NIIF', detalle: 'Inicialización de bóveda corporativa y verificación de 8 reglas NIIF/SAR al 100%.' },
      { fecha: '20/10/2026 09:15:44', usuario: 'Elena Valladares (N2)', modulo: 'Tasa BCH', detalle: 'Sincronización automática de divisa USD: Compra L 24.7350 / Venta L 24.8587.' }
    ];

    // 8. Base de Datos: Padrón Maestro de Terceros (Clientes / Proveedores)
    const proveedoresBD = [
      { rtn: '08011950001122', razonSocial: 'FERRETERÍA LARACH & CÍA S. DE R.L.', nombre: 'FERRETERÍA LARACH & CÍA S. DE R.L.', rolComercial: 'DUAL', giro: 'Suministros y Materiales', condicionPago: 'Crédito 30 Días', condicion: 'Crédito 30 Días', regimenRetencion: 'Exento Pagos a Cuenta', regimen: 'Exento Pagos a Cuenta', cuentaAch: 'Banco Atlántida · 1100239481', banco: 'Banco Atlántida · 1100239481', estado: 'Activo' },
      { rtn: '05011988092211', razonSocial: 'DISTRIBUIDORA CUMMINS CENTROAMÉRICA HONDURAS', nombre: 'DISTRIBUIDORA CUMMINS CENTROAMÉRICA HONDURAS', rolComercial: 'PROVEEDOR', giro: 'Repuestos y Maquinaria Pesada', condicionPago: 'Crédito 60 Días', condicion: 'Crédito 60 Días', regimenRetencion: 'Exento Pagos a Cuenta', regimen: 'Exento Pagos a Cuenta', cuentaAch: 'BAC Credomatic · 720194821', banco: 'BAC Credomatic · 720194821', estado: 'Activo' },
      { rtn: '08011975114499', razonSocial: 'BUFETE Y CONSULTORES TRIBUTARIOS LEX-SAR', nombre: 'BUFETE Y CONSULTORES TRIBUTARIOS LEX-SAR', rolComercial: 'PROVEEDOR', giro: 'Consultoría Legal y Fiscal', condicionPago: 'Contado', condicion: 'Contado', regimenRetencion: 'Honorarios 12.5%', regimen: 'Honorarios 12.5%', cuentaAch: 'Banco Ficohsa · 20001482910', banco: 'Banco Ficohsa · 20001482910', estado: 'Activo' },
      { rtn: '08011992004411', razonSocial: 'INMOBILIARIA PARQUE INDUSTRIAL DEL VALLE S.A.', nombre: 'INMOBILIARIA PARQUE INDUSTRIAL DEL VALLE S.A.', rolComercial: 'DUAL', giro: 'Arrendamiento de Bodegas', condicionPago: 'Contado', condicion: 'Contado', regimenRetencion: 'Alquiler 10%', regimen: 'Alquiler 10%', cuentaAch: 'Banco Banpaís · 01-4920-9910', banco: 'Banco Banpaís · 01-4920-9910', estado: 'Activo' },
      { rtn: '08019001223344', razonSocial: 'TRANSPORTES Y LOGÍSTICA DEL NORTE S. DE R.L.', nombre: 'TRANSPORTES Y LOGÍSTICA DEL NORTE S. DE R.L.', rolComercial: 'PROVEEDOR', giro: 'Fletes y Acarreos Terrestres', condicionPago: 'Crédito 30 Días', condicion: 'Crédito 30 Días', regimenRetencion: 'Retención 1%', regimen: 'Retención 1%', cuentaAch: 'Banco Occidente · 21-401-009281', banco: 'Banco Occidente · 21-401-009281', estado: 'Activo' },
      { rtn: '08012005887766', razonSocial: 'CORPORACIÓN COMERCIAL DEL ATLÁNTICO S.A.', nombre: 'CORPORACIÓN COMERCIAL DEL ATLÁNTICO S.A.', rolComercial: 'CLIENTE', giro: 'Distribución Mayorista Corporativa', condicionPago: 'Crédito 30 Días', condicion: 'Crédito 30 Días', regimenRetencion: 'Exento Pagos a Cuenta', regimen: 'Exento Pagos a Cuenta', cuentaAch: 'BAC Credomatic · 745001928', banco: 'BAC Credomatic · 745001928', estado: 'Activo' }
    ];

    // 9. Base de Datos: Bancos y Cajas Chicas
    const bancosCajasBD = [
      { id: 'BAN-01', tipo: 'Banco Cheques', nombre: 'Banco Atlántida · Cuenta Operativa Principal', cuenta: '1100-492810-01', moneda: 'HNL', niif: '1.1.01.02 · Banco Atlántida Cta. Cheques HNL', saldo: 1825400.00, estado: 'Activa' },
      { id: 'BAN-02', tipo: 'Banco Cheques', nombre: 'BAC Credomatic · Pagos ACH Proveedores', cuenta: '730-884920-1', moneda: 'HNL', niif: '1.1.01.02 · Banco Atlántida Cta. Cheques HNL', saldo: 640250.00, estado: 'Activa' },
      { id: 'BAN-03', tipo: 'Banco Ahorro', nombre: 'Banco Ficohsa · Reserva Dólares Importaciones', cuenta: '2000-99182734', moneda: 'USD', niif: '1.1.01 · Efectivo y Equivalentes de Efectivo', saldo: 48500.00, estado: 'Activa' },
      { id: 'CCH-01', tipo: 'Caja Chica', nombre: 'Fondo Fijo Caja Chica Administración TGU', cuenta: 'Custodio: Lic. Sofía Pineda', moneda: 'HNL', niif: '1.1.01.01 · Fondo Fijo de Caja Chica Administración', saldo: 25000.00, estado: 'Activa' }
    ];

    // 10. Base de Datos: Artículos y Servicios
    const articulosBD = [
      { sku: 'SKU-EQ-001', desc: 'Servidor Rack Dell PowerEdge R750 Xeon Silver', tipo: 'Activo Fijo NIC 16', unidad: 'UND', isv: '15%', cuenta: '1.2.01.04 · Equipo de Computación y Servidores ERP', costo: 145000.00 },
      { sku: 'SKU-IN-042', desc: 'Bobina de Acero Galvanizado Calibre 18 Industrial', tipo: 'Inventario NIC 2', unidad: 'UND', isv: '15%', cuenta: '1.1.01 · Efectivo y Equivalentes de Efectivo', costo: 18400.00 },
      { sku: 'SKU-SR-105', desc: 'Auditoría Externa Financiera y Fiscal NIIF/SAR', tipo: 'Servicio', unidad: 'SRV', isv: '15%', cuenta: '5.1.01.01 · Honorarios Profesionales y Consultoría Externa', costo: 65000.00 },
      { sku: 'SKU-SR-210', desc: 'Canon Mensual Arrendamiento Nave Industrial SPS', tipo: 'Servicio', unidad: 'MES', isv: '15%', cuenta: '5.1.02.01 · Arrendamiento de Locales y Bodegas Operativas', costo: 85000.00 },
      { sku: 'SKU-SU-019', desc: 'Póliza Corporativa Contra Todo Riesgo Incendio y Flota', tipo: 'Suministro', unidad: 'SRV', isv: 'Exento', cuenta: '1.1.05.01 · Seguros y Fianzas Pagados por Anticipado', costo: 144000.00 }
    ];

    // =========================================================================
    // BITÁCORA DE AUDITORÍA EN VIVO (HELPER CENTRAL)
    // =========================================================================
    function registrarEventoAuditoria(modulo, detalle) {
      const ahora = new Date();
      const fechaStr = ahora.toLocaleDateString('es-HN') + ' ' + ahora.toTimeString().split(' ')[0];
      const usuarioStr = `Carlos Hernández (${bovedaSeleccionada})`;
      auditLog.unshift({
        fecha: fechaStr,
        usuario: usuarioStr,
        modulo,
        detalle
      });
      renderizarBitacoraAuditoria();
    }

    function renderizarBitacoraAuditoria() {
      const tbody = document.getElementById('tbody-audit-log');
      if (!tbody) return;
      tbody.innerHTML = auditLog.map(ev => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-2 px-2.5 font-mono-num text-[11px] text-[#78716c] whitespace-nowrap">${ev.fecha}</td>
          <td class="py-2 px-2.5 font-semibold text-slate-900">${ev.usuario}</td>
          <td class="py-2 px-2.5"><span class="hds-badge-soft">${ev.modulo}</span></td>
          <td class="py-2 px-2.5 text-[#78716c]">${ev.detalle}</td>
        </tr>
      `).join('');
    }

    // =========================================================================
    // CONTROL DE LA PUERTA DE BÓVEDA (GATEWAY DE 3 NIVELES)
    // =========================================================================
    function abrirGatewayNiveles() {
      actualizarTarjetasGateway();
      document.getElementById('gateway-overlay').classList.remove('hidden');
    }

    function cambiarRolSimulado(nuevoRol) {
      rolUsuarioSesion = nuevoRol;
      actualizarTarjetasGateway();
      const jerarquia = { N1: 1, N2: 2, N3: 3 };
      if (jerarquia[bovedaSeleccionada] > jerarquia[rolUsuarioSesion]) {
        ingresarANivel(rolUsuarioSesion);
      } else {
        aplicarPermisosEnCampos();
      }
    }

    function actualizarTarjetasGateway() {
      const jerarquia = { N1: 1, N2: 2, N3: 3 };
      const nivelActual = jerarquia[rolUsuarioSesion];

      ['N1', 'N2', 'N3'].forEach(t => {
        const card = document.getElementById('card-gate-' + t.toLowerCase());
        const badge = document.getElementById('lock-badge-' + t.toLowerCase());
        if (jerarquia[t] <= nivelActual) {
          card.classList.remove('locked');
          card.classList.add('unlocked');
          badge.textContent = '● Acceso Habilitado';
          badge.className = 'text-xs font-medium text-[#3398e1]';
        } else {
          card.classList.add('locked');
          card.classList.remove('unlocked');
          badge.textContent = '🔒 Requiere Nivel ' + t;
          badge.className = 'text-xs font-medium text-[#a8a29e]';
        }
      });
    }

    function ingresarANivel(tier) {
      const jerarquia = { N1: 1, N2: 2, N3: 3 };
      if (jerarquia[tier] > jerarquia[rolUsuarioSesion]) {
        alert('Acceso denegado: Tu cargo actual (' + rolUsuarioSesion + ') no tiene autorización para abrir la bóveda ' + tier + '.');
        return;
      }

      bovedaSeleccionada = tier;
      const overlay = document.getElementById('gateway-overlay');
      if (overlay) overlay.classList.add('hidden');

      const pill = document.getElementById('active-tier-pill');
      if (pill) {
        const labels = {
          N1: 'SETTINGS (N1 · OPERADOR)',
          N2: 'SENIOR (N2 · CONTADOR/RRHH)',
          N3: 'GERENCY (N3 · ALTA GERENCIA)'
        };
        pill.textContent = labels[tier];
      }

      const btnConfig = document.getElementById('seg-btn-config');
      const btnBases  = document.getElementById('seg-btn-bases');

      if (tier === 'N1') {
        if (btnConfig) btnConfig.classList.add('hidden');
        if (btnBases)  btnBases.classList.add('hidden');
        cambiarSegmento('prefs');
      } else {
        if (btnConfig) btnConfig.classList.remove('hidden');
        if (btnBases)  btnBases.classList.remove('hidden');
        cambiarSegmento('config');
      }

      aplicarPermisosEnCampos();
    }

    // =========================================================================
    // APLICACIÓN DE CANDADOS SEGÚN NIVEL
    // =========================================================================
    function aplicarPermisosEnCampos() {
      const esGerencia = (bovedaSeleccionada === 'N3');

      document.querySelectorAll('.n3-only-input').forEach(el => {
        el.disabled = !esGerencia;
      });

      document.querySelectorAll('.n3-only-btn').forEach(btn => {
        btn.disabled = !esGerencia;
        btn.style.opacity = esGerencia ? '1' : '0.45';
      });

      document.querySelectorAll('.n3-only-option').forEach(opt => {
        opt.disabled = !esGerencia;
      });

      const radar = document.getElementById('card-radar-forense');
      if (radar) radar.style.display = esGerencia ? 'block' : 'none';

      const badgeEmp = document.getElementById('badge-empresa-access');
      if (badgeEmp) {
        badgeEmp.textContent = esGerencia ? 'MODO GOBIERNO N3 (EDICIÓN TOTAL)' : 'MODO SENIOR N2 (EMPRESA EN SOLO LECTURA · SAR HABILITADO)';
        badgeEmp.className = esGerencia ? 'hds-badge-solid font-mono-num' : 'hds-badge-cyan font-mono-num';
      }

      renderizarReglasActivas();
    }

    function cambiarSegmento(seg) {
      segmentoActivo = seg;

      const btnConfig = document.getElementById('seg-btn-config');
      const btnPrefs  = document.getElementById('seg-btn-prefs');
      const btnBases  = document.getElementById('seg-btn-bases');

      if (btnConfig) btnConfig.classList.toggle('active', seg === 'config');
      if (btnPrefs)  btnPrefs.classList.toggle('active', seg === 'prefs');
      if (btnBases)  btnBases.classList.toggle('active', seg === 'bases');

      renderizarMenuLateral();
    }

    function renderizarMenuLateral() {
      const grupoConfig = document.getElementById('menu-grupo-config');
      const grupoPrefs  = document.getElementById('menu-grupo-prefs');
      const grupoBases  = document.getElementById('menu-grupo-bases');

      if (grupoConfig) grupoConfig.classList.add('hidden');
      if (grupoPrefs)  grupoPrefs.classList.add('hidden');
      if (grupoBases)  grupoBases.classList.add('hidden');

      if (segmentoActivo === 'prefs' || bovedaSeleccionada === 'N1') {
        if (grupoPrefs) grupoPrefs.classList.remove('hidden');
        const btnPrefs = document.getElementById('btn-nav-prefs');
        mostrarVista('view-preferencias-usuario', btnPrefs);
      } else if (segmentoActivo === 'bases') {
        if (grupoBases) grupoBases.classList.remove('hidden');
        const btnCat = document.getElementById('btn-nav-catalogo');
        mostrarVista('view-catalogo-cuentas', btnCat);
        renderizarTablaCatalogo();
      } else {
        if (grupoConfig) grupoConfig.classList.remove('hidden');
        const btnEmpresa = document.getElementById('btn-nav-empresa');
        const btnSar     = document.getElementById('btn-nav-sar');

        if (bovedaSeleccionada === 'N2') {
          mostrarVista('view-sar-fiscal', btnSar);
        } else {
          mostrarVista('view-empresa', btnEmpresa);
        }
      }
    }

    function mostrarVista(viewId, btnEl) {
      document.querySelectorAll('.config-view').forEach(v => v.classList.add('hidden'));
      
      const target = document.getElementById(viewId);
      if (target) {
        target.classList.remove('hidden');
      }

      if (btnEl) {
        document.querySelectorAll('#sidebar-menu-container .hds-nav-item').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
      }

      if (viewId === 'view-catalogo-cuentas') renderizarTablaCatalogo();
      if (viewId === 'view-bd-proveedores') renderizarTablaProveedores();
      if (viewId === 'view-bd-bancos') renderizarTablaBancos();
      if (viewId === 'view-bd-articulos') renderizarTablaArticulos();
    }

    // =========================================================================
    // RENDERIZADO DEL MOTOR DE REGLAS ACTIVAS + INFORME DE AUDITORÍA (BUGS 1 Y 7 CORREGIDOS)
    // =========================================================================
    function renderizarReglasActivas() {
      const cont = document.getElementById('rules-list-container');
      if (!cont) return;
      const esGerencia = (bovedaSeleccionada === 'N3');

      cont.innerHTML = rulesRegistry.map((rule, idx) => {
        const puedeEditar = esGerencia || rule.tier === 'N2';
        return `
          <div class="hds-card p-4 flex items-start justify-between gap-4 rule-item">
            <div class="space-y-1 flex-1">
              <div class="flex items-center space-x-2">
                <span class="font-mono-num text-xs font-semibold px-2 py-0.5 rounded bg-[#f5f5f5] border border-[#e8e6e5] text-[#0c0a09]">${rule.code}</span>
                <span class="text-sm font-semibold text-[#0c0a09]">${rule.title}</span>
              </div>
              <p class="text-xs text-[#78716c]">${rule.desc}</p>
            </div>

            <!-- Umbral editable sincronizado + Casilla de selección a la derecha -->
            <div class="flex items-center space-x-3 shrink-0">
              <div class="text-right">
                <label class="block text-[10px] uppercase text-[#78716c]">${rule.thresholdLabel}</label>
                <input type="text" value="${rule.thresholdValue}" ${puedeEditar ? '' : 'disabled'}
                  oninput="rulesRegistry[${idx}].thresholdValue = this.value; guardarConfiguracion(true);"
                  onchange="registrarEventoAuditoria('Reglas NIIF/SAR', 'Umbral de regla ${rule.code} ajustado a: ' + this.value); guardarConfiguracion(true);"
                  class="hds-input !py-1 !px-2 w-24 text-right font-mono-num text-xs font-medium mt-0.5" />
              </div>
              <label class="flex items-center cursor-pointer pt-3">
                <input type="checkbox" ${rule.active ? 'checked' : ''} ${puedeEditar ? '' : 'disabled'}
                  onchange="toggleReglaActiva(${idx}, this.checked)"
                  class="w-5 h-5 accent-[#3ba6f1] rounded cursor-pointer" />
              </label>
            </div>
          </div>
        `;
      }).join('');

      actualizarResumenAuditoria();
    }

    function toggleReglaActiva(idx, estado) {
      rulesRegistry[idx].active = estado;
      actualizarResumenAuditoria();
      registrarEventoAuditoria(
        'Reglas NIIF/SAR',
        `Regla [${rulesRegistry[idx].code}] ${estado ? 'ACTIVADA' : 'DESACTIVADA (Genera Salvedad)'}.`
      );
      guardarConfiguracion(true);
    }

    function actualizarResumenAuditoria() {
      const activas = rulesRegistry.filter(r => r.active).length;
      const inactivas = rulesRegistry.filter(r => !r.active);
      
      // BUG 1 CORREGIDO: Validación segura de sidebar-rules-counter
      const counterEl = document.getElementById('sidebar-rules-counter');
      if (counterEl) {
        counterEl.textContent = `${activas}/${rulesRegistry.length} Activas`;
      }

      const pill = document.getElementById('audit-status-pill');
      const box = document.getElementById('audit-exceptions-box');
      if (!pill || !box) return;

      if (inactivas.length === 0) {
        pill.textContent = 'Cumplimiento 100%';
        pill.className = 'hds-badge-cyan';
        box.innerHTML = `
          <div class="p-3 rounded-xl bg-[#fafaf9] border border-[#e8e6e5] text-[#78716c]">
            ✓ Todos los procedimientos NIIF y controles SAR están activos. Sin salvedades para el informe de auditoría.
          </div>
        `;
      } else {
        pill.textContent = `${inactivas.length} Salvedad(es)`;
        pill.className = 'hds-badge-ember';
        box.innerHTML = inactivas.map(r => `
          <div class="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] space-y-1">
            <div class="font-mono-num text-[11px] font-semibold text-[#e7000b]">[${r.code} DESACTIVADA]</div>
            <div class="text-[#0c0a09] font-medium">${r.auditWarning}</div>
          </div>
        `).join('');
      }
    }

    function inyectarNuevaReglaDemo() {
      if (rulesRegistry.some(r => r.code === 'SAR-VIAT09')) return;
      rulesRegistry.push({
        code: 'SAR-VIAT09',
        title: 'Límite de Viáticos sin Soporte Fiscal Directo',
        desc: 'Nueva regla inyectada dinámicamente al registro sin alterar los módulos existentes.',
        tier: 'N2',
        thresholdLabel: 'Tope L',
        thresholdValue: '2,500.00',
        active: true,
        auditWarning: 'No se ejecutó control de tope sobre liquidaciones de gastos de viaje.'
      });
      renderizarReglasActivas();
      registrarEventoAuditoria('Plugin Reglas', 'Se inyectó nueva regla en caliente: SAR-VIAT09 (Viáticos SAR).');
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN A: COMPAÑÍA Y ESTABLECIMIENTOS SAR
    // =========================================================================
    function actualizarHeaderEnVivo() {
      document.getElementById('hdr-company-name').textContent = document.getElementById('inp-razon-social').value.toUpperCase();
      document.getElementById('hdr-company-rtn').textContent = 'RTN: ' + document.getElementById('inp-rtn-empresa').value;
    }

    function toggleRegimenEspecial(tipo) {
      const chk = document.getElementById('chk-' + tipo);
      const inp = document.getElementById('lic-' + tipo);
      if (chk && inp) inp.disabled = !chk.checked;
      guardarConfiguracion(true);
    }

    function renderizarEstablecimientosSAR() {
      const tbody = document.getElementById('tbody-establecimientos');
      if (!tbody) return;
      tbody.innerHTML = establecimientosSAR.map(e => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-2.5 px-3 font-mono-num font-bold text-center text-slate-900">${e.codigo}</td>
          <td class="py-2.5 px-3 font-mono-num font-bold text-center text-[#0284c7]">${e.punto}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-900">${e.nombre}</td>
          <td class="py-2.5 px-3 text-[#78716c]">${e.direccion}</td>
          <td class="py-2.5 px-3 text-slate-800">${e.responsable}</td>
          <td class="py-2.5 px-3 text-center"><span class="hds-badge-cyan">${e.estado}</span></td>
        </tr>
      `).join('');
    }

    function abrirModalNuevoEstablecimiento() {
      const m = document.getElementById('modal-nuevo-establecimiento');
      m.classList.remove('hidden');
      m.classList.add('flex');
      document.getElementById('est-nombre').value = '';
      document.getElementById('est-dir').value = '';
      document.getElementById('est-resp').value = '';
    }

    function cerrarModalNuevoEstablecimiento() {
      const m = document.getElementById('modal-nuevo-establecimiento');
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    function guardarNuevoEstablecimiento() {
      const codigo = document.getElementById('est-cod').value.trim().padStart(3, '0');
      const punto = document.getElementById('est-pto').value.trim().padStart(3, '0');
      const nombre = document.getElementById('est-nombre').value.trim();
      const direccion = document.getElementById('est-dir').value.trim() || 'Registrada en SAR';
      const responsable = document.getElementById('est-resp').value.trim() || 'Gerencia de Sucursal';

      if (!nombre) {
        alert('Por favor ingresa el Nombre / Sucursal del punto de emisión.');
        return;
      }

      establecimientosSAR.push({ codigo, punto, nombre, direccion, responsable, estado: 'Activo' });
      renderizarEstablecimientosSAR();
      cerrarModalNuevoEstablecimiento();
      registrarEventoAuditoria('Compañía / SAR', `Nuevo Punto de Emisión autorizado: Est. ${codigo} - Pto. ${punto} (${nombre}).`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN B: TRIBUTACIÓN FISCAL - SAR (PAGOS A CUENTA Y MODAL CAI)
    // =========================================================================
    function evaluarVigenciaPagosACuenta() {
      const fechaVen = document.getElementById('sar-fecha-ven-pac')?.value;
      const badge = document.getElementById('badge-pagos-cuenta');
      const txt = document.getElementById('txt-detalle-pac');
      if (!fechaVen || !badge || !txt) return;

      const hoy = new Date('2026-10-20');
      const ven = new Date(fechaVen);
      if (ven >= hoy) {
        badge.textContent = '🟢 Vigente - Exento de Retención 1%';
        badge.className = 'hds-badge-cyan';
        txt.textContent = `Cobertura fiscal activa hasta ${formatearFechaLatina(fechaVen)}`;
      } else {
        badge.textContent = '🔴 Vencida';
        badge.className = 'hds-badge-ember';
        txt.textContent = `Constancia vencida el ${formatearFechaLatina(fechaVen)} — Sujeto a retención Art. 50`;
      }
    }

    function renderizarTablaCAIs() {
      const tbody = document.getElementById('tbody-cais');
      if (!tbody) return;
      tbody.innerHTML = caisAutorizados.map(c => `
        <tr>
          <td class="py-2.5 px-3 font-sans font-medium text-[#0c0a09]">${c.doc}</td>
          <td class="py-2.5 px-3 font-mono-num font-medium text-[#0c0a09]">${c.cai}</td>
          <td class="py-2.5 px-3 font-mono-num text-[#0c0a09]">${c.rango}</td>
          <td class="py-2.5 px-3 font-mono-num text-[#0c0a09]">${c.fechaLimite}</td>
          <td class="py-2.5 px-3 font-sans"><span class="hds-badge-cyan">${c.estado}</span></td>
        </tr>
      `).join('');
    }

    function agregarCAIEmisor() {
      const m = document.getElementById('modal-nuevo-cai');
      m.classList.remove('hidden');
      m.classList.add('flex');
      document.getElementById('cai-codigo').value = '';
      document.getElementById('cai-codigo').focus();
    }

    function cerrarModalNuevoCAI() {
      const m = document.getElementById('modal-nuevo-cai');
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    function guardarNuevoCAIModal() {
      const doc = document.getElementById('cai-tipo-doc').value;
      const cai = document.getElementById('cai-codigo').value.trim().toUpperCase();
      const rIni = document.getElementById('cai-rango-ini').value.trim();
      const rFin = document.getElementById('cai-rango-fin').value.trim();
      const fLim = document.getElementById('cai-fecha-lim').value;

      if (!cai || !rIni || !rFin || !fLim) {
        alert('Completa todos los campos del rango CAI autorizado.');
        return;
      }

      const nuevo = {
        doc,
        cai,
        rango: `${rIni} al ${rFin}`,
        fechaLimite: formatearFechaLatina(fLim),
        estado: 'Vigente'
      };
      caisAutorizados.push(nuevo);
      renderizarTablaCAIs();
      cerrarModalNuevoCAI();
      registrarEventoAuditoria('SAR - Fiscal', `Alta de rango CAI [${cai}] para ${doc}.`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN C: PERIODOS CONTABLES Y MATRIZ ANUAL (12 MESES + MES 13)
    // =========================================================================
    function renderizarMatrizPeriodos() {
      const grid = document.getElementById('grid-matriz-periodos');
      if (!grid) return;

      const meses = [
        { num: '01', nombre: 'Enero 2026', tipo: 'CERRADO' },
        { num: '02', nombre: 'Febrero 2026', tipo: 'CERRADO' },
        { num: '03', nombre: 'Marzo 2026', tipo: 'CERRADO' },
        { num: '04', nombre: 'Abril 2026', tipo: 'CERRADO' },
        { num: '05', nombre: 'Mayo 2026', tipo: 'CERRADO' },
        { num: '06', nombre: 'Junio 2026', tipo: 'CERRADO' },
        { num: '07', nombre: 'Julio 2026', tipo: 'CERRADO' },
        { num: '08', nombre: 'Agosto 2026', tipo: 'CERRADO' },
        { num: '09', nombre: 'Septiembre 2026', tipo: 'CERRADO' },
        { num: '10', nombre: 'Octubre 2026', tipo: 'ACTUAL' },
        { num: '11', nombre: 'Noviembre 2026', tipo: 'FUTURO' },
        { num: '12', nombre: 'Diciembre 2026', tipo: 'FUTURO' },
        { num: '13', nombre: 'Periodo 13 NIIF', tipo: 'P13' }
      ];

      grid.innerHTML = meses.map(m => {
        let badgeClass = 'hds-badge-soft';
        let labelEstado = '🔒 CERRADO';
        let borderExtra = 'border-[#e8e6e5] bg-[#fafaf9]';

        if (m.tipo === 'ACTUAL') {
          labelEstado = estadoOctubre2026;
          if (estadoOctubre2026.includes('ABIERTO')) {
            badgeClass = 'hds-badge-cyan';
            borderExtra = 'border-[#3ba6f1] bg-white ring-2 ring-[#3ba6f1]/15';
          } else if (estadoOctubre2026.includes('PENDIENTE')) {
            badgeClass = 'hds-badge-soft';
            borderExtra = 'border-amber-400 bg-amber-50/30';
          } else {
            badgeClass = 'hds-badge-solid';
          }
        } else if (m.tipo === 'FUTURO') {
          labelEstado = '⚪ FUTURO / BLOQUEADO';
          badgeClass = 'hds-badge-soft opacity-75';
        } else if (m.tipo === 'P13') {
          labelEstado = estadoPeriodo13 ? '🟢 HABILITADO N3' : '🔒 INACTIVO';
          badgeClass = estadoPeriodo13 ? 'hds-badge-cyan' : 'hds-badge-soft';
          borderExtra = estadoPeriodo13 ? 'border-[#3ba6f1] bg-white' : 'border-dashed border-[#d6d3d1] bg-[#fafaf9]';
        }

        return `
          <div class="p-3 rounded-xl border ${borderExtra} flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-mono-num text-[10px] font-bold text-[#78716c]">MES ${m.num}</span>
              <span class="text-[10px] font-mono-num text-[#a8a29e]">2026</span>
            </div>
            <div class="text-xs font-bold text-[#0c0a09] truncate">${m.nombre}</div>
            <div>
              <span class="${badgeClass} !text-[10px] inline-block truncate max-w-full">${labelEstado}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    function solicitarPreCierreN2() {
      estadoOctubre2026 = '🟡 PENDIENTE APROBACIÓN GERENCIA (N3)';
      const badge = document.getElementById('period-workflow-badge');
      badge.textContent = estadoOctubre2026;
      badge.className = 'hds-badge-soft font-mono-num';
      renderizarMatrizPeriodos();
      registrarEventoAuditoria('Periodos Contables', 'Octubre 2026 cambiado a Pre-Cierre (Pendiente V°B° Gerencia N3).');
      guardarConfiguracion(true);
    }

    function aprobarCierreDefinitivoN3() {
      estadoOctubre2026 = '🔒 CERRADO Y APROBADO POR GERENCIA';
      const badge = document.getElementById('period-workflow-badge');
      badge.textContent = estadoOctubre2026;
      badge.className = 'hds-badge-solid font-mono-num';
      renderizarMatrizPeriodos();
      registrarEventoAuditoria('Periodos Contables', 'Visto Bueno N3 otorgado: Periodo Octubre 2026 CERRADO definitivamente.');
      guardarConfiguracion(true);
    }

    function reabrirMesN3() {
      estadoOctubre2026 = '🟢 ABIERTO OPERATIVO';
      const badge = document.getElementById('period-workflow-badge');
      badge.textContent = estadoOctubre2026;
      badge.className = 'hds-badge-cyan font-mono-num';
      renderizarMatrizPeriodos();
      registrarEventoAuditoria('Periodos Contables', 'Reapertura autorizada por Gerencia N3 para Octubre 2026.');
      guardarConfiguracion(true);
    }

    function togglePeriodo13(activo) {
      estadoPeriodo13 = activo;
      const badge = document.getElementById('p13-status-badge');
      if (badge) {
        badge.textContent = activo ? '🟢 HABILITADO N3' : '🔒 INACTIVO';
        badge.className = activo ? 'hds-badge-cyan font-mono-num' : 'hds-badge-soft font-mono-num';
      }
      renderizarMatrizPeriodos();
      registrarEventoAuditoria('Periodo 13 NIIF', `Ventana de ajustes de auditoría externa ${activo ? 'HABILITADA' : 'CERRADA'}.`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN D: COMPLEMENTOS OPERATIVOS (BCH, CUENTAS PUENTE Y CENTROS DE COSTOS)
    // =========================================================================
    function obtenerTasaDiaBCH() {
      document.getElementById('fx-buy').value = '24.7612';
      document.getElementById('fx-sell').value = '24.8845';
      document.getElementById('fx-sync-msg').innerHTML = '<span class="text-[#3398e1] font-semibold">✓ Sincronizado hace 1 segundo con API BCH: Compra L 24.7612 | Venta L 24.8845</span>';
      registrarEventoAuditoria('Tasa BCH', 'Actualización en línea con API BCH: Compra L 24.7612 | Venta L 24.8845.');
      guardarConfiguracion(true);
    }

    function poblarSelectoresCuentasPuente() {
      const hidratadas = window._cuentasPuenteHidratadas || {};
      const configuracionDefecto = [
        { id: 'puente-isv', defaultCode: hidratadas.isv_credito || '1.1.04.01' },
        { id: 'puente-cxp', defaultCode: hidratadas.cxp_locales || '2.1.01.01' },
        { id: 'puente-ret', defaultCode: hidratadas.ret_isr_sar || '2.1.03.01' },
        { id: 'puente-fx',  defaultCode: hidratadas.diferencial_cambiario || '4.1.01.01' }
      ];

      const cuentasDetalle = catalogoCuentasNIIF.filter(c => c.tipo === 'DETALLE');
      configuracionDefecto.forEach(cfg => {
        const sel = document.getElementById(cfg.id);
        if (!sel) return;
        const valorPrevio = sel.value || cfg.defaultCode;
        sel.innerHTML = cuentasDetalle.map(c => `
          <option value="${c.codigo}" ${c.codigo === valorPrevio ? 'selected' : ''}>
            ${c.codigo} · ${c.nombre}
          </option>
        `).join('');
      });
    }

    function renderizarTablaCentrosCostos() {
      const tbody = document.getElementById('tbody-centros-costos');
      if (!tbody) return;
      tbody.innerHTML = centrosCostos.map(c => {
        const presNum = typeof c.presupuesto === 'number' ? c.presupuesto : (parseFloat(String(c.presupuesto || '0').replace(/,/g, '')) || 0);
        const presFmt = presNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const badgeCat = c.badge || (DICCIONARIO_PREFIJOS_CC[(c.codigo || 'CC').split('-')[0]]?.badge || 'hds-badge-soft');
        const descTxt = c.desc || c.nombre || '';
        const respTxt = c.resp || c.responsable || '';
        const iniTxt = c.inicio || c.fechaInicio || '';
        const cieTxt = c.cierre || c.fechaCierre || '';
        const badgeEst = c.estado === 'Activo' ? 'hds-badge-cyan' : (c.estado === 'Cerrado' ? 'hds-badge-ember' : 'hds-badge-soft');
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 font-mono-num font-bold text-slate-900">${c.codigo}</td>
            <td class="py-2.5 px-3 font-sans"><span class="${badgeCat}">${c.categoria}</span></td>
            <td class="py-2.5 px-3 font-sans font-medium text-[#0c0a09]">${descTxt}</td>
            <td class="py-2.5 px-3 font-sans text-[#78716c]">${respTxt}</td>
            <td class="py-2.5 px-3 font-mono-num text-right font-semibold text-[#0c0a09]">${presFmt}</td>
            <td class="py-2.5 px-3 font-mono-num text-center">${iniTxt}</td>
            <td class="py-2.5 px-3 text-center">${cieTxt}</td>
            <td class="py-2.5 px-3 font-sans text-center"><span class="${badgeEst}">${c.estado}</span></td>
          </tr>
        `;
      }).join('');
    }

    function abrirModalNuevoCC() {
      const modal = document.getElementById('modal-nuevo-cc');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      document.getElementById('cc-prefijo').value = 'CC';
      document.getElementById('cc-sec1').value = '01';
      document.getElementById('cc-sec2').value = '';
      document.getElementById('cc-nombre').value = '';
      document.getElementById('cc-responsable').value = '';
      document.getElementById('cc-presupuesto').value = '';
      document.getElementById('cc-chk-enproceso').checked = true;
      toggleFechaCierreEnProceso();
      actualizarPreviewCodigoCC();
      document.getElementById('cc-sec2').focus();
    }

    function cerrarModalNuevoCC() {
      const modal = document.getElementById('modal-nuevo-cc');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function actualizarPreviewCodigoCC() {
      const pref = document.getElementById('cc-prefijo').value;
      const s1 = document.getElementById('cc-sec1').value.trim().toUpperCase();
      const s2 = document.getElementById('cc-sec2').value.trim().toUpperCase();

      const infoCat = DICCIONARIO_PREFIJOS_CC[pref] || DICCIONARIO_PREFIJOS_CC.CC;
      document.getElementById('cc-categoria-auto').value = infoCat.nombre;

      const codigoArmado = `${pref}-${s1 || '__'}-${s2 || '___'}`;
      document.getElementById('cc-preview-badge').textContent = codigoArmado;

      const errEl = document.getElementById('cc-error-msg');
      if (s1 && s2 && existeCodigoCCEnTabla(`${pref}-${s1}-${s2}`)) {
        errEl.classList.remove('hidden');
      } else {
        errEl.classList.add('hidden');
      }
    }

    function existeCodigoCCEnTabla(codigoBuscado) {
      return centrosCostos.some(c => c.codigo.toUpperCase() === codigoBuscado.toUpperCase());
    }

    function toggleFechaCierreEnProceso() {
      const chk = document.getElementById('cc-chk-enproceso');
      const inpFecha = document.getElementById('cc-fecha-cierre');
      inpFecha.disabled = chk.checked;
      if (chk.checked) inpFecha.value = '';
    }

    function formatearInputMonedaCC(input) {
      let limpio = input.value.replace(/[^0-9.]/g, '');
      const partes = limpio.split('.');
      if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('');
      input.value = limpio;
    }

    function formatearFechaLatina(isoDate) {
      if (!isoDate) return '';
      const [y, m, d] = isoDate.split('-');
      return `${d}/${m}/${y}`;
    }

    function guardarNuevoCentroCosto() {
      const pref = document.getElementById('cc-prefijo').value;
      const s1 = document.getElementById('cc-sec1').value.trim().toUpperCase();
      const s2 = document.getElementById('cc-sec2').value.trim().toUpperCase();
      const nombre = document.getElementById('cc-nombre').value.trim();
      const resp = document.getElementById('cc-responsable').value.trim() || 'Por asignar';
      const presNum = parseFloat(document.getElementById('cc-presupuesto').value.replace(/,/g, '')) || 0;
      const fInicio = document.getElementById('cc-fecha-inicio').value;
      const enProceso = document.getElementById('cc-chk-enproceso').checked;
      const fCierre = document.getElementById('cc-fecha-cierre').value;
      const estado = document.getElementById('cc-estado').value;

      if (!s1 || !s2) {
        alert('Por favor completa la 1ra y 2da sección del código (Ej. 01 y 102).');
        return;
      }
      if (!nombre) {
        alert('Por favor ingresa el Nombre o Descripción del centro/proyecto.');
        return;
      }
      if (!enProceso && !fCierre) {
        alert('Selecciona una Fecha de Cierre o marca la casilla "En proceso".');
        return;
      }

      const codigoFinal = `${pref}-${s1}-${s2}`;
      if (existeCodigoCCEnTabla(codigoFinal)) {
        document.getElementById('cc-error-msg').classList.remove('hidden');
        alert(`El código ${codigoFinal} ya está registrado en el catálogo.`);
        return;
      }

      const infoCat = DICCIONARIO_PREFIJOS_CC[pref] || DICCIONARIO_PREFIJOS_CC.CC;
      const iniStr = formatearFechaLatina(fInicio);
      const cieStr = enProceso ? 'En proceso' : formatearFechaLatina(fCierre);
      centrosCostos.push({
        codigo: codigoFinal,
        categoria: infoCat.nombre,
        badge: infoCat.badge,
        nombre: nombre,
        desc: nombre,
        responsable: resp,
        resp,
        presupuesto: presNum,
        fechaInicio: iniStr,
        inicio: iniStr,
        fechaCierre: cieStr,
        cierre: cieStr,
        estado
      });

      renderizarTablaCentrosCostos();
      cerrarModalNuevoCC();
      registrarEventoAuditoria('Centros de Costos', `Alta de código analítico [${codigoFinal}] (${infoCat.nombre}): ${nombre}.`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN E: PERFILES DE USUARIO Y TABLA DE COLABORADORES ACTIVOS
    // =========================================================================
    function renderizarTablaUsuariosPerfiles() {
      const tbody = document.getElementById('tbody-usuarios-perfiles');
      const badge = document.getElementById('badge-total-usuarios');
      if (!tbody) return;

      if (badge) badge.textContent = `${usuariosPerfiles.length} Usuarios Activos`;

      tbody.innerHTML = usuariosPerfiles.map(u => {
        const badgeNivel = u.nivel === 'N3' ? 'hds-badge-solid' : (u.nivel === 'N2' ? 'hds-badge-cyan' : 'hds-badge-soft');
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 font-bold text-slate-900">${u.nombre}</td>
            <td class="py-2.5 px-3 text-[#78716c]">${u.cargo}</td>
            <td class="py-2.5 px-3 text-center"><span class="${badgeNivel} font-mono-num">${u.nivel}</span></td>
            <td class="py-2.5 px-3 text-xs text-slate-800">${u.modulos}</td>
            <td class="py-2.5 px-3 text-center"><span class="hds-badge-cyan">${u.estado}</span></td>
          </tr>
        `;
      }).join('');
    }

    function guardarNuevoPerfilUsuario() {
      const nombre = document.getElementById('perf-nombre').value.trim();
      const cargo = document.getElementById('perf-cargo').value.trim() || 'Colaborador Operativo';
      const nivel = document.getElementById('sel-new-user-tier').value;
      const checks = Array.from(document.querySelectorAll('#perf-modulos-checks input[type="checkbox"]:checked')).map(c => c.value);

      if (!nombre) {
        alert('Por favor ingresa el nombre del colaborador.');
        return;
      }

      const modulosStr = checks.length > 0 ? checks.join(', ') : 'Solo Preferencias N1';
      usuariosPerfiles.push({
        nombre,
        cargo,
        nivel,
        modulos: modulosStr,
        estado: 'Activo'
      });

      document.getElementById('perf-nombre').value = '';
      document.getElementById('perf-cargo').value = '';
      renderizarTablaUsuariosPerfiles();
      registrarEventoAuditoria('Perfiles & SoD', `Creación de perfil [${nivel}] para ${nombre} (${cargo}).`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN F.1: CATÁLOGO DE CUENTAS CONTABLES NIIF (BUG 6 CORREGIDO)
    // =========================================================================
    function recalcularSaldosPorFecha() {
      const fDesde = document.getElementById('cat-fecha-desde').value;
      const fHasta = document.getElementById('cat-fecha-hasta').value;
      if (fDesde && fHasta) {
        const d1 = new Date(fDesde);
        const d2 = new Date(fHasta);
        const dias = Math.max(1, (d2 - d1) / (1000 * 60 * 60 * 24));
        factorFechaCatalogo = Math.min(1.25, Math.max(0.15, +(dias / 303).toFixed(4)));
      }
      renderizarTablaCatalogo();
    }

    let cuentaOriginalEnEdicion = null;

    function renderizarTablaCatalogo() {
      const tbody = document.getElementById('tbody-catalogo-cuentas');
      if (!tbody) return;

      const q = (document.getElementById('cat-filtro-texto')?.value || '').trim().toLowerCase();
      const rubro = document.getElementById('cat-filtro-rubro')?.value || 'TODOS';
      const tipo = document.getElementById('cat-filtro-tipo')?.value || 'TODOS';

      const filtradas = catalogoCuentasNIIF.filter(c => {
        const coincideTexto = !q || c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
        const coincideRubro = (rubro === 'TODOS') || c.codigo.startsWith(rubro);
        const coincideTipo = (tipo === 'TODOS') || (c.tipo === tipo);
        return coincideTexto && coincideRubro && coincideTipo;
      });

      tbody.innerHTML = filtradas.map(c => {
        const esMayor = c.tipo === 'MAYOR';
        const saldoCalculado = (c.saldoBase * factorFechaCatalogo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const badgeEstado = c.estado === 'Activa' ? 'hds-badge-cyan' : 'hds-badge-ember';

        return `
          <tr ondblclick="abrirModalEditarCuenta('${c.codigo}')" title="Doble clic para editar cuenta contable" class="${esMayor ? 'bg-[#fafaf9] font-bold' : 'hover:bg-slate-50/80'} transition-colors cursor-pointer select-none" style="font-family: 'Inter', sans-serif;">
            <td class="py-2.5 px-3 ${esMayor ? 'font-bold' : 'font-medium'} text-slate-900">${c.codigo}</td>
            <td class="py-2.5 px-3 ${esMayor ? 'font-bold uppercase' : 'font-medium pl-6'} text-slate-900">${c.nombre}</td>
            <td class="py-2.5 px-3 text-[#78716c] text-[11px]">${c.desc}</td>
            <td class="py-2.5 px-3 ${esMayor ? 'font-bold' : 'font-medium'} text-center text-slate-900">${c.naturaleza}</td>
            <td class="py-2.5 px-3 text-right ${esMayor ? 'font-bold' : 'font-medium'} text-slate-900">${saldoCalculado}</td>
            <td class="py-2.5 px-3 font-sans text-center"><span class="${badgeEstado}">${c.estado}</span></td>
          </tr>
        `;
      }).join('');

      actualizarKPIsPieCatalogo();
      poblarSelectoresCuentasPuente();
    }

    function actualizarKPIsPieCatalogo() {
      const detalles = catalogoCuentasNIIF.filter(c => c.tipo === 'DETALLE');
      let totActivo = 0;
      let totPasPat = 0;

      detalles.forEach(c => {
        const monto = c.saldoBase * factorFechaCatalogo;
        if (c.codigo.startsWith('1') || c.codigo.startsWith('5')) totActivo += monto;
        if (c.codigo.startsWith('2') || c.codigo.startsWith('3') || c.codigo.startsWith('4')) totPasPat += monto;
      });

      const fmt = (n) => 'L ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const elAct = document.getElementById('kpi-tot-activo');
      const elPas = document.getElementById('kpi-tot-paspat');
      const elDet = document.getElementById('kpi-cuentas-detalle');

      if (elAct) elAct.textContent = fmt(totActivo);
      if (elPas) elPas.textContent = fmt(totPasPat);
      if (elDet) elDet.textContent = `${detalles.length} de Detalle`;
    }

    function abrirModalNuevaCuenta() {
      cuentaOriginalEnEdicion = null;
      const modal = document.getElementById('modal-nueva-cuenta-cat');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      const titulo = document.getElementById('nc-modal-titulo');
      const subtitulo = document.getElementById('nc-modal-subtitulo');
      const btnGuardar = document.getElementById('nc-btn-guardar');
      if (titulo) titulo.textContent = 'Alta de Cuenta Contable en Catálogo NIIF';
      if (subtitulo) subtitulo.textContent = 'El primer dígito determina automáticamente el rubro contable y su naturaleza.';
      if (btnGuardar) btnGuardar.textContent = 'Guardar Cuenta';

      document.getElementById('nc-codigo').value = '';
      document.getElementById('nc-rubro-auto').value = '5 · COSTOS Y GASTOS';
      document.getElementById('nc-naturaleza').value = 'DEBE';
      document.getElementById('nc-nombre').value = '';
      document.getElementById('nc-descripcion').value = '';
      document.getElementById('nc-tipo-nivel').value = 'DETALLE';
      document.getElementById('nc-saldo').value = '0.00';
      const selEst = document.getElementById('nc-estado');
      if (selEst) selEst.value = 'Activa';
      document.getElementById('nc-error-duplicado').classList.add('hidden');
      document.getElementById('nc-codigo').focus();
    }

    function abrirModalEditarCuenta(codigoCuenta) {
      const cta = catalogoCuentasNIIF.find(c => c.codigo === codigoCuenta);
      if (!cta) return;

      cuentaOriginalEnEdicion = cta.codigo;
      const modal = document.getElementById('modal-nueva-cuenta-cat');
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      const titulo = document.getElementById('nc-modal-titulo');
      const subtitulo = document.getElementById('nc-modal-subtitulo');
      const btnGuardar = document.getElementById('nc-btn-guardar');
      if (titulo) titulo.textContent = `Modificar Cuenta Contable [${cta.codigo}]`;
      if (subtitulo) subtitulo.textContent = 'Edita los parámetros de la cuenta y guarda para aplicar los cambios permanentemente.';
      if (btnGuardar) btnGuardar.textContent = 'Guardar Cambios';

      document.getElementById('nc-codigo').value = cta.codigo || '';
      autodetectarRubroCuenta(cta.codigo || '', true);
      document.getElementById('nc-naturaleza').value = cta.naturaleza || 'DEBE';
      document.getElementById('nc-nombre').value = cta.nombre || '';
      document.getElementById('nc-descripcion').value = cta.desc || '';
      document.getElementById('nc-tipo-nivel').value = cta.tipo || 'DETALLE';
      document.getElementById('nc-saldo').value = (Number(cta.saldoBase) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const selEst = document.getElementById('nc-estado');
      if (selEst) selEst.value = cta.estado || 'Activa';
      document.getElementById('nc-error-duplicado').classList.add('hidden');
      document.getElementById('nc-nombre').focus();
    }

    function cerrarModalNuevaCuenta() {
      cuentaOriginalEnEdicion = null;
      const modal = document.getElementById('modal-nueva-cuenta-cat');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function autodetectarRubroCuenta(codigo, conservarNaturaleza = false) {
      const limpio = (codigo || '').trim();
      const mapa = {
        '1': { rubro: '1 · ACTIVO', nat: 'DEBE' },
        '2': { rubro: '2 · PASIVO', nat: 'HABER' },
        '3': { rubro: '3 · PATRIMONIO', nat: 'HABER' },
        '4': { rubro: '4 · INGRESOS', nat: 'HABER' },
        '5': { rubro: '5 · COSTOS Y GASTOS', nat: 'DEBE' },
        '6': { rubro: '6 · GASTOS OPERATIVOS', nat: 'DEBE' }
      };
      const digito = limpio.charAt(0);
      if (mapa[digito]) {
        document.getElementById('nc-rubro-auto').value = mapa[digito].rubro;
        if (!conservarNaturaleza) {
          document.getElementById('nc-naturaleza').value = mapa[digito].nat;
        }
      }
      const existe = catalogoCuentasNIIF.some(c => c.codigo === limpio && c.codigo !== cuentaOriginalEnEdicion);
      document.getElementById('nc-error-duplicado').classList.toggle('hidden', !existe);
    }

    function guardarNuevaCuentaCatalogo() {
      const codigo = document.getElementById('nc-codigo').value.trim();
      const nombre = document.getElementById('nc-nombre').value.trim();
      const desc = document.getElementById('nc-descripcion').value.trim() || 'Cuenta contable NIIF';
      const naturaleza = document.getElementById('nc-naturaleza').value;
      const tipo = document.getElementById('nc-tipo-nivel').value;
      const saldoBase = parseFloat(document.getElementById('nc-saldo').value.replace(/,/g, '')) || 0;
      const estado = document.getElementById('nc-estado')?.value || 'Activa';

      if (!codigo || !nombre) {
        alert('Por favor ingresa el código y el nombre de la cuenta contable.');
        return;
      }

      const duplicado = catalogoCuentasNIIF.some(c => c.codigo === codigo && c.codigo !== cuentaOriginalEnEdicion);
      if (duplicado) {
        document.getElementById('nc-error-duplicado').classList.remove('hidden');
        return;
      }

      if (cuentaOriginalEnEdicion) {
        if (cuentaOriginalEnEdicion !== codigo) {
          if (!Array.isArray(window._codigosCuentasReemplazados)) window._codigosCuentasReemplazados = [];
          if (!window._codigosCuentasReemplazados.includes(cuentaOriginalEnEdicion)) {
            window._codigosCuentasReemplazados.push(cuentaOriginalEnEdicion);
          }
        }
        const idx = catalogoCuentasNIIF.findIndex(c => c.codigo === cuentaOriginalEnEdicion);
        if (idx !== -1) {
          catalogoCuentasNIIF[idx] = { codigo, nombre, desc, naturaleza, tipo, saldoBase, estado };
        } else {
          catalogoCuentasNIIF.push({ codigo, nombre, desc, naturaleza, tipo, saldoBase, estado });
        }
        catalogoCuentasNIIF.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
        renderizarTablaCatalogo();
        cerrarModalNuevaCuenta();
        registrarEventoAuditoria('Catálogo NIIF', `Modificación permanente de cuenta contable [${codigo}] ${nombre} (${tipo} · ${estado}).`);
        guardarConfiguracion(false);
        return;
      }

      catalogoCuentasNIIF.push({ codigo, nombre, desc, naturaleza, tipo, saldoBase, estado });
      catalogoCuentasNIIF.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

      renderizarTablaCatalogo();
      cerrarModalNuevaCuenta();
      registrarEventoAuditoria('Catálogo NIIF', `Alta de cuenta contable [${codigo}] ${nombre}.`);
      guardarConfiguracion(false);
    }

    function exportarCatalogoCSV() {
      const filas = [['Codigo', 'Nombre', 'Descripcion_NIIF', 'Naturaleza', 'Saldo_L', 'Estado']];
      catalogoCuentasNIIF.forEach(c => {
        filas.push([c.codigo, `"${c.nombre}"`, `"${c.desc}"`, c.naturaleza, (c.saldoBase * factorFechaCatalogo).toFixed(2), c.estado]);
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + filas.map(e => e.join(',')).join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', 'catalogo_cuentas_horizon_niif.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // =========================================================================
    // SECCIÓN F.2: BASES DE DATOS — PADRÓN MAESTRO DE TERCEROS (CLIENTES / PROVEEDORES)
    // =========================================================================
    function obtenerBadgeRolComercial(rol) {
      const r = (rol || 'PROVEEDOR').toUpperCase();
      if (r === 'CLIENTE') return '<span class="hds-badge-cyan">Cliente / Deudor</span>';
      if (r === 'DUAL') return '<span class="hds-badge-solid">Dual: Cliente &amp; Proveedor</span>';
      return '<span class="hds-badge-soft">Proveedor / Acreedor</span>';
    }

    function renderizarTablaProveedores() {
      const tbody = document.getElementById('tbody-bd-proveedores');
      if (!tbody) return;

      const q = (document.getElementById('prov-filtro-texto')?.value || '').trim().toLowerCase();
      const rol = document.getElementById('prov-filtro-rol')?.value || 'TODOS';
      const reg = document.getElementById('prov-filtro-regimen')?.value || 'TODOS';

      const filtrados = proveedoresBD.filter(p => {
        const razon = (p.razonSocial || p.nombre || '').toLowerCase();
        const giro = (p.giro || '').toLowerCase();
        const rolItem = (p.rolComercial || 'PROVEEDOR').toUpperCase();
        const regItem = p.regimenRetencion || p.regimen || 'Exento Pagos a Cuenta';
        const matchQ = !q || (p.rtn || '').toLowerCase().includes(q) || razon.includes(q) || giro.includes(q);
        const matchRol = rol === 'TODOS' || rolItem === rol;
        const matchReg = reg === 'TODOS' || regItem === reg;
        return matchQ && matchRol && matchReg;
      });

      tbody.innerHTML = filtrados.map(p => {
        const razon = p.razonSocial || p.nombre || '';
        const cond = p.condicionPago || p.condicion || 'Contado';
        const regItem = p.regimenRetencion || p.regimen || 'Exento Pagos a Cuenta';
        const cta = p.cuentaAch || p.banco || 'Pago por Cheque';
        const badgeReg = regItem.includes('Exento') ? 'hds-badge-cyan' : 'hds-badge-ember';
        const badgeRol = obtenerBadgeRolComercial(p.rolComercial);
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 font-mono-num font-bold text-slate-900">${p.rtn}</td>
            <td class="py-2.5 px-3 font-semibold text-slate-900">${razon}</td>
            <td class="py-2.5 px-3">${badgeRol}</td>
            <td class="py-2.5 px-3 text-[#78716c]">${p.giro || ''}</td>
            <td class="py-2.5 px-3 text-center"><span class="hds-badge-soft">${cond}</span></td>
            <td class="py-2.5 px-3"><span class="${badgeReg}">${regItem}</span></td>
            <td class="py-2.5 px-3 font-mono-num text-xs text-slate-800">${cta}</td>
            <td class="py-2.5 px-3 text-center"><span class="hds-badge-cyan">${p.estado || 'Activo'}</span></td>
          </tr>
        `;
      }).join('');

      // Actualizar KPIs de Terceros
      const totActivos = proveedoresBD.filter(p => (p.estado || 'Activo') === 'Activo').length;
      const totPac = proveedoresBD.filter(p => (p.regimenRetencion || p.regimen) === 'Exento Pagos a Cuenta').length;
      const totRet = proveedoresBD.filter(p => (p.regimenRetencion || p.regimen) !== 'Exento Pagos a Cuenta').length;

      const elTot = document.getElementById('kpi-prov-total');
      const elPac = document.getElementById('kpi-prov-pac');
      const elRet = document.getElementById('kpi-prov-ret');
      if (elTot) elTot.textContent = totActivos;
      if (elPac) elPac.textContent = totPac;
      if (elRet) elRet.textContent = totRet;
    }

    function validarUnicidadTerceroEnVivo() {
      const rtn = (document.getElementById('prov-rtn')?.value || '').trim();
      const nombre = (document.getElementById('prov-nombre')?.value || '').trim().toUpperCase();
      const errEl = document.getElementById('prov-error-duplicado');
      if (!errEl) return false;

      const dupRtn = rtn.length > 0 && proveedoresBD.some(p => (p.rtn || '').trim() === rtn);
      const dupNom = nombre.length > 0 && proveedoresBD.some(p => ((p.razonSocial || p.nombre || '').trim().toUpperCase()) === nombre);
      const esDuplicado = dupRtn || dupNom;
      errEl.classList.toggle('hidden', !esDuplicado);
      return esDuplicado;
    }

    function abrirModalNuevoProveedor() {
      const m = document.getElementById('modal-nuevo-proveedor');
      m.classList.remove('hidden');
      m.classList.add('flex');
      document.getElementById('prov-rtn').value = '';
      document.getElementById('prov-nombre').value = '';
      document.getElementById('prov-giro').value = '';
      document.getElementById('prov-banco').value = '';
      const selRol = document.getElementById('prov-rol');
      if (selRol) selRol.value = 'PROVEEDOR';
      const errEl = document.getElementById('prov-error-duplicado');
      if (errEl) errEl.classList.add('hidden');
      document.getElementById('prov-rtn').focus();
    }

    function cerrarModalNuevoProveedor() {
      const m = document.getElementById('modal-nuevo-proveedor');
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    function guardarNuevoProveedor() {
      const rtn = document.getElementById('prov-rtn').value.trim();
      const nombre = document.getElementById('prov-nombre').value.trim().toUpperCase();
      const rolComercial = document.getElementById('prov-rol')?.value || 'PROVEEDOR';
      const giro = document.getElementById('prov-giro').value.trim() || 'Giro Comercial General';
      const condicion = document.getElementById('prov-condicion').value;
      const regimen = document.getElementById('prov-regimen').value;
      const banco = document.getElementById('prov-banco').value.trim() || 'Pago por Cheque';

      if (!/^\d{14}$/.test(rtn) || !nombre) {
        alert('Por favor ingresa un RTN numérico válido de 14 dígitos y la Razón Social del Tercero.');
        return;
      }

      const dupRtn = proveedoresBD.some(p => (p.rtn || '').trim() === rtn);
      const dupNom = proveedoresBD.some(p => ((p.razonSocial || p.nombre || '').trim().toUpperCase()) === nombre);
      if (dupRtn || dupNom) {
        const errEl = document.getElementById('prov-error-duplicado');
        if (errEl) errEl.classList.remove('hidden');
        alert('Bloqueo de Unicidad HDS: Ya existe un Tercero con ese mismo RTN (14 dígitos) o Razón Social.');
        return;
      }

      proveedoresBD.push({
        rtn,
        razonSocial: nombre,
        nombre,
        rolComercial,
        giro,
        condicionPago: condicion,
        condicion,
        regimenRetencion: regimen,
        regimen,
        cuentaAch: banco,
        banco,
        estado: 'Activo'
      });
      renderizarTablaProveedores();
      cerrarModalNuevoProveedor();
      registrarEventoAuditoria('Padrón de Terceros', `Alta de tercero [${rolComercial}] RTN ${rtn} (${nombre}) bajo régimen: ${regimen}.`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN F.3: BASES DE DATOS — BANCOS Y CAJAS CHICAS
    // =========================================================================
    function renderizarTablaBancos() {
      const tbody = document.getElementById('tbody-bd-bancos');
      if (!tbody) return;

      tbody.innerHTML = bancosCajasBD.map(b => {
        const prefMoneda = b.moneda === 'USD' ? '$ ' : 'L ';
        const saldoFmt = prefMoneda + b.saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const badgeTipo = b.tipo === 'Caja Chica' ? 'hds-badge-soft' : 'hds-badge-solid';
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 font-mono-num font-bold text-slate-900">${b.id}</td>
            <td class="py-2.5 px-3"><span class="${badgeTipo}">${b.tipo}</span></td>
            <td class="py-2.5 px-3 font-semibold text-slate-900">${b.nombre}</td>
            <td class="py-2.5 px-3 font-mono-num text-[#78716c]">${b.cuenta}</td>
            <td class="py-2.5 px-3 font-mono-num font-bold text-center text-[#0284c7]">${b.moneda}</td>
            <td class="py-2.5 px-3 font-mono-num text-xs text-slate-800">${b.niif}</td>
            <td class="py-2.5 px-3 font-mono-num text-right font-bold text-slate-900">${saldoFmt}</td>
            <td class="py-2.5 px-3 text-center"><span class="hds-badge-cyan">${b.estado}</span></td>
          </tr>
        `;
      }).join('');
    }

    function abrirModalNuevoBanco() {
      const m = document.getElementById('modal-nuevo-banco');
      m.classList.remove('hidden');
      m.classList.add('flex');
      document.getElementById('ban-id').value = '';
      document.getElementById('ban-nombre').value = '';
      document.getElementById('ban-cuenta').value = '';
      document.getElementById('ban-id').focus();
    }

    function cerrarModalNuevoBanco() {
      const m = document.getElementById('modal-nuevo-banco');
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    function guardarNuevoBanco() {
      const id = document.getElementById('ban-id').value.trim().toUpperCase();
      const tipo = document.getElementById('ban-tipo').value;
      const nombre = document.getElementById('ban-nombre').value.trim();
      const cuenta = document.getElementById('ban-cuenta').value.trim() || 'Por asignar';
      const moneda = document.getElementById('ban-moneda').value;
      const niif = document.getElementById('ban-niif').value.trim();
      const saldo = parseFloat(document.getElementById('ban-saldo').value.replace(/,/g, '')) || 0;

      if (!id || !nombre) {
        alert('Por favor ingresa el ID/Código y el nombre de la cuenta o fondo fijo.');
        return;
      }

      bancosCajasBD.push({ id, tipo, nombre, cuenta, moneda, niif, saldo, estado: 'Activa' });
      renderizarTablaBancos();
      cerrarModalNuevoBanco();
      registrarEventoAuditoria('BD Tesorería', `Alta de ${tipo} [${id}] ${nombre} (${moneda}).`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // SECCIÓN F.4: BASES DE DATOS — ARTÍCULOS Y SERVICIOS
    // =========================================================================
    function renderizarTablaArticulos() {
      const tbody = document.getElementById('tbody-bd-articulos');
      if (!tbody) return;

      tbody.innerHTML = articulosBD.map(a => {
        const costoFmt = 'L ' + a.costo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const badgeTipo = a.tipo.includes('NIC 16') ? 'hds-badge-solid' : (a.tipo.includes('NIC 2') ? 'hds-badge-cyan' : 'hds-badge-soft');
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 font-mono-num font-bold text-slate-900">${a.sku}</td>
            <td class="py-2.5 px-3 font-semibold text-slate-900">${a.desc}</td>
            <td class="py-2.5 px-3"><span class="${badgeTipo}">${a.tipo}</span></td>
            <td class="py-2.5 px-3 font-mono-num text-center text-[#78716c]">${a.unidad}</td>
            <td class="py-2.5 px-3 font-mono-num text-center font-bold">${a.isv}</td>
            <td class="py-2.5 px-3 font-mono-num text-xs text-slate-800">${a.cuenta}</td>
            <td class="py-2.5 px-3 font-mono-num text-right font-bold text-slate-900">${costoFmt}</td>
          </tr>
        `;
      }).join('');
    }

    function abrirModalNuevoArticulo() {
      const m = document.getElementById('modal-nuevo-articulo');
      m.classList.remove('hidden');
      m.classList.add('flex');
      document.getElementById('art-sku').value = '';
      document.getElementById('art-desc').value = '';
      document.getElementById('art-sku').focus();
    }

    function cerrarModalNuevoArticulo() {
      const m = document.getElementById('modal-nuevo-articulo');
      m.classList.add('hidden');
      m.classList.remove('flex');
    }

    function guardarNuevoArticulo() {
      const sku = document.getElementById('art-sku').value.trim().toUpperCase();
      const desc = document.getElementById('art-desc').value.trim();
      const tipo = document.getElementById('art-tipo').value;
      const unidad = document.getElementById('art-unidad').value;
      const isv = document.getElementById('art-isv').value;
      const cuenta = document.getElementById('art-cuenta').value.trim();
      const costo = parseFloat(document.getElementById('art-costo').value.replace(/,/g, '')) || 0;

      if (!sku || !desc) {
        alert('Completa el código SKU y la descripción del artículo o servicio.');
        return;
      }

      articulosBD.push({ sku, desc, tipo, unidad, isv, cuenta, costo });
      renderizarTablaArticulos();
      cerrarModalNuevoArticulo();
      registrarEventoAuditoria('BD Artículos', `Alta de ítem [${sku}] ${desc} (${tipo}).`);
      guardarConfiguracion(true);
    }

    // =========================================================================
    // BUSCADOR INSTANTÁNEO Y PERSISTENCIA CENTRALIZADA EN LOCALSTORAGE (FASE 3)
    // =========================================================================
    function filtrarBloquesEnVivo(q) {
      const query = q.trim().toLowerCase();
      if (!query) {
        renderizarMenuLateral();
        return;
      }
      document.querySelectorAll('.config-view').forEach(v => {
        if (v.innerText.toLowerCase().includes(query)) v.classList.remove('hidden');
        else v.classList.add('hidden');
      });
    }

    
    // ==============================================================
    // MOTOR REACTIVO DE CUADRANTES DEL LOBBY (6 MÓDULOS - MAX 4)
    // ==============================================================
    const CATALOGO_LOBBY_MODULOS = [
      {
        id: "ingresos",
        nombre: "Ingresos & Comercial",
        desc: "Facturación SAR, Clientes y CxC",
        icon: "⚡",
        colorBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        colorBorder: "#10b981",
        defaultActivo: true,
        defaultOrden: 1
      },
      {
        id: "compras",
        nombre: "Compras & Proveedores",
        desc: "Facturas de Compra, Retenciones SAR y CxP",
        icon: "🛒",
        colorBadge: "bg-amber-50 text-amber-700 border-amber-200",
        colorBorder: "#f59e0b",
        defaultActivo: true,
        defaultOrden: 2
      },
      {
        id: "tesoreria",
        nombre: "Tesorería & Bancos",
        desc: "Bancos, Flujo de Caja y Conciliación",
        icon: "🏦",
        colorBadge: "bg-sky-50 text-sky-700 border-sky-200",
        colorBorder: "#0ea5e9",
        defaultActivo: true,
        defaultOrden: 3
      },
      {
        id: "contabilidad",
        nombre: "Contabilidad & Fiscal",
        desc: "Libro Diario, Mayor y Estados Financieros",
        icon: "⚖️",
        colorBadge: "bg-rose-50 text-rose-700 border-rose-200",
        colorBorder: "#f43f5e",
        defaultActivo: true,
        defaultOrden: 4
      },
      {
        id: "logistica",
        nombre: "Logística, Inventarios & Producción",
        desc: "Kardex, Landed Cost, MRP y Control — enlaza a workspace_logistica_general.html",
        icon: "📦",
        colorBadge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        colorBorder: "#6366f1",
        defaultActivo: false,
        defaultOrden: null
      },
      {
        id: "rrhh_activos",
        nombre: "Planillas & Activos Fijos",
        desc: "Nómina, IHSS/RAP y Depreciación NIIF",
        icon: "👥",
        colorBadge: "bg-purple-50 text-purple-700 border-purple-200",
        colorBorder: "#a855f7",
        defaultActivo: false,
        defaultOrden: null
      }
    ];

    window.lobbyLayoutState = [];

    window.mostrarToastGuardado = function(msg = "Configuración guardada y sincronizada", isError = false) {
      const toast = document.getElementById('toast-guardado-flotante');
      const msgEl = document.getElementById('toast-guardado-msg');
      const headerToast = document.getElementById('toast-guardado');
      if (msgEl) msgEl.textContent = msg;
      if (headerToast) {
        headerToast.textContent = msg;
        headerToast.classList.remove('hidden');
        setTimeout(() => headerToast.classList.add('hidden'), 3500);
      }
      if (toast) {
        if (isError) {
          toast.classList.remove('bg-slate-900');
          toast.classList.add('bg-rose-900');
        } else {
          toast.classList.remove('bg-rose-900');
          toast.classList.add('bg-slate-900');
        }
        toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => {
          toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
          toast.classList.remove('translate-y-0', 'opacity-100');
        }, 3200);
      }
    };

    function initLobbyLayoutState(storedLayout) {
      if (Array.isArray(storedLayout) && storedLayout.length > 0) {
        window.lobbyLayoutState = CATALOGO_LOBBY_MODULOS.map(cat => {
          const found = storedLayout.find(m => m.id === cat.id);
          return {
            id: cat.id,
            nombre: cat.nombre,
            desc: cat.desc,
            activo: found ? !!found.activo : cat.defaultActivo,
            orden: found && found.activo ? Number(found.orden) : (cat.defaultActivo ? cat.defaultOrden : null)
          };
        });
      } else {
        window.lobbyLayoutState = CATALOGO_LOBBY_MODULOS.map(cat => ({
          id: cat.id,
          nombre: cat.nombre,
          desc: cat.desc,
          activo: cat.defaultActivo,
          orden: cat.defaultActivo ? cat.defaultOrden : null
        }));
      }
      renderLobbyConfigUI();
    }

    function renderLobbyConfigUI() {
      const container = document.getElementById('lobby-modules-list');
      if (!container) return;

      const activeCount = window.lobbyLayoutState.filter(m => m.activo).length;
      const badgeCount = document.getElementById('badge-lobby-active-count');
      if (badgeCount) {
        badgeCount.textContent = `${activeCount} / 4 Activos`;
        badgeCount.className = activeCount === 4
          ? "px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white tabular-nums"
          : "px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 tabular-nums";
      }

      container.innerHTML = '';

      CATALOGO_LOBBY_MODULOS.forEach(cat => {
        const state = window.lobbyLayoutState.find(m => m.id === cat.id) || { activo: false, orden: null };
        const row = document.createElement('div');
        row.className = `flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
          state.activo ? 'bg-white border-[#e8e6e5] shadow-xs' : 'bg-[#fafaf9] border-[#f1f0ee] opacity-75'
        }`;
        row.style.borderLeft = state.activo ? `5px solid ${cat.colorBorder}` : `5px solid #d6d3d1`;

        row.innerHTML = `
          <div class="flex items-center gap-3.5">
            <input type="checkbox" id="chk-lobby-${cat.id}" data-module-id="${cat.id}" class="chk-lobby-module w-4 h-4 rounded text-black accent-black cursor-pointer shrink-0" 
              ${state.activo ? 'checked' : ''} 
              onchange="actualizarYGuardarLobbyLayout('${cat.id}', 'check')" />

            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border ${cat.colorBadge}">
              ${cat.icon}
            </div>

            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-[#0c0a09]">${cat.nombre}</span>
                ${cat.id === 'logistica' ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">workspace_logistica_general.html</span>' : ''}
              </div>
              <p class="text-[11px] text-[#78716c] leading-tight mt-0.5">${cat.desc}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end sm:self-center">
            <div class="flex items-center gap-1.5">
              <label class="text-[11px] font-semibold text-[#78716c]">Posición:</label>
              <select id="sel-lobby-${cat.id}" data-module-id="${cat.id}" class="sel-lobby-pos hds-input !py-1 !px-2 text-xs font-bold tabular-nums ${!state.activo ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 cursor-pointer'}" 
                ${!state.activo ? 'disabled' : ''} 
                onchange="actualizarYGuardarLobbyLayout('${cat.id}', 'pos')">
                <option value="1" ${state.orden === 1 ? 'selected' : ''}>1 · Sup. Izquierda</option>
                <option value="2" ${state.orden === 2 ? 'selected' : ''}>2 · Sup. Derecha</option>
                <option value="3" ${state.orden === 3 ? 'selected' : ''}>3 · Inf. Izquierda</option>
                <option value="4" ${state.orden === 4 ? 'selected' : ''}>4 · Inf. Derecha</option>
              </select>
            </div>

            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums ${
              state.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
            }">
              ${state.activo ? `Cuadrante #${state.orden}` : 'Inactivo'}
            </span>
          </div>
        `;

        container.appendChild(row);
      });
    }

    window.actualizarYGuardarLobbyLayout = function(triggerModuleId = null, triggerType = null) {
      if (triggerModuleId && triggerType === 'check') {
        const chk = document.getElementById(`chk-lobby-${triggerModuleId}`);
        if (chk && chk.checked) {
          const currentActive = window.lobbyLayoutState.filter(m => m.activo).length;
          if (currentActive >= 4) {
            alert("Máximo 4 cuadrantes pueden estar activos simultáneamente en el Lobby. Desactiva uno primero.");
            chk.checked = false;
            return;
          }
          const occupied = window.lobbyLayoutState.filter(m => m.activo && m.orden).map(m => m.orden);
          const freeSlot = [1, 2, 3, 4].find(s => !occupied.includes(s)) || 1;
          const target = window.lobbyLayoutState.find(m => m.id === triggerModuleId);
          if (target) {
            target.activo = true;
            target.orden = freeSlot;
          }
        } else if (chk && !chk.checked) {
          const target = window.lobbyLayoutState.find(m => m.id === triggerModuleId);
          if (target) {
            target.activo = false;
            target.orden = null;
          }
        }
      }

      if (triggerModuleId && triggerType === 'pos') {
        const sel = document.getElementById(`sel-lobby-${triggerModuleId}`);
        if (sel) {
          const newPos = parseInt(sel.value, 10);
          const currentItem = window.lobbyLayoutState.find(m => m.id === triggerModuleId);
          const prevPos = currentItem ? currentItem.orden : null;
          
          if (currentItem && prevPos !== newPos) {
            const occupier = window.lobbyLayoutState.find(m => m.activo && m.id !== triggerModuleId && m.orden === newPos);
            if (occupier) {
              occupier.orden = prevPos || [1, 2, 3, 4].find(s => s !== newPos) || 1;
            }
            currentItem.orden = newPos;
          }
        }
      }

      renderLobbyConfigUI();

      // Guardar inmediatamente en localStorage (horizon_system_config)
      try {
        let fullConfig = {};
        const raw = localStorage.getItem('horizon_system_config');
        if (raw) {
          try { fullConfig = JSON.parse(raw); } catch (e) {}
        }
        fullConfig.lobby_layout = obtenerLobbyLayoutDesdeUI();
        fullConfig.updated_at = new Date().toISOString();
        localStorage.setItem('horizon_system_config', JSON.stringify(fullConfig));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'horizon_system_config',
          newValue: JSON.stringify(fullConfig)
        }));

        window.mostrarToastGuardado("Cuadrantes actualizados y sincronizados");
      } catch (err) {
        console.error("Error guardando layout de cuadrantes:", err);
      }
    };

    window.restablecerLobbyDefault = function() {
      window.lobbyLayoutState = CATALOGO_LOBBY_MODULOS.map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        desc: cat.desc,
        activo: cat.defaultActivo,
        orden: cat.defaultActivo ? cat.defaultOrden : null
      }));
      renderLobbyConfigUI();
      actualizarYGuardarLobbyLayout();
    };

    function obtenerLobbyLayoutDesdeUI() {
      return window.lobbyLayoutState.map(m => ({
        id: m.id,
        nombre: m.nombre,
        desc: m.desc,
        activo: !!m.activo,
        orden: m.activo ? Number(m.orden) : null
      }));
    }));
    }


    window.guardarConfiguracion = function(silencioso = false) {
      try {
        if (!silencioso && typeof registrarEventoAuditoria === 'function') {
          try {
            registrarEventoAuditoria('Persistencia ERP', 'Sincronización general guardada en localStorage (horizon_system_config).');
          } catch (e) {}
        }

        let existingConfig = {};
        try {
          const raw = localStorage.getItem('horizon_system_config');
          if (raw) existingConfig = JSON.parse(raw);
        } catch (e) {}

        let centrosExtraidos = [];
        try {
          centrosExtraidos = Array.from(document.querySelectorAll('#tbody-centros-costos tr')).map(tr => {
            const tds = tr.querySelectorAll('td');
            return {
              codigo: tds[0]?.innerText?.trim() || tds[0]?.textContent?.trim() || '',
              categoria: tds[1]?.innerText?.trim() || tds[1]?.textContent?.trim() || '',
              nombre: tds[2]?.innerText?.trim() || tds[2]?.textContent?.trim() || '',
              responsable: tds[3]?.innerText?.trim() || tds[3]?.textContent?.trim() || '',
              presupuesto: tds[4]?.innerText?.trim() || tds[4]?.textContent?.trim() || '0.00',
              fechaInicio: tds[5]?.innerText?.trim() || tds[5]?.textContent?.trim() || '',
              fechaCierre: tds[6]?.innerText?.trim() || tds[6]?.textContent?.trim() || '',
              estado: tds[7]?.innerText?.trim() || tds[7]?.textContent?.trim() || 'Activo'
            };
          }).filter(c => c.codigo);
        } catch (e) {
          centrosExtraidos = existingConfig.centros_costos || [];
        }

        let tercerosNormalizados = [];
        try {
          const provSource = (typeof proveedoresBD !== 'undefined' && Array.isArray(proveedoresBD)) ? proveedoresBD : (existingConfig.terceros || []);
          tercerosNormalizados = provSource.map(t => ({
            rtn: t.rtn || '',
            razonSocial: t.razonSocial || t.nombre || '',
            nombre: t.nombre || t.razonSocial || '',
            rolComercial: (t.rolComercial || 'PROVEEDOR').toUpperCase(),
            giro: t.giro || 'Giro Comercial General',
            condicionPago: t.condicionPago || t.condicion || 'Crédito 30 Días',
            condicion: t.condicion || t.condicionPago || 'Crédito 30 Días',
            regimenRetencion: t.regimenRetencion || t.regimen || 'Exento Pagos a Cuenta',
            regimen: t.regimen || t.regimenRetencion || 'Exento Pagos a Cuenta',
            cuentaAch: t.cuentaAch || t.banco || 'Pago por Cheque',
            banco: t.banco || t.cuentaAch || 'Pago por Cheque',
            estado: t.estado || 'Activo'
          }));
        } catch (e) {
          tercerosNormalizados = existingConfig.terceros || [];
        }

        let layoutActual = [];
        if (typeof obtenerLobbyLayoutDesdeUI === 'function') {
          layoutActual = obtenerLobbyLayoutDesdeUI();
        } else if (window.lobbyLayoutState && window.lobbyLayoutState.length) {
          layoutActual = window.lobbyLayoutState;
        } else {
          layoutActual = existingConfig.lobby_layout || [];
        }

        const configPayload = {
          ...existingConfig,
          company: {
            name: document.getElementById('inp-razon-social')?.value?.trim() || existingConfig.company?.name || 'Inversiones Globales de Honduras S.A. de C.V.',
            rtn: document.getElementById('inp-rtn-empresa')?.value?.trim() || existingConfig.company?.rtn || '08011999123456',
            matricula: document.getElementById('inp-matricula-empresa')?.value || existingConfig.company?.matricula || '2026-0801-99412',
            zolitur_active: document.getElementById('chk-zolitur')?.checked ?? (existingConfig.company?.zolitur_active || false),
            zolitur_lic: document.getElementById('lic-zolitur')?.value || existingConfig.company?.zolitur_lic || '',
            exonerado_active: document.getElementById('chk-exonerado')?.checked ?? (existingConfig.company?.exonerado_active || false),
            exonerado_res: document.getElementById('lic-exonerado')?.value || existingConfig.company?.exonerado_res || '',
            ihss_active: document.getElementById('chk-ihss')?.checked ?? (existingConfig.company?.ihss_active ?? true),
            ihss_pat: document.getElementById('lic-ihss')?.value || existingConfig.company?.ihss_pat || 'PAT-0801-994120',
            establecimientos: (typeof establecimientosSAR !== 'undefined') ? establecimientosSAR : (existingConfig.company?.establecimientos || [])
          },
          period: {
            label: existingConfig.period?.label || 'OCTUBRE 2026',
            status: document.getElementById('period-workflow-badge')?.textContent?.trim() || existingConfig.period?.status || '● ABIERTO OPERATIVO',
            p13_active: (typeof estadoPeriodo13 !== 'undefined') ? estadoPeriodo13 : (existingConfig.period?.p13_active || false),
            p13_firma: document.getElementById('p13-firma-auditora')?.value || existingConfig.period?.p13_firma || '',
            p13_socio: document.getElementById('p13-socio-cpa')?.value || existingConfig.period?.p13_socio || ''
          },
          fx: {
            date: document.getElementById('fx-date')?.value || existingConfig.fx?.date || '2026-10-20',
            buy: parseFloat(document.getElementById('fx-buy')?.value) || existingConfig.fx?.buy || 24.7350,
            sell: parseFloat(document.getElementById('fx-sell')?.value) || existingConfig.fx?.sell || 24.8587
          },
          fx_bch: {
            date: document.getElementById('fx-date')?.value || existingConfig.fx_bch?.date || '2026-10-20',
            buy: document.getElementById('fx-buy')?.value || existingConfig.fx_bch?.buy || '24.7350',
            sell: document.getElementById('fx-sell')?.value || existingConfig.fx_bch?.sell || '24.8587'
          },
          sar_rates: {
            isv_general: parseFloat(document.getElementById('sar-tasa-isv15')?.value) || existingConfig.sar_rates?.isv_general || 15,
            isv_selectivo: parseFloat(document.getElementById('sar-tasa-isv18')?.value) || existingConfig.sar_rates?.isv_selectivo || 18,
            ret_art50: parseFloat(document.getElementById('sar-tasa-ret1')?.value) || existingConfig.sar_rates?.ret_art50 || 1,
            ret_alquileres: parseFloat(document.getElementById('sar-tasa-ret10')?.value) || existingConfig.sar_rates?.ret_alquileres || 10,
            ret_honorarios_res: parseFloat(document.getElementById('sar-tasa-ret125')?.value) || existingConfig.sar_rates?.ret_honorarios_res || 12.5,
            ret_no_residentes: parseFloat(document.getElementById('sar-tasa-ret25')?.value) || existingConfig.sar_rates?.ret_no_residentes || 25,
            pagos_a_cuenta_res: document.getElementById('sar-res-pagos-cuenta')?.value || existingConfig.sar_rates?.pagos_a_cuenta_res || '',
            pagos_a_cuenta_emision: document.getElementById('sar-fecha-emi-pac')?.value || existingConfig.sar_rates?.pagos_a_cuenta_emision || '',
            pagos_a_cuenta_vencimiento: document.getElementById('sar-fecha-ven-pac')?.value || existingConfig.sar_rates?.pagos_a_cuenta_vencimiento || ''
          },
          default_posting_accounts: {
            isv_credito: document.getElementById('puente-isv')?.value || existingConfig.default_posting_accounts?.isv_credito || '1.1.04.01',
            cxp_locales: document.getElementById('puente-cxp')?.value || existingConfig.default_posting_accounts?.cxp_locales || '2.1.01.01',
            ret_isr_sar: document.getElementById('puente-ret')?.value || existingConfig.default_posting_accounts?.ret_isr_sar || '2.1.03.01',
            diferencial_cambiario: document.getElementById('puente-fx')?.value || existingConfig.default_posting_accounts?.diferencial_cambiario || '4.1.01.01'
          },
          sod_limits: {
            n2_max: document.getElementById('sod-limit-n2')?.value || existingConfig.sod_limits?.n2_max || '150,000.00'
          },
          cais: (typeof caisAutorizados !== 'undefined') ? caisAutorizados : (existingConfig.cais || []),
          rules: (typeof rulesRegistry !== 'undefined') ? rulesRegistry : (existingConfig.rules || []),
          rulesRegistry: (typeof rulesRegistry !== 'undefined') ? rulesRegistry : (existingConfig.rulesRegistry || []),
          centros_costos: centrosExtraidos,
          catalogo_cuentas: (typeof catalogoCuentasNIIF !== 'undefined') ? catalogoCuentasNIIF : (existingConfig.catalogo_cuentas || []),
          catalogoCuentasNIIF: (typeof catalogoCuentasNIIF !== 'undefined') ? catalogoCuentasNIIF : (existingConfig.catalogoCuentasNIIF || []),
          codigos_cuentas_reemplazados: window._codigosCuentasReemplazados || existingConfig.codigos_cuentas_reemplazados || [],
          terceros: tercerosNormalizados,
          proveedores: tercerosNormalizados,
          bancos_cajas: (typeof bancosCajasBD !== 'undefined') ? bancosCajasBD : (existingConfig.bancos_cajas || []),
          articulos: (typeof articulosBD !== 'undefined') ? articulosBD : (existingConfig.articulos || []),
          usuarios_perfiles: (typeof usuariosPerfiles !== 'undefined') ? usuariosPerfiles : (existingConfig.usuarios_perfiles || []),
          audit_log: (typeof auditLog !== 'undefined') ? auditLog : (existingConfig.audit_log || []),
          lobby_layout: layoutActual,
          updated_at: new Date().toISOString()
        };

        localStorage.setItem('horizon_system_config', JSON.stringify(configPayload));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'horizon_system_config',
          newValue: JSON.stringify(configPayload)
        }));

        if (!silencioso) {
          window.mostrarToastGuardado("Configuración guardada y sincronizada correctamente");
        }
        console.log("Configuración guardada con éxito en localStorage (horizon_system_config).");
      } catch (err) {
        console.error("Fallo al guardarConfiguracion:", err);
        window.mostrarToastGuardado("Error al guardar: " + err.message, true);
      }
    };
    function guardarConfiguracion(silencioso = false) { return window.guardarConfiguracion(silencioso); }

    function cargarConfiguracionDesdeStorage() {
      try {
        const raw = localStorage.getItem('horizon_system_config');
        if (!raw) return false;
        const data = JSON.parse(raw);
        initLobbyLayoutState(data.lobby_layout);

        if (data.company) {
          if (data.company.name && document.getElementById('inp-razon-social')) {
            document.getElementById('inp-razon-social').value = data.company.name;
          }
          if (data.company.rtn && document.getElementById('inp-rtn-empresa')) {
            document.getElementById('inp-rtn-empresa').value = data.company.rtn;
          }
          if (data.company.matricula && document.getElementById('inp-matricula-empresa')) {
            document.getElementById('inp-matricula-empresa').value = data.company.matricula;
          }
          if (typeof data.company.zolitur_active === 'boolean' && document.getElementById('chk-zolitur')) {
            document.getElementById('chk-zolitur').checked = data.company.zolitur_active;
            if (document.getElementById('lic-zolitur')) document.getElementById('lic-zolitur').disabled = !data.company.zolitur_active;
          }
          if (data.company.zolitur_lic !== undefined && document.getElementById('lic-zolitur')) {
            document.getElementById('lic-zolitur').value = data.company.zolitur_lic;
          }
          if (typeof data.company.exonerado_active === 'boolean' && document.getElementById('chk-exonerado')) {
            document.getElementById('chk-exonerado').checked = data.company.exonerado_active;
            if (document.getElementById('lic-exonerado')) document.getElementById('lic-exonerado').disabled = !data.company.exonerado_active;
          }
          if (data.company.exonerado_res !== undefined && document.getElementById('lic-exonerado')) {
            document.getElementById('lic-exonerado').value = data.company.exonerado_res;
          }
          if (typeof data.company.ihss_active === 'boolean' && document.getElementById('chk-ihss')) {
            document.getElementById('chk-ihss').checked = data.company.ihss_active;
            if (document.getElementById('lic-ihss')) document.getElementById('lic-ihss').disabled = !data.company.ihss_active;
          }
          if (data.company.ihss_pat !== undefined && document.getElementById('lic-ihss')) {
            document.getElementById('lic-ihss').value = data.company.ihss_pat;
          }
          actualizarHeaderEnVivo();
          if (Array.isArray(data.company.establecimientos) && data.company.establecimientos.length > 0) {
            establecimientosSAR.splice(0, establecimientosSAR.length, ...data.company.establecimientos);
          }
        }

        if (data.period) {
          if (data.period.status) {
            estadoOctubre2026 = data.period.status;
            const badge = document.getElementById('period-workflow-badge');
            if (badge) {
              badge.textContent = estadoOctubre2026;
              badge.className = estadoOctubre2026.includes('ABIERTO') ? 'hds-badge-cyan font-mono-num' : (estadoOctubre2026.includes('PENDIENTE') ? 'hds-badge-soft font-mono-num' : 'hds-badge-solid font-mono-num');
            }
          }
          if (typeof data.period.p13_active === 'boolean') {
            estadoPeriodo13 = data.period.p13_active;
            const chk13 = document.getElementById('chk-periodo-13');
            if (chk13) chk13.checked = estadoPeriodo13;
            const badge13 = document.getElementById('p13-status-badge');
            if (badge13) {
              badge13.textContent = estadoPeriodo13 ? '🟢 HABILITADO N3' : '🔒 INACTIVO';
              badge13.className = estadoPeriodo13 ? 'hds-badge-cyan font-mono-num' : 'hds-badge-soft font-mono-num';
            }
          }
          if (data.period.p13_firma && document.getElementById('p13-firma-auditora')) {
            document.getElementById('p13-firma-auditora').value = data.period.p13_firma;
          }
          if (data.period.p13_socio && document.getElementById('p13-socio-cpa')) {
            document.getElementById('p13-socio-cpa').value = data.period.p13_socio;
          }
        }

        const fxObj = data.fx || data.fx_bch;
        if (fxObj) {
          if (fxObj.date && document.getElementById('fx-date')) document.getElementById('fx-date').value = fxObj.date;
          if (fxObj.buy && document.getElementById('fx-buy')) document.getElementById('fx-buy').value = Number(fxObj.buy).toFixed(4);
          if (fxObj.sell && document.getElementById('fx-sell')) document.getElementById('fx-sell').value = Number(fxObj.sell).toFixed(4);
        }

        if (data.sar_rates) {
          if (data.sar_rates.isv_general !== undefined && document.getElementById('sar-tasa-isv15')) document.getElementById('sar-tasa-isv15').value = Number(data.sar_rates.isv_general).toFixed(2);
          if (data.sar_rates.isv_selectivo !== undefined && document.getElementById('sar-tasa-isv18')) document.getElementById('sar-tasa-isv18').value = Number(data.sar_rates.isv_selectivo).toFixed(2);
          if (data.sar_rates.ret_art50 !== undefined && document.getElementById('sar-tasa-ret1')) document.getElementById('sar-tasa-ret1').value = Number(data.sar_rates.ret_art50).toFixed(2);
          if (data.sar_rates.ret_alquileres !== undefined && document.getElementById('sar-tasa-ret10')) document.getElementById('sar-tasa-ret10').value = Number(data.sar_rates.ret_alquileres).toFixed(2);
          if (data.sar_rates.ret_honorarios_res !== undefined && document.getElementById('sar-tasa-ret125')) document.getElementById('sar-tasa-ret125').value = Number(data.sar_rates.ret_honorarios_res).toFixed(2);
          if (data.sar_rates.ret_no_residentes !== undefined && document.getElementById('sar-tasa-ret25')) document.getElementById('sar-tasa-ret25').value = Number(data.sar_rates.ret_no_residentes).toFixed(2);
          if (data.sar_rates.pagos_a_cuenta_res && document.getElementById('sar-res-pagos-cuenta')) document.getElementById('sar-res-pagos-cuenta').value = data.sar_rates.pagos_a_cuenta_res;
          if (data.sar_rates.pagos_a_cuenta_emision && document.getElementById('sar-fecha-emi-pac')) document.getElementById('sar-fecha-emi-pac').value = data.sar_rates.pagos_a_cuenta_emision;
          if (data.sar_rates.pagos_a_cuenta_vencimiento && document.getElementById('sar-fecha-ven-pac')) document.getElementById('sar-fecha-ven-pac').value = data.sar_rates.pagos_a_cuenta_vencimiento;
        }

        if (data.default_posting_accounts) {
          window._cuentasPuenteHidratadas = data.default_posting_accounts;
        }

        if (data.sod_limits && data.sod_limits.n2_max && document.getElementById('sod-limit-n2')) {
          document.getElementById('sod-limit-n2').value = data.sod_limits.n2_max;
        }

        if (Array.isArray(data.cais) && data.cais.length > 0) caisAutorizados.splice(0, caisAutorizados.length, ...data.cais);
        const rulesArr = data.rules || data.rulesRegistry;
        if (Array.isArray(rulesArr) && rulesArr.length > 0) rulesRegistry.splice(0, rulesRegistry.length, ...rulesArr);
        if (Array.isArray(data.centros_costos) && data.centros_costos.length > 0) {
          const normCC = data.centros_costos.map(c => ({
            ...c,
            nombre: c.nombre || c.desc || '',
            desc: c.desc || c.nombre || '',
            responsable: c.responsable || c.resp || '',
            resp: c.resp || c.responsable || '',
            fechaInicio: c.fechaInicio || c.inicio || '01/01/2026',
            inicio: c.inicio || c.fechaInicio || '01/01/2026',
            fechaCierre: c.fechaCierre || c.cierre || 'En proceso',
            cierre: c.cierre || c.fechaCierre || 'En proceso',
            badge: c.badge || (DICCIONARIO_PREFIJOS_CC[(c.codigo || 'CC').split('-')[0]]?.badge || 'hds-badge-soft')
          }));
          centrosCostos.splice(0, centrosCostos.length, ...normCC);
        }
        const catArr = data.catalogo_cuentas || data.catalogoCuentasNIIF;
        if (Array.isArray(catArr) && catArr.length > 0) {
          // Hidratar y conservar todas las ediciones permanentes (incluyendo cambios de código) y cuentas nuevas guardadas en localStorage
          const codigosEliminados = new Set(Array.isArray(data.codigos_cuentas_reemplazados) ? data.codigos_cuentas_reemplazados : []);
          const mapBase = new Map();
          catalogoCuentasNIIF.forEach(c => {
            if (!codigosEliminados.has(c.codigo)) {
              mapBase.set(c.codigo, { ...c });
            }
          });
          catArr.forEach(c => {
            if (!c || !c.codigo) return;
            const prev = mapBase.get(c.codigo) || {};
            mapBase.set(c.codigo, {
              ...prev,
              ...c,
              estado: c.estado || prev.estado || 'Activa'
            });
          });
          const fusionadas = Array.from(mapBase.values()).sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
          catalogoCuentasNIIF.splice(0, catalogoCuentasNIIF.length, ...fusionadas);
          window._codigosCuentasReemplazados = Array.from(codigosEliminados);
        }
        const tercArr = data.terceros || data.proveedores;
        if (Array.isArray(tercArr) && tercArr.length > 0) {
          const normTerc = tercArr.map(t => ({
            ...t,
            razonSocial: t.razonSocial || t.nombre || '',
            nombre: t.nombre || t.razonSocial || '',
            rolComercial: (t.rolComercial || 'PROVEEDOR').toUpperCase(),
            condicionPago: t.condicionPago || t.condicion || 'Crédito 30 Días',
            condicion: t.condicion || t.condicionPago || 'Crédito 30 Días',
            regimenRetencion: t.regimenRetencion || t.regimen || 'Exento Pagos a Cuenta',
            regimen: t.regimen || t.regimenRetencion || 'Exento Pagos a Cuenta',
            cuentaAch: t.cuentaAch || t.banco || 'Pago por Cheque',
            banco: t.banco || t.cuentaAch || 'Pago por Cheque',
            estado: t.estado || 'Activo'
          }));
          proveedoresBD.splice(0, proveedoresBD.length, ...normTerc);
        }
        if (Array.isArray(data.bancos_cajas) && data.bancos_cajas.length > 0) bancosCajasBD.splice(0, bancosCajasBD.length, ...data.bancos_cajas);
        if (Array.isArray(data.articulos) && data.articulos.length > 0) articulosBD.splice(0, articulosBD.length, ...data.articulos);
        if (Array.isArray(data.usuarios_perfiles) && data.usuarios_perfiles.length > 0) usuariosPerfiles.splice(0, usuariosPerfiles.length, ...data.usuarios_perfiles);
        if (Array.isArray(data.audit_log) && data.audit_log.length > 0) auditLog.splice(0, auditLog.length, ...data.audit_log);
        return true;
      } catch (e) {
        console.warn('No se pudo hidratar horizon_system_config:', e);
        return false;
      }
    }

    // =========================================================================
    // INICIALIZACIÓN DEL SISTEMA AL ARRANCAR
    // =========================================================================
    document.addEventListener('DOMContentLoaded', function() {
      const teniaStorage = cargarConfiguracionDesdeStorage();
      if (!lobbyLayoutState.length) initLobbyLayoutState(null);
      renderizarEstablecimientosSAR();
      renderizarTablaCAIs();
      evaluarVigenciaPagosACuenta();
      renderizarMatrizPeriodos();
      renderizarTablaCentrosCostos();
      renderizarTablaUsuariosPerfiles();
      renderizarBitacoraAuditoria();
      renderizarTablaCatalogo();
      renderizarTablaProveedores();
      renderizarTablaBancos();
      renderizarTablaArticulos();
      renderizarReglasActivas();
      cambiarSegmento('config');
      aplicarPermisosEnCampos();
      guardarConfiguracion(true);
    });
  