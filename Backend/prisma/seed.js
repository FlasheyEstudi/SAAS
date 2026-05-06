"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var db = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var company, cid, accCaja, accCXC, accActFijo, accCXP, accVentas, accGastos, accNominas, cc, bank, term, tps, i, _a, _b, _c, _d, years, invNum, jeNum, _i, years_1, y, m, p, i, isSale, tp, amount, date, inv, hashed, u1, u2, pendingPeriod, i, iva, retencion, e_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 80, 81, 83]);
                    console.log('Iniciando poblado masivo de datos (2025 - 2026)...');
                    return [4 /*yield*/, db.fileAttachment.deleteMany()];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, db.notification.deleteMany()];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, db.budget.deleteMany()];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, db.depreciationEntry.deleteMany()];
                case 4:
                    _e.sent();
                    return [4 /*yield*/, db.fixedAsset.deleteMany()];
                case 5:
                    _e.sent();
                    return [4 /*yield*/, db.exchangeRate.deleteMany()];
                case 6:
                    _e.sent();
                    return [4 /*yield*/, db.auditLog.deleteMany()];
                case 7:
                    _e.sent();
                    return [4 /*yield*/, db.userCompany.deleteMany()];
                case 8:
                    _e.sent();
                    return [4 /*yield*/, db.user.deleteMany()];
                case 9:
                    _e.sent();
                    return [4 /*yield*/, db.bankMovement.deleteMany()];
                case 10:
                    _e.sent();
                    return [4 /*yield*/, db.taxEntry.deleteMany()];
                case 11:
                    _e.sent();
                    return [4 /*yield*/, db.paymentSchedule.deleteMany()];
                case 12:
                    _e.sent();
                    return [4 /*yield*/, db.invoiceLine.deleteMany()];
                case 13:
                    _e.sent();
                    return [4 /*yield*/, db.invoice.deleteMany()];
                case 14:
                    _e.sent();
                    return [4 /*yield*/, db.journalEntryLine.deleteMany()];
                case 15:
                    _e.sent();
                    return [4 /*yield*/, db.journalEntry.deleteMany()];
                case 16:
                    _e.sent();
                    return [4 /*yield*/, db.bankAccount.deleteMany()];
                case 17:
                    _e.sent();
                    return [4 /*yield*/, db.paymentTerm.deleteMany()];
                case 18:
                    _e.sent();
                    return [4 /*yield*/, db.taxRate.deleteMany()];
                case 19:
                    _e.sent();
                    return [4 /*yield*/, db.thirdParty.deleteMany()];
                case 20:
                    _e.sent();
                    return [4 /*yield*/, db.financialConcept.deleteMany()];
                case 21:
                    _e.sent();
                    return [4 /*yield*/, db.costCenter.deleteMany()];
                case 22:
                    _e.sent();
                    return [4 /*yield*/, db.account.deleteMany()];
                case 23:
                    _e.sent();
                    return [4 /*yield*/, db.accountingPeriod.deleteMany()];
                case 24:
                    _e.sent();
                    return [4 /*yield*/, db.company.deleteMany()];
                case 25:
                    _e.sent();
                    return [4 /*yield*/, db.company.create({
                            data: { name: 'Ganesha Corporation S.A.', taxId: 'J0310000000123', currency: 'NIO', address: 'Managua' },
                        })];
                case 26:
                    company = _e.sent();
                    cid = company.id;
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '1.1', name: 'Bancos', accountType: 'ASSET', nature: 'DEBITOR' } })];
                case 27:
                    accCaja = _e.sent();
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '1.2', name: 'Cuentas por Cobrar', accountType: 'ASSET', nature: 'DEBITOR' } })];
                case 28:
                    accCXC = _e.sent();
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '1.3', name: 'Activos Fijos', accountType: 'ASSET', nature: 'DEBITOR' } })];
                case 29:
                    accActFijo = _e.sent();
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '2.1', name: 'Proveedores', accountType: 'LIABILITY', nature: 'ACREEDOR' } })];
                case 30:
                    accCXP = _e.sent();
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '4.1', name: 'Ingresos por Ventas', accountType: 'INCOME', nature: 'ACREEDOR' } })];
                case 31:
                    accVentas = _e.sent();
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '5.1', name: 'Gastos Operativos', accountType: 'EXPENSE', nature: 'DEBITOR' } })];
                case 32:
                    accGastos = _e.sent();
                    return [4 /*yield*/, db.account.create({ data: { companyId: cid, code: '5.2', name: 'Sueldos y Salarios', accountType: 'EXPENSE', nature: 'DEBITOR' } })];
                case 33:
                    accNominas = _e.sent();
                    return [4 /*yield*/, db.costCenter.create({ data: { companyId: cid, code: 'OP', name: 'Operaciones', level: 1 } })];
                case 34:
                    cc = _e.sent();
                    return [4 /*yield*/, db.bankAccount.create({
                            data: { companyId: cid, bankName: 'Banco Nacional', accountNumber: '123456789', accountType: 'CHECKING', initialBalance: 5000000, currentBalance: 5000000 }
                        })];
                case 35:
                    bank = _e.sent();
                    return [4 /*yield*/, db.paymentTerm.create({ data: { companyId: cid, code: 'N30', name: 'Neto 30', days: 30 } })];
                case 36:
                    term = _e.sent();
                    tps = [];
                    i = 1;
                    _e.label = 37;
                case 37:
                    if (!(i <= 15)) return [3 /*break*/, 41];
                    _b = (_a = tps).push;
                    return [4 /*yield*/, db.thirdParty.create({ data: { companyId: cid, name: "Cliente Plus ".concat(i), type: 'CUSTOMER' } })];
                case 38:
                    _b.apply(_a, [_e.sent()]);
                    _d = (_c = tps).push;
                    return [4 /*yield*/, db.thirdParty.create({ data: { companyId: cid, name: "Proveedor Industrial ".concat(i), type: 'SUPPLIER' } })];
                case 39:
                    _d.apply(_c, [_e.sent()]);
                    _e.label = 40;
                case 40:
                    i++;
                    return [3 /*break*/, 37];
                case 41:
                    years = [2025, 2026];
                    invNum = 1;
                    jeNum = 1;
                    _i = 0, years_1 = years;
                    _e.label = 42;
                case 42:
                    if (!(_i < years_1.length)) return [3 /*break*/, 56];
                    y = years_1[_i];
                    m = 1;
                    _e.label = 43;
                case 43:
                    if (!(m <= 12)) return [3 /*break*/, 55];
                    if (y === 2026 && m > 6)
                        return [3 /*break*/, 54];
                    return [4 /*yield*/, db.accountingPeriod.create({
                            data: { companyId: cid, year: y, month: m, status: y === 2025 ? 'CLOSED' : 'OPEN' }
                        })];
                case 44:
                    p = _e.sent();
                    i = 0;
                    _e.label = 45;
                case 45:
                    if (!(i < 15)) return [3 /*break*/, 51];
                    isSale = Math.random() > 0.4;
                    tp = tps[Math.floor(Math.random() * tps.length)];
                    amount = Math.floor(Math.random() * 80000) + 10000;
                    date = new Date(y, m - 1, Math.floor(Math.random() * 28) + 1);
                    return [4 /*yield*/, db.invoice.create({
                            data: {
                                companyId: cid, thirdPartyId: tp.id, paymentTermId: term.id,
                                invoiceType: isSale ? 'SALE' : 'PURCHASE', number: "F-".concat(y, "-").concat(m, "-").concat(invNum++),
                                issueDate: date, dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                                totalAmount: amount, balanceDue: amount * (Math.random() > 0.5 ? 0 : 1),
                                subtotal: amount, status: Math.random() > 0.5 ? 'PAID' : 'PENDING'
                            }
                        })];
                case 46:
                    inv = _e.sent();
                    return [4 /*yield*/, db.invoiceLine.create({
                            data: {
                                invoiceId: inv.id, lineNumber: 1, description: 'Servicios/Productos varios',
                                quantity: 1, unitPrice: amount, subtotal: amount,
                                accountId: isSale ? accVentas.id : accGastos.id, costCenterId: cc.id
                            }
                        })];
                case 47:
                    _e.sent();
                    return [4 /*yield*/, db.journalEntry.create({
                            data: {
                                companyId: cid, periodId: p.id, entryNumber: "JE-".concat(y, "-").concat(m, "-").concat(jeNum++),
                                description: "Poliza de Factura ".concat(inv.number), entryDate: date,
                                entryType: 'DIARIO', status: 'POSTED', totalDebit: amount, totalCredit: amount,
                                lines: {
                                    create: [
                                        { accountId: isSale ? accCXC.id : accGastos.id, debit: amount, credit: 0, description: 'Cargo' },
                                        { accountId: isSale ? accVentas.id : accCXP.id, debit: 0, credit: amount, description: 'Abono' }
                                    ]
                                }
                            }
                        })];
                case 48:
                    _e.sent();
                    if (!(inv.status === 'PAID')) return [3 /*break*/, 50];
                    return [4 /*yield*/, db.bankMovement.create({
                            data: { bankAccountId: bank.id, movementDate: date, description: "Pago Fac ".concat(inv.number), amount: amount, movementType: isSale ? 'CREDIT' : 'DEBIT', status: 'RECONCILED' }
                        })];
                case 49:
                    _e.sent();
                    _e.label = 50;
                case 50:
                    i++;
                    return [3 /*break*/, 45];
                case 51: return [4 /*yield*/, db.journalEntry.create({
                        data: {
                            companyId: cid, periodId: p.id, entryNumber: "JE-".concat(y, "-").concat(m, "-").concat(jeNum++),
                            description: "Nomina del mes ".concat(m), entryDate: new Date(y, m - 1, 28),
                            entryType: 'EGRESO', status: 'POSTED', totalDebit: 250000, totalCredit: 250000,
                            lines: {
                                create: [
                                    { accountId: accNominas.id, debit: 250000, credit: 0, description: 'Pago salarios' },
                                    { accountId: accCaja.id, debit: 0, credit: 250000, description: 'Salida de banco' }
                                ]
                            }
                        }
                    })];
                case 52:
                    _e.sent();
                    return [4 /*yield*/, db.bankMovement.create({
                            data: { bankAccountId: bank.id, movementDate: new Date(y, m - 1, 28), description: "Pago Nomina Mes ".concat(m), amount: 250000, movementType: 'DEBIT', status: 'RECONCILED' }
                        })];
                case 53:
                    _e.sent();
                    _e.label = 54;
                case 54:
                    m++;
                    return [3 /*break*/, 43];
                case 55:
                    _i++;
                    return [3 /*break*/, 42];
                case 56: return [4 /*yield*/, bcryptjs_1.default.hash('Admin123!', 10)];
                case 57:
                    hashed = _e.sent();
                    return [4 /*yield*/, db.user.create({ data: { companyId: cid, email: 'admin@ganesha.com', name: 'Administrador Supremo', role: 'ADMIN', passwordHash: hashed } })];
                case 58:
                    u1 = _e.sent();
                    return [4 /*yield*/, db.user.create({ data: { companyId: cid, email: 'admin@alpha.com.ni', name: 'Admin Alpha', role: 'ADMIN', passwordHash: hashed } })];
                case 59:
                    u2 = _e.sent();
                    return [4 /*yield*/, db.userCompany.create({ data: { userId: u1.id, companyId: cid, role: 'OWNER' } })];
                case 60:
                    _e.sent();
                    return [4 /*yield*/, db.userCompany.create({ data: { userId: u2.id, companyId: cid, role: 'OWNER' } })];
                case 61:
                    _e.sent();
                    // Additional Models
                    console.log('Sembrando modulos adicionales (Pendientes, Activos, Presupuestos, etc)...');
                    return [4 /*yield*/, db.accountingPeriod.findFirst({ where: { companyId: cid } })];
                case 62:
                    pendingPeriod = _e.sent();
                    i = 1;
                    _e.label = 63;
                case 63:
                    if (!(i <= 5)) return [3 /*break*/, 66];
                    return [4 /*yield*/, db.journalEntry.create({
                            data: {
                                companyId: cid, periodId: pendingPeriod.id, entryNumber: "JE-PEND-".concat(i),
                                description: "P\u00F3liza Borrador ".concat(i), entryDate: new Date(),
                                entryType: 'DIARIO', status: 'DRAFT', totalDebit: 1000 * i, totalCredit: 1000 * i,
                                lines: {
                                    create: [
                                        { accountId: accGastos.id, debit: 1000 * i, credit: 0, description: 'Cargo borrador' },
                                        { accountId: accCaja.id, debit: 0, credit: 1000 * i, description: 'Abono borrador' }
                                    ]
                                }
                            }
                        })];
                case 64:
                    _e.sent();
                    _e.label = 65;
                case 65:
                    i++;
                    return [3 /*break*/, 63];
                case 66: return [4 /*yield*/, db.taxRate.create({
                        data: { companyId: cid, name: 'IVA 15%', rate: 0.15, taxType: 'IVA', effectiveFrom: new Date('2025-01-01') }
                    })];
                case 67:
                    iva = _e.sent();
                    return [4 /*yield*/, db.taxRate.create({
                            data: { companyId: cid, name: 'Retención IR 2%', rate: 0.02, taxType: 'IR', isRetention: true, effectiveFrom: new Date('2025-01-01') }
                        })];
                case 68:
                    retencion = _e.sent();
                    // 3. Financial Concepts
                    return [4 /*yield*/, db.financialConcept.create({
                            data: { companyId: cid, code: 'C-001', name: 'Servicios de Consultoría', category: 'INGRESOS', defaultAccountId: accVentas.id }
                        })];
                case 69:
                    // 3. Financial Concepts
                    _e.sent();
                    return [4 /*yield*/, db.financialConcept.create({
                            data: { companyId: cid, code: 'C-002', name: 'Papelería y Útiles', category: 'GASTOS', defaultAccountId: accGastos.id }
                        })];
                case 70:
                    _e.sent();
                    // 4. Fixed Assets
                    return [4 /*yield*/, db.fixedAsset.create({
                            data: {
                                companyId: cid, code: 'EQ-01', name: 'Servidor Principal', assetType: 'MACHINERY',
                                purchaseDate: new Date('2025-01-10'), purchaseAmount: 50000, usefulLifeMonths: 60,
                                currentBookValue: 50000, accountId: accActFijo.id
                            }
                        })];
                case 71:
                    // 4. Fixed Assets
                    _e.sent();
                    return [4 /*yield*/, db.fixedAsset.create({
                            data: {
                                companyId: cid, code: 'VH-01', name: 'Camioneta de Reparto', assetType: 'VEHICLE',
                                purchaseDate: new Date('2025-02-15'), purchaseAmount: 120000, usefulLifeMonths: 60,
                                currentBookValue: 120000, accountId: accActFijo.id
                            }
                        })];
                case 72:
                    _e.sent();
                    // 5. Budgets
                    return [4 /*yield*/, db.budget.create({
                            data: {
                                companyId: cid, year: 2026, month: 5, accountId: accGastos.id,
                                budgetedAmount: 50000, description: 'Presupuesto Operativo Mayo 2026'
                            }
                        })];
                case 73:
                    // 5. Budgets
                    _e.sent();
                    return [4 /*yield*/, db.budget.create({
                            data: {
                                companyId: cid, year: 2026, month: 6, accountId: accNominas.id,
                                budgetedAmount: 300000, description: 'Presupuesto Nómina Junio 2026'
                            }
                        })];
                case 74:
                    _e.sent();
                    // 6. Exchange Rates
                    return [4 /*yield*/, db.exchangeRate.create({
                            data: { companyId: cid, fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.62, date: new Date() }
                        })];
                case 75:
                    // 6. Exchange Rates
                    _e.sent();
                    return [4 /*yield*/, db.exchangeRate.create({
                            data: { companyId: cid, fromCurrency: 'EUR', toCurrency: 'NIO', rate: 40.15, date: new Date() }
                        })];
                case 76:
                    _e.sent();
                    // 7. Notifications
                    return [4 /*yield*/, db.notification.create({
                            data: {
                                companyId: cid, userId: u1.id, type: 'SYSTEM', title: 'Bienvenido a Ganesha ERP',
                                message: 'El sistema está operando de manera óptima.', priority: 'HIGH'
                            }
                        })];
                case 77:
                    // 7. Notifications
                    _e.sent();
                    return [4 /*yield*/, db.notification.create({
                            data: {
                                companyId: cid, userId: u1.id, type: 'ALERT', title: 'Pólizas Pendientes',
                                message: 'Tienes 5 pólizas en borrador que requieren revisión.', priority: 'NORMAL'
                            }
                        })];
                case 78:
                    _e.sent();
                    // 8. Audit Logs
                    return [4 /*yield*/, db.auditLog.create({
                            data: {
                                companyId: cid, userId: u1.id, action: 'LOGIN', entityType: 'User', entityId: u1.id,
                                entityLabel: 'Administrador Supremo', ipAddress: '192.168.1.1'
                            }
                        })];
                case 79:
                    // 8. Audit Logs
                    _e.sent();
                    console.log('✅ SEED MASIVO COMPLETADO EXITOSAMENTE');
                    return [3 /*break*/, 83];
                case 80:
                    e_1 = _e.sent();
                    console.error('Seed ERROR:', e_1);
                    process.exit(1);
                    return [3 /*break*/, 83];
                case 81: return [4 /*yield*/, db.$disconnect()];
                case 82:
                    _e.sent();
                    return [7 /*endfinally*/];
                case 83: return [2 /*return*/];
            }
        });
    });
}
main();
