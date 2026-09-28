import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './passwords';
const db = new PrismaClient();
async function main() {
  const [email, name, staffId, role = 'VERIFICATION_ANALYST'] = process.argv.slice(2);
  const password = process.env.STAFF_INITIAL_PASSWORD;
  if (!email || !name || !staffId || !password) throw new Error('Set STAFF_INITIAL_PASSWORD and run provisionStaff.ts email name staffId [role].');
  if (!['INTAKE_OFFICER','VERIFICATION_ANALYST','SENIOR_ADJUDICATOR','AUDITOR','ADMINISTRATOR'].includes(role)) throw new Error('Invalid role');
  await db.staffAccount.create({ data: { email: email.trim().toLowerCase(), name, staffId, role, passwordHash: hashPassword(password) } });
  console.log('Staff account created. Password was not logged.');
}
main().catch(() => { console.error('Account could not be created. Check inputs, password length (12+) and database availability.'); process.exitCode = 1; }).finally(() => db.$disconnect());
