'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Invoice, InvoiceLine, ThirdParty, TaxEntry, PaymentScheduleItem } from '@/lib/api/types';

// ── Mock Third Parties ────────────────────────────────────────────────
const mockThirdParties: ThirdParty[] = [
  { id: 'tp-1', companyId: 'c-1', name: 'Constructora Hernández S.A. de C.V.', taxId: 'CHH190101ABC', type: 'CLIENT', email: 'ventas@hernandez.mx', phone: '555-123-4567', address: 'Av. Insurgentes Sur 1234, CDMX', balance: 125000, isActive: true, createdAt: '2025-01-15T10:00:00Z' },
  { id: 'tp-2', companyId: 'c-1', name: 'Distribuidora Nacional de Materiales', taxId: 'DNM200202DEF', type: 'SUPPLIER', email: 'contacto@dnm.mx', phone: '555-234-5678', address: 'Blvd. Manuel Ávila Camacho 56, CDMX', balance: -87000, isActive: true, createdAt: '2025-02-01T10:00:00Z' },
  { id: 'tp-3', companyId: 'c-1', name: 'TechSoft Solutions', taxId: 'TSS210303GHI', type: 'CLIENT', email: 'facturacion@techsoft.mx', phone: '555-345-6789', address: 'Col. Del Valle, CDMX', balance: 56000, isActive: true, createdAt: '2025-03-10T10:00:00Z' },
  { id: 'tp-4', companyId: 'c-1', name: 'Oficina de Suministros del Norte', taxId: 'OSN220404JKL', type: 'SUPPLIER', email: 'pedidos@osn.mx', phone: '555-456-7890', address: 'Calle Reforma 789, Monterrey', balance: -34000, isActive: true, createdAt: '2025-04-05T10:00:00Z' },
  { id: 'tp-5', companyId: 'c-1', name: 'Grupo Empresarial del Pacífico', taxId: 'GEP230505MNO', type: 'CLIENT', email: 'cuentas@gep.mx', phone: '555-567-8901', address: 'Av. Costera Miguel Alemán, Guadalajara', balance: 198000, isActive: true, createdAt: '2025-05-20T10:00:00Z' },
  { id: 'tp-6', companyId: 'c-1', name: 'Papelería y Artículos de Oficina López', taxId: 'PAL240606PQR', type: 'SUPPLIER', email: 'ventas@palo.mx', phone: '555-678-9012', address: 'Calle 5 de Mayo 45, Puebla', balance: -12500, isActive: true, createdAt: '2025-06-01T10:00:00Z' },
  { id: 'tp-7', companyId: 'c-1', name: 'Automotriz del Bajío S.A.', taxId: 'ADB250707STU', type: 'CLIENT', email: 'pagos@adb.mx', phone: '555-789-0123', address: 'Blvd. Campestre 321, León', balance: 287000, isActive: true, createdAt: '2025-07-12T10:00:00Z' },
  { id: 'tp-8', companyId: 'c-1', name: 'Servicios Profesionales García y Asociados', taxId: 'SPG260808VWX', type: 'BOTH', email: 'contacto@garcia-asoc.mx', phone: '555-890-1234', address: 'Paseo de la Reforma 1000, CDMX', balance: 42000, isActive: true, createdAt: '2025-08-01T10:00:00Z' },
];

// ── Mock Invoices ─────────────────────────────────────────────────────
const mockInvoices: Invoice[] = [
  {
    id: 'inv-1', companyId: 'c-1', thirdPartyId: 'tp-1', invoiceNumber: 'CFE-2025-0001', invoiceType: 'SALE',
    description: 'Servicios de consultoría contable - Proyecto Ampliación', invoiceDate: '2025-10-01T00:00:00Z',
    dueDate: '2025-11-01T00:00:00Z', status: 'PAID', subtotal: 100000, taxAmount: 16000, totalAmount: 116000, balanceDue: 0,
    lines: [
      { id: 'l-1', description: 'Consultoría fiscal mensual', quantity: 1, unitPrice: 60000, subtotal: 60000, taxRate: 16, taxAmount: 9600, total: 69600 },
      { id: 'l-2', description: 'Revisión de estados financieros', quantity: 1, unitPrice: 40000, subtotal: 40000, taxRate: 16, taxAmount: 6400, total: 46400 },
    ],
    taxEntries: [{ id: 't-1', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 100000, taxAmount: 16000 }],
    paymentSchedule: [{ id: 'ps-1', amount: 116000, dueDate: '2025-11-01T00:00:00Z', paidAmount: 116000, status: 'PAID', paidDate: '2025-10-28T00:00:00Z', paymentMethod: 'Transferencia' }],
    createdAt: '2025-10-01T10:00:00Z',
  },
  {
    id: 'inv-2', companyId: 'c-1', thirdPartyId: 'tp-2', invoiceNumber: 'CPR-2025-0001', invoiceType: 'PURCHASE',
    description: 'Materiales de construcción - Lote Octubre', invoiceDate: '2025-10-05T00:00:00Z',
    dueDate: '2025-11-05T00:00:00Z', status: 'PAID', subtotal: 45000, taxAmount: 7200, totalAmount: 52200, balanceDue: 0,
    lines: [
      { id: 'l-3', description: 'Cemento Portland 50kg (200 bolsas)', quantity: 200, unitPrice: 120, subtotal: 24000, taxRate: 16, taxAmount: 3840, total: 27840 },
      { id: 'l-4', description: 'Varilla corrugada 3/8" (5 toneladas)', quantity: 5, unitPrice: 4200, subtotal: 21000, taxRate: 16, taxAmount: 3360, total: 24360 },
    ],
    taxEntries: [{ id: 't-2', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 45000, taxAmount: 7200 }],
    paymentSchedule: [{ id: 'ps-2', amount: 52200, dueDate: '2025-11-05T00:00:00Z', paidAmount: 52200, status: 'PAID', paidDate: '2025-10-30T00:00:00Z', paymentMethod: 'Cheque' }],
    createdAt: '2025-10-05T10:00:00Z',
  },
  {
    id: 'inv-3', companyId: 'c-1', thirdPartyId: 'tp-5', invoiceNumber: 'CFE-2025-0002', invoiceType: 'SALE',
    description: 'Auditoría anual - Ejercicio Fiscal 2025', invoiceDate: '2025-10-10T00:00:00Z',
    dueDate: '2025-12-10T00:00:00Z', status: 'PENDING', subtotal: 180000, taxAmount: 28800, totalAmount: 208800, balanceDue: 208800,
    lines: [
      { id: 'l-5', description: 'Auditoría financiera completa', quantity: 1, unitPrice: 150000, subtotal: 150000, taxRate: 16, taxAmount: 24000, total: 174000 },
      { id: 'l-6', description: 'Dictamen fiscal', quantity: 1, unitPrice: 30000, subtotal: 30000, taxRate: 16, taxAmount: 4800, total: 34800 },
    ],
    taxEntries: [{ id: 't-3', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 180000, taxAmount: 28800 }],
    paymentSchedule: [{ id: 'ps-3', amount: 208800, dueDate: '2025-12-10T00:00:00Z', paidAmount: 0, status: 'PENDING' }],
    createdAt: '2025-10-10T10:00:00Z',
  },
  {
    id: 'inv-4', companyId: 'c-1', thirdPartyId: 'tp-3', invoiceNumber: 'CFE-2025-0003', invoiceType: 'SALE',
    description: 'Desarrollo de sistema ERP contable', invoiceDate: '2025-09-15T00:00:00Z',
    dueDate: '2025-10-15T00:00:00Z', status: 'OVERDUE', subtotal: 95000, taxAmount: 15200, totalAmount: 110200, balanceDue: 110200,
    lines: [
      { id: 'l-7', description: 'Desarrollo de módulo de facturación', quantity: 1, unitPrice: 95000, subtotal: 95000, taxRate: 16, taxAmount: 15200, total: 110200 },
    ],
    taxEntries: [{ id: 't-4', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 95000, taxAmount: 15200 }],
    paymentSchedule: [{ id: 'ps-4', amount: 110200, dueDate: '2025-10-15T00:00:00Z', paidAmount: 0, status: 'OVERDUE' }],
    createdAt: '2025-09-15T10:00:00Z',
  },
  {
    id: 'inv-5', companyId: 'c-1', thirdPartyId: 'tp-6', invoiceNumber: 'CPR-2025-0002', invoiceType: 'PURCHASE',
    description: 'Insumos de oficina - Tercer trimestre', invoiceDate: '2025-10-12T00:00:00Z',
    dueDate: '2025-11-12T00:00:00Z', status: 'PARTIAL', subtotal: 12500, taxAmount: 2000, totalAmount: 14500, balanceDue: 7250,
    lines: [
      { id: 'l-8', description: 'Resmas de papel carta (50 unidades)', quantity: 50, unitPrice: 80, subtotal: 4000, taxRate: 16, taxAmount: 640, total: 4640 },
      { id: 'l-9', description: 'Cartuchos de tóner HP (10 unidades)', quantity: 10, unitPrice: 650, subtotal: 6500, taxRate: 16, taxAmount: 1040, total: 7540 },
      { id: 'l-10', description: 'Archiveros metálicos (2 unidades)', quantity: 2, unitPrice: 1000, subtotal: 2000, taxRate: 16, taxAmount: 320, total: 2320 },
    ],
    taxEntries: [{ id: 't-5', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 12500, taxAmount: 2000 }],
    paymentSchedule: [
      { id: 'ps-5', amount: 7250, dueDate: '2025-10-12T00:00:00Z', paidAmount: 7250, status: 'PAID', paidDate: '2025-10-10T00:00:00Z', paymentMethod: 'Transferencia' },
      { id: 'ps-6', amount: 7250, dueDate: '2025-11-12T00:00:00Z', paidAmount: 0, status: 'PENDING' },
    ],
    createdAt: '2025-10-12T10:00:00Z',
  },
  {
    id: 'inv-6', companyId: 'c-1', thirdPartyId: 'tp-7', invoiceNumber: 'CFE-2025-0004', invoiceType: 'SALE',
    description: 'Asesoría financiera y planeación fiscal', invoiceDate: '2025-10-20T00:00:00Z',
    dueDate: '2025-11-20T00:00:00Z', status: 'PAID', subtotal: 75000, taxAmount: 12000, totalAmount: 87000, balanceDue: 0,
    lines: [
      { id: 'l-11', description: 'Asesoría fiscal integral', quantity: 1, unitPrice: 50000, subtotal: 50000, taxRate: 16, taxAmount: 8000, total: 58000 },
      { id: 'l-12', description: 'Planeación patrimonial', quantity: 1, unitPrice: 25000, subtotal: 25000, taxRate: 16, taxAmount: 4000, total: 29000 },
    ],
    taxEntries: [{ id: 't-6', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 75000, taxAmount: 12000 }],
    paymentSchedule: [{ id: 'ps-7', amount: 87000, dueDate: '2025-11-20T00:00:00Z', paidAmount: 87000, status: 'PAID', paidDate: '2025-11-15T00:00:00Z', paymentMethod: 'Transferencia' }],
    createdAt: '2025-10-20T10:00:00Z',
  },
  {
    id: 'inv-7', companyId: 'c-1', thirdPartyId: 'tp-4', invoiceNumber: 'CPR-2025-0003', invoiceType: 'PURCHASE',
    description: 'Equipo de cómputo - Estaciones de trabajo', invoiceDate: '2025-11-01T00:00:00Z',
    dueDate: '2025-12-01T00:00:00Z', status: 'PENDING', subtotal: 85000, taxAmount: 13600, totalAmount: 98600, balanceDue: 98600,
    lines: [
      { id: 'l-13', description: 'Laptop Dell Latitude 5540 (5 unidades)', quantity: 5, unitPrice: 15000, subtotal: 75000, taxRate: 16, taxAmount: 12000, total: 87000 },
      { id: 'l-14', description: 'Mouse inalámbrico Logitech (5 unidades)', quantity: 5, unitPrice: 800, subtotal: 4000, taxRate: 16, taxAmount: 640, total: 4640 },
      { id: 'l-15', description: 'Funda protectora (5 unidades)', quantity: 5, unitPrice: 600, subtotal: 3000, taxRate: 16, taxAmount: 480, total: 3480 },
      { id: 'l-16', description: 'Docking station USB-C (5 unidades)', quantity: 5, unitPrice: 1200, subtotal: 6000, taxRate: 16, taxAmount: 960, total: 6960 },
    ],
    taxEntries: [{ id: 't-7', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 85000, taxAmount: 13600 }],
    paymentSchedule: [{ id: 'ps-8', amount: 98600, dueDate: '2025-12-01T00:00:00Z', paidAmount: 0, status: 'PENDING' }],
    createdAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'inv-8', companyId: 'c-1', thirdPartyId: 'tp-1', invoiceNumber: 'CFE-2025-0005', invoiceType: 'SALE',
    description: 'Servicios contables mensuales - Noviembre 2025', invoiceDate: '2025-11-01T00:00:00Z',
    dueDate: '2025-12-01T00:00:00Z', status: 'PENDING', subtotal: 35000, taxAmount: 5600, totalAmount: 40600, balanceDue: 40600,
    lines: [
      { id: 'l-17', description: 'Contabilidad mensual', quantity: 1, unitPrice: 25000, subtotal: 25000, taxRate: 16, taxAmount: 4000, total: 29000 },
      { id: 'l-18', description: 'Nóminas y declaraciones', quantity: 1, unitPrice: 10000, subtotal: 10000, taxRate: 16, taxAmount: 1600, total: 11600 },
    ],
    taxEntries: [{ id: 't-8', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 35000, taxAmount: 5600 }],
    paymentSchedule: [{ id: 'ps-9', amount: 40600, dueDate: '2025-12-01T00:00:00Z', paidAmount: 0, status: 'PENDING' }],
    createdAt: '2025-11-01T10:00:00Z',
  },
  {
    id: 'inv-9', companyId: 'c-1', thirdPartyId: 'tp-8', invoiceNumber: 'CPR-2025-0004', invoiceType: 'PURCHASE',
    description: 'Servicios legales - Constitución de fideicomiso', invoiceDate: '2025-11-05T00:00:00Z',
    dueDate: '2025-12-05T00:00:00Z', status: 'DRAFT', subtotal: 60000, taxAmount: 9600, totalAmount: 69600, balanceDue: 69600,
    lines: [
      { id: 'l-19', description: 'Honorarios por constitución de fideicomiso', quantity: 1, unitPrice: 50000, subtotal: 50000, taxRate: 16, taxAmount: 8000, total: 58000 },
      { id: 'l-20', description: 'Gastos de escritura y registro', quantity: 1, unitPrice: 10000, subtotal: 10000, taxRate: 16, taxAmount: 1600, total: 11600 },
    ],
    taxEntries: [{ id: 't-9', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 60000, taxAmount: 9600 }],
    paymentSchedule: [{ id: 'ps-10', amount: 69600, dueDate: '2025-12-05T00:00:00Z', paidAmount: 0, status: 'PENDING' }],
    createdAt: '2025-11-05T10:00:00Z',
  },
  {
    id: 'inv-10', companyId: 'c-1', thirdPartyId: 'tp-7', invoiceNumber: 'CFE-2025-0006', invoiceType: 'SALE',
    description: 'Declaraciones anuales y cierre fiscal 2024', invoiceDate: '2025-08-01T00:00:00Z',
    dueDate: '2025-09-01T00:00:00Z', status: 'CANCELLED', subtotal: 42000, taxAmount: 6720, totalAmount: 48720, balanceDue: 0,
    lines: [
      { id: 'l-21', description: 'Declaración anual ISR persona moral', quantity: 1, unitPrice: 25000, subtotal: 25000, taxRate: 16, taxAmount: 4000, total: 29000 },
      { id: 'l-22', description: 'Declaración informativa de operaciones', quantity: 1, unitPrice: 17000, subtotal: 17000, taxRate: 16, taxAmount: 2720, total: 19720 },
    ],
    taxEntries: [{ id: 't-10', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 42000, taxAmount: 6720 }],
    paymentSchedule: [],
    createdAt: '2025-08-01T10:00:00Z',
  },
  {
    id: 'inv-11', companyId: 'c-1', thirdPartyId: 'tp-3', invoiceNumber: 'CFE-2025-0007', invoiceType: 'SALE',
    description: 'Capacitación contable - Equipo de finanzas', invoiceDate: '2025-11-10T00:00:00Z',
    dueDate: '2025-12-10T00:00:00Z', status: 'OVERDUE', subtotal: 28000, taxAmount: 4480, totalAmount: 32480, balanceDue: 32480,
    lines: [
      { id: 'l-23', description: 'Curso: Normas Internacionales de Información Financiera (16 hrs)', quantity: 1, unitPrice: 18000, subtotal: 18000, taxRate: 16, taxAmount: 2880, total: 20880 },
      { id: 'l-24', description: 'Material didáctico y certificado', quantity: 1, unitPrice: 10000, subtotal: 10000, taxRate: 16, taxAmount: 1600, total: 11600 },
    ],
    taxEntries: [{ id: 't-11', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 28000, taxAmount: 4480 }],
    paymentSchedule: [{ id: 'ps-11', amount: 32480, dueDate: '2025-12-10T00:00:00Z', paidAmount: 0, status: 'OVERDUE' }],
    createdAt: '2025-11-10T10:00:00Z',
  },
  {
    id: 'inv-12', companyId: 'c-1', thirdPartyId: 'tp-4', invoiceNumber: 'CPR-2025-0005', invoiceType: 'PURCHASE',
    description: 'Mobiliario de oficina - Renovación área de trabajo', invoiceDate: '2025-11-15T00:00:00Z',
    dueDate: '2025-12-15T00:00:00Z', status: 'PAID', subtotal: 52000, taxAmount: 8320, totalAmount: 60320, balanceDue: 0,
    lines: [
      { id: 'l-25', description: 'Escritorio ejecutivo (4 unidades)', quantity: 4, unitPrice: 8000, subtotal: 32000, taxRate: 16, taxAmount: 5120, total: 37120 },
      { id: 'l-26', description: 'Silla ergonómica (4 unidades)', quantity: 4, unitPrice: 5000, subtotal: 20000, taxRate: 16, taxAmount: 3200, total: 23200 },
    ],
    taxEntries: [{ id: 't-12', taxName: 'IVA 16%', taxRate: 16, taxableAmount: 52000, taxAmount: 8320 }],
    paymentSchedule: [{ id: 'ps-12', amount: 60320, dueDate: '2025-12-15T00:00:00Z', paidAmount: 60320, status: 'PAID', paidDate: '2025-12-10T00:00:00Z', paymentMethod: 'Tarjeta de crédito' }],
    createdAt: '2025-11-15T10:00:00Z',
  },
];

// ── Delay helper ──────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Hook ──────────────────────────────────────────────────────────────
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [thirdParties] = useState<ThirdParty[]>(mockThirdParties);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Simulate loading on mount
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const tp = thirdParties.find((t) => t.id === inv.thirdPartyId);
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(searchLower) ||
      (tp?.name ?? '').toLowerCase().includes(searchLower) ||
      (inv.description ?? '').toLowerCase().includes(searchLower);
    const matchType = !typeFilter || inv.invoiceType === typeFilter;
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const total = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedInvoices = filteredInvoices.slice((page - 1) * limit, page * limit);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const getInvoice = useCallback(
    (id: string) => {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return null;
      const tp = thirdParties.find((t) => t.id === inv.thirdPartyId);
      return { ...inv, thirdParty: tp };
    },
    [invoices, thirdParties],
  );

  const createInvoice = useCallback(
    async (data: {
      thirdPartyId: string;
      invoiceType: 'SALE' | 'PURCHASE';
      description: string;
      invoiceDate: string;
      dueDate: string;
      lines: Omit<InvoiceLine, 'id' | 'subtotal' | 'taxAmount' | 'total'>[];
    }): Promise<Invoice | null> => {
      await delay(500);
      const prefix = data.invoiceType === 'SALE' ? 'CFE' : 'CPR';
      const nextNum = String(invoices.length + 1).padStart(4, '0');
      const year = new Date().getFullYear();

      const computedLines: InvoiceLine[] = data.lines.map((line, idx) => {
        const subtotal = line.quantity * line.unitPrice;
        const taxAmount = subtotal * (line.taxRate / 100);
        return { id: `l-${Date.now()}-${idx}`, invoiceId: '', ...line, subtotal, taxAmount, total: subtotal + taxAmount };
      });

      const subtotal = computedLines.reduce((s, l) => s + l.subtotal, 0);
      const taxAmount = computedLines.reduce((s, l) => s + l.taxAmount, 0);
      const totalAmount = subtotal + taxAmount;

      const tp = thirdParties.find((t) => t.id === data.thirdPartyId);

      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        companyId: 'c-1',
        thirdPartyId: data.thirdPartyId,
        thirdParty: tp,
        invoiceNumber: `${prefix}-${year}-${nextNum}`,
        invoiceType: data.invoiceType,
        description: data.description,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        totalAmount,
        balanceDue: totalAmount,
        lines: computedLines,
        taxEntries: [{ id: `t-${Date.now()}`, taxName: 'IVA 16%', taxRate: 16, taxableAmount: subtotal, taxAmount }],
        paymentSchedule: [{ id: `ps-${Date.now()}`, amount: totalAmount, dueDate: data.dueDate, paidAmount: 0, status: 'PENDING' as const }],
        createdAt: new Date().toISOString(),
      };

      setInvoices((prev) => [newInv, ...prev]);
      return newInv;
    },
    [invoices, thirdParties],
  );

  const payInvoice = useCallback(async (id: string): Promise<boolean> => {
    await delay(500);
    let success = false;
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        success = true;
        return {
          ...inv,
          status: 'PAID' as const,
          balanceDue: 0,
          paymentSchedule: inv.paymentSchedule.map((ps) => ({
            ...ps,
            status: 'PAID' as const,
            paidAmount: ps.amount,
            paidDate: new Date().toISOString(),
            paymentMethod: 'Transferencia',
          })),
        };
      }),
    );
    return success;
  }, []);

  const cancelInvoice = useCallback(async (id: string): Promise<boolean> => {
    await delay(500);
    let success = false;
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        success = true;
        return { ...inv, status: 'CANCELLED' as const, balanceDue: 0 };
      }),
    );
    return success;
  }, []);

  // Summary stats
  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const pendingAmount = invoices.filter((i) => i.status === 'PENDING' || i.status === 'PARTIAL' || i.status === 'OVERDUE').reduce((s, i) => s + i.balanceDue, 0);
  const overdueAmount = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.balanceDue, 0);
  const paidAmount = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);

  return {
    invoices: paginatedInvoices,
    allInvoices: invoices,
    thirdParties,
    isLoading,
    total,
    totalPages,
    page,
    limit,
    search,
    typeFilter,
    statusFilter,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setPage,
    clearFilters,
    getInvoice,
    createInvoice,
    payInvoice,
    cancelInvoice,
    totalInvoiced,
    pendingAmount,
    overdueAmount,
    paidAmount,
  };
}
