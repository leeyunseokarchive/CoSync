import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1400,height:1200}});
const errs=[]; p.on("console",m=>m.type()==="error"&&errs.push(m.text()));
for (const [needle,name] of [["단독 지출 결정","bc-spend"],["법인 계좌와 카드","bc-card"],["각자 보수를","bc-salary"]]) {
  await p.goto("http://localhost:3000/mockup/basic-consensus",{waitUntil:"domcontentloaded"});
  let ok=false;
  for(let i=0;i<25;i++){const t=await p.locator("h1,h2,.cq-title").first().innerText().catch(()=>"");
   if(t.includes(needle)){ok=true;break;}
   const nx=p.getByRole("button",{name:/다음/}).first();
   if(!(await nx.count())) break;
   await nx.click().catch(()=>{}); await p.waitForTimeout(120);}
  if(!ok){console.log("못 찾음:",needle);continue;}
  console.log("\n["+(await p.locator("h1,h2,.cq-title").first().innerText())+"]");
  console.log("  선택지:", await p.locator(".cq-choice-label").allInnerTexts());
  console.log("  짚고 갈 것:", await p.getByText("짚고 갈 것").count(), "| 팁:", await p.locator(".bc-tip-btn").count());
  await p.locator(".cq-input-zone").screenshot({path:`${process.argv[2]}/${name}.png`});
}
console.log("\nerrors:",errs); await b.close();
