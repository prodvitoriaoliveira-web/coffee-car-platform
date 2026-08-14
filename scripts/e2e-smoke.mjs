import { chromium } from "playwright";

const BASE = "http://localhost:3100";

const results = [];
function ok(name, cond, extra = "") {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage();

// 1. Login
await page.goto(`${BASE}/login`);
await page.fill('input[name="email"]', "prod.vitoriaoliveira@gmail.com");
await page.fill('input[name="password"]', "cafe2026!");
await Promise.all([page.waitForURL(`${BASE}/dashboard`), page.click('button[type="submit"]')]);
ok("Login redireciona para /dashboard", page.url() === `${BASE}/dashboard`);

// 2. Dashboard shows events
const dashboardText = await page.textContent("body");
ok("Dashboard mostra SPIW 2026", dashboardText.includes("SPIW 2026"));
ok("Dashboard mostra Adapta Summit", dashboardText.includes("Adapta Summit"));
ok("Dashboard mostra NBA", dashboardText.includes("NBA"));

// 3. Navigate to Adapta Summit detail and check totals
await page.click('text=Adapta Summit');
await page.waitForTimeout(1200);
const adaptaText = await page.textContent("body");
ok("Adapta detail mostra Receita R$26.542,00 (ou próximo)", /26\.542,00/.test(adaptaText));
ok("Adapta detail mostra Resultado positivo", /12\.407,94/.test(adaptaText));

// 4. Add a sale item to Adapta and confirm it appears + totals update
const beforeCount = (await page.$$('table >> text=Café')).length;
await page.fill('input[name="productName"]', "Teste E2E Produto");
await page.fill('input[name="quantity"]', "3");
await page.fill('input[name="unitPrice"]', "10");
await page.getByRole("button", { name: "+ Adicionar venda" }).click();
await page.waitForTimeout(1200);
const afterAddText = await page.textContent("body");
ok("Novo item de venda aparece na tabela", afterAddText.includes("Teste E2E Produto"));
ok("Receita atualizada (26.572,00) após adicionar venda de R$30", /26\.572,00/.test(afterAddText));

// 5. Remove the test sale item (cleanup) via its remove button
const row = page.locator("tr", { hasText: "Teste E2E Produto" });
await row.getByRole("button", { name: "remover" }).click();
await page.waitForTimeout(1200);
const afterRemoveText = await page.textContent("body");
ok("Item de teste removido", !afterRemoveText.includes("Teste E2E Produto"));
ok("Receita voltou a 26.542,00 após remover", /26\.542,00/.test(afterRemoveText));

// 6. Insumos page loads with seeded data
await page.goto(`${BASE}/insumos`);
await page.waitForTimeout(1200);
const insumosText = await page.textContent("body");
ok("Insumos mostra Cápsula de café", insumosText.includes("Cápsula de café"));
ok("Insumos mostra custo unitário R$2,40", /R\$\s?2,40/.test(insumosText));

// 7. Staff page + create a new staff member
await page.goto(`${BASE}/staff`);
await page.waitForTimeout(1200);
await page.fill('input[name="name"]', "Funcionário Teste E2E");
await page.fill('input[name="dailyRate"]', "150");
await page.getByRole("button", { name: "+ Adicionar funcionário" }).click();
await page.waitForTimeout(1200);
const staffText = await page.textContent("body");
ok("Novo funcionário aparece na lista", staffText.includes("Funcionário Teste E2E"));

// 8. Contas a pagar: create one
await page.goto(`${BASE}/contas-a-pagar`);
await page.waitForTimeout(1200);
await page.fill('input[name="description"]', "Conta teste e2e");
await page.fill('input[name="amount"]', "99.90");
await page.getByRole("button", { name: "+ Adicionar" }).click();
await page.waitForTimeout(1200);
const payablesText = await page.textContent("body");
ok("Conta a pagar de teste aparece", payablesText.includes("Conta teste e2e"));
ok("Pendente atualizado para incluir R$99,90", /99,90/.test(payablesText));

// 9. Logout works
await page.goto(`${BASE}/dashboard`);
await page.getByRole("button", { name: "Sair" }).click();
await page.waitForURL(`${BASE}/login`);
ok("Logout redireciona para /login", page.url() === `${BASE}/login`);

// 10. Protected route blocked after logout
await page.goto(`${BASE}/dashboard`);
await page.waitForTimeout(1200);
ok("Após logout, /dashboard redireciona para login", page.url().startsWith(`${BASE}/login`));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) {
  console.log("FALHAS:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
