import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, ensureSchema } from "@/lib/db";
import * as repo from "@/lib/repo";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureSchema();
  const rs = await db.execute("SELECT COUNT(*) as c FROM Event");
  const row = rs.rows[0] as unknown as { c: number };
  if (row.c > 0) {
    return NextResponse.json({ message: "já estava semeado, nada foi alterado" });
  }

  const tempPassword = "cafe2026!";
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  if ((await repo.countUsers()) === 0) {
    await repo.createUser({ name: "Vitória", email: "prod.vitoriaoliveira@gmail.com", passwordHash, role: "ADMIN" });
    await repo.createUser({ name: "Douglas", email: "douglas@coffeecar.local", passwordHash, role: "SOCIO" });
    await repo.createUser({ name: "Team", email: "team@coffeecar.local", passwordHash, role: "SOCIO" });
  }

  const insumos: Array<Parameters<typeof repo.createInsumo>[0]> = [
    { name: "Máquina", packageLabel: "—", packageQty: 1, packageUnit: "un", packagePrice: 0, notes: "Custo informado como R$0,00 na planilha oficial." },
    { name: "Carrinho", packageLabel: "3 diárias", packageQty: 3, packageUnit: "diária", packagePrice: 1800, notes: "3 x R$600,00 = R$1.800,00 (custo do carrinho no período)." },
    { name: "Guardanapo", packageLabel: "Pacote", packageQty: 500, packageUnit: "un", packagePrice: 445, notes: null },
    { name: "Copo", packageLabel: "Pacote", packageQty: 1000, packageUnit: "un", packagePrice: 900, notes: null },
    { name: "Água", packageLabel: "Item", packageQty: 1, packageUnit: "un", packagePrice: 25, notes: "Sem detalhamento de embalagem na planilha oficial." },
    { name: "Mexedor", packageLabel: "Pacote", packageQty: 100, packageUnit: "un", packagePrice: 40, notes: null },
    { name: "Açúcar (sachê)", packageLabel: "Caixa", packageQty: 400, packageUnit: "un", packagePrice: 29, notes: null },
    { name: "Adoçante (sachê)", packageLabel: "Caixa", packageQty: 50, packageUnit: "un", packagePrice: 8.58, notes: null },
    { name: "Doce de leite", packageLabel: "Pote (400g)", packageQty: 40, packageUnit: "porção de 10g", packagePrice: 12.79, notes: "Pote de 400g rende 40 porções de 10g." },
    { name: "Nutella", packageLabel: "Pote (140g)", packageQty: 14, packageUnit: "porção de 10g", packagePrice: 12.0, notes: "Pote de 140g rende 14 porções de 10g." },
    { name: "Pistache", packageLabel: "—", packageQty: 1, packageUnit: "porção de 10g", packagePrice: null, notes: "Custo não informado na planilha oficial." },
    { name: "Chantilly", packageLabel: "Rende 100 porções", packageQty: 100, packageUnit: "porção", packagePrice: 30.0, notes: null },
    { name: "Pó/Grão de café", packageLabel: "Pacote (1kg)", packageQty: 125, packageUnit: "café (8g)", packagePrice: null, notes: "1kg rende 125 cafés (8g por café) — usado quando não é cápsula." },
    { name: "Cápsula de café", packageLabel: "Pacote", packageQty: 10, packageUnit: "un", packagePrice: 24.0, notes: null },
    { name: "Leite zero lactose", packageLabel: "Embalagem", packageQty: 1000, packageUnit: "ml", packagePrice: 6.0, notes: "PREMISSA: tamanho da embalagem assumido em 1L; não consta na planilha oficial de custos atual." },
  ];
  for (const i of insumos) await repo.createInsumo(i);

  await repo.createStaffMember({ name: "Funcionário 1", role: "Operador de balcão", dailyRate: 200, phone: null, notes: null });
  await repo.createStaffMember({ name: "Funcionário 2", role: "Operador de balcão", dailyRate: 200, phone: null, notes: null });
  const staff = await repo.listStaffMembers();

  for (const name of ["Conta Santander", "Nomade", "Nubank", "Coffee", "Vit Nub"]) {
    await repo.createAccount({ name, notes: null });
  }

  const spiwId = await repo.createEvent({
    name: "SPIW 2026",
    location: null,
    startDate: null,
    endDate: null,
    status: "FECHADO",
    venueCommissionPct: null,
    notes:
      "Negócio dividido entre sócios/parceiros: Vitória, Douglas e Team (percentual de divisão não informado — cadastre em Divisão entre sócios). Repasse total do evento: 12% (Pacaembu) + 4% (ZigPay) = 16%. Preço real da cápsula nesta compra: R$1,949/un.",
  });
  await repo.addSaleItem({ eventId: spiwId, productName: "Venda Gourmet (Gold/Dulce Latte/Classic)", quantity: 65, unitPrice: 12.0 });
  await repo.addSaleItem({ eventId: spiwId, productName: "Venda Café Expresso Simples", quantity: 1202, unitPrice: 10.0 });
  await repo.addEventCost({ eventId: spiwId, category: "REPASSE", description: "Repasse Pacaembu (12% sobre venda)", amount: 1536.0, date: null });
  await repo.addEventCost({ eventId: spiwId, category: "REPASSE", description: "Repasse ZigPay (4% sobre venda)", amount: 512.0, date: null });
  await repo.addEventCost({ eventId: spiwId, category: "INSUMO", description: "Compra de cápsulas de café (custo real)", amount: 4677.6, date: null });
  await repo.addEventCost({ eventId: spiwId, category: "ALUGUEL", description: "Aluguel do 1º carrinho de café", amount: 2500.0, date: null });
  await repo.addEventCost({ eventId: spiwId, category: "OUTRO", description: "Compra do 2º carrinho de café (investimento)", amount: 3500.0, date: null });

  const adaptaId = await repo.createEvent({
    name: "Adapta Summit",
    location: null,
    startDate: "2026-07-29",
    endDate: "2026-08-01",
    status: "FECHADO",
    venueCommissionPct: 0.35,
    notes:
      "Fonte da receita: print de vendas enviado pela usuária. Fonte dos custos: planilha CONTA CORRENTE DE MOVIMENTAÇÕES (lançamentos com EVENTO = ADAPTA), também replicados na aba Financeiro.",
  });
  await repo.addSaleItem({ eventId: adaptaId, productName: "Café (Expresso Simples)", quantity: 2617, unitPrice: 10.0 });
  await repo.addSaleItem({ eventId: adaptaId, productName: "Café Dulce Latte", quantity: 17, unitPrice: 12.0 });
  await repo.addSaleItem({ eventId: adaptaId, productName: "Café Gold", quantity: 14, unitPrice: 12.0 });
  await repo.addEventCost({ eventId: adaptaId, category: "REPASSE", description: "Comissão Team (35% sobre venda)", amount: 9289.7, date: null });
  await repo.addEventCost({ eventId: adaptaId, category: "INSUMO", description: "Compra de insumo (repasse Conta Santander)", amount: 1377.82, date: "2026-07-31" });
  await repo.addEventCost({ eventId: adaptaId, category: "INSUMO", description: "Compra de insumo (repasse Nomade)", amount: 3232.54, date: "2026-07-31" });
  await repo.addEventCost({ eventId: adaptaId, category: "FRETE", description: "Frete montagem", amount: 117.0, date: "2026-07-29" });
  await repo.addEventCost({ eventId: adaptaId, category: "FRETE", description: "Frete desmontagem", amount: 117.0, date: "2026-08-01" });

  await repo.createLedgerEntry({ date: "2026-07-31", amount: 1377.82, reason: "Compra insumo", eventId: adaptaId, fromAccountId: null, toAccountLabel: "Conta Santander", whoReturns: "C6 - Coffee Car", notes: null });
  await repo.createLedgerEntry({ date: "2026-07-31", amount: 3232.54, reason: "Compra insumo", eventId: adaptaId, fromAccountId: null, toAccountLabel: "Nomade", whoReturns: "C6 - Coffee Car", notes: null });
  await repo.createLedgerEntry({ date: "2026-07-29", amount: 117.0, reason: "Frete montagem", eventId: adaptaId, fromAccountId: null, toAccountLabel: "Vit Nub", whoReturns: "C6 - Coffee Car", notes: null });
  await repo.createLedgerEntry({ date: "2026-08-01", amount: 117.0, reason: "Frete desmontagem", eventId: adaptaId, fromAccountId: null, toAccountLabel: "Vit Nub", whoReturns: "C6 - Coffee Car", notes: null });

  const nbaId = await repo.createEvent({
    name: "NBA",
    location: null,
    startDate: "2026-08-01",
    endDate: "2026-08-13",
    status: "FECHADO",
    venueCommissionPct: 0.35,
    notes:
      "Datas de trabalho (01 a 13/08) são uma estimativa — ajuste se souber as datas reais. Receita lançada como total único pois a discriminação por produto não foi informada. Repasse de 35% foi assumido como padrão (taxa real do evento não informada).",
  });
  await repo.addSaleItem({ eventId: nbaId, productName: "Venda de cafés (total, sem discriminação por produto)", quantity: 1, unitPrice: 2386.0 });
  await repo.addEventCost({ eventId: nbaId, category: "REPASSE", description: "Repasse ao dono do evento (35%, taxa padrão assumida)", amount: 835.1, date: null });

  const [f1, f2] = staff;
  const start = new Date("2026-08-01T00:00:00Z");
  for (let d = 0; d < 13; d++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + d);
    const iso = day.toISOString().slice(0, 10);
    await repo.addStaffShift({ eventId: nbaId, staffMemberId: f1.id, date: iso, dailyRate: 200 });
    await repo.addStaffShift({ eventId: nbaId, staffMemberId: f2.id, date: iso, dailyRate: 200 });
  }

  return NextResponse.json({ message: "seed concluído: 3 eventos, insumos, staff, contas e movimentações criados." });
}
