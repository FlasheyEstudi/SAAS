const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getTrialBalance } = require('./src/services/financial-reports.service.ts'); // Can't require TS directly like this.
