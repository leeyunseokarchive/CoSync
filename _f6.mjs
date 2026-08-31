import { chromium, devices } from "playwright";
const b = await chromium.launch();
for (const dev of ["iPhone SE","iPhone 13","iPad Mini","iPad Pro 11"]) {
  const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage();
  const vw = p.viewportSize().width; let bad=0, tot=0;
  for (let q=0;q<15;q++){
    await p.goto("http://localhost:3000/mockup/contract-results",{waitUntil:"domcontentloaded"});
    for(let i=0;i<q;i++){ await p.getByRole("button",{name:/다음/}).first().click(); await p.waitForTimeout(60); }
    const terms=p.locator(".cq-term");
    for(let i=0;i<await terms.count();i++){
      const t=terms.nth(i);
      if(!(await t.isVisible().catch(()=>false))) continue;
      await t.tap().catch(()=>{}); await p.waitForTimeout(60);
      const box=await t.locator(".cq-term-pop").boundingBox().catch(()=>null);
      if(!box) continue; tot++;
      if(box.x<-1||box.x+box.width>vw+1){bad++;console.log(`  ❌ ${dev} q${q} ${Math.round(box.x)}~${Math.round(box.x+box.width)}`);}
    }
  }
  console.log(`${dev} (${vw}px) 툴팁 ${tot}개 · 밖 ${bad}개`);
  await ctx.close();
}
await b.close();
