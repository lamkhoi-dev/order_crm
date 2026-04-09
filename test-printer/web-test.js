/**
 * web-test.js — Printer Test Web UI
 * Chạy: node web-test.js
 * Mở:   http://localhost:3333
 */
import express from 'express';
import { EscPos, printRaw, listPrinters } from './printer-core.js';

const PORT = 3333;
const app = express();
app.use(express.json());

// ────────────────────────────────────────
// API
// ────────────────────────────────────────

app.get('/api/printers', (_req, res) => {
  try {
    const raw = listPrinters();
    const printers = raw.map(p => ({
      name: p.Name || p.name || '',
      status: p.PrinterStatus === 0 ? 'ready' : 'warn',
      statusText: p.PrinterStatus === 0 ? 'San sang' : 'Loi ' + p.PrinterStatus,
    }));
    res.json({ printers });
  } catch (err) {
    res.json({ printers: [], error: err.message });
  }
});

app.post('/api/print-test', (req, res) => {
  const { printerName } = req.body;
  if (!printerName) return res.json({ success: false, error: 'Missing printerName' });
  try {
    const time = new Date().toLocaleString('vi-VN');
    const esc = new EscPos();
    esc.init()
      .alignCenter().bold(true).size(1, 1).println('=== TEST IN ===').bold(false).size(0, 0).newLine()
      .alignLeft().bold(true).println('May in:').bold(false)
      .size(1, 0).alignCenter().println(printerName).size(0, 0).alignLeft().newLine()
      .println('Thoi gian: ' + time).line()
      .alignCenter().println('--- Kich co chu ---')
      .size(0, 0).println('Nho (Normal)')
      .size(1, 0).println('Rong (Wide)')
      .size(0, 1).println('Cao (Tall)')
      .size(1, 1).println('To (Big)').size(0, 0).line()
      .alignLeft().println('Canh trai')
      .alignCenter().println('Canh giua')
      .alignRight().println('Canh phai').alignLeft()
      .bold(true).println('In dam (Bold)').bold(false).line()
      .alignCenter().bold(true).size(0, 1).println('May in nay OK!').size(0, 0).bold(false)
      .newLine(3).cut();
    const ok = printRaw(printerName, esc.build());
    res.json(ok);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/print-kitchen', (req, res) => {
  const { printerName, table, items, note } = req.body;
  if (!printerName) return res.json({ success: false, error: 'Missing printerName' });
  try {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const id = 'T' + Date.now().toString().slice(-4);
    const list = (items || []).filter(i => i.name);
    const esc = new EscPos();
    esc.init()
      .alignCenter().bold(true).size(1, 1).println('PHIEU BEP').bold(false).size(0, 0).newLine()
      .alignLeft().println('Don: #' + id)
      .bold(true).size(1, 0).println('Ban: ' + (table || 'Ban ?')).size(0, 0).bold(false)
      .println('Gio: ' + time).line();
    for (const item of list) {
      esc.bold(true).size(0, 1).println(item.name).size(0, 0).bold(false)
        .println('  SL: ' + (item.qty || 1));
    }
    if (note) esc.line().bold(true).println('Ghi chu: ' + note).bold(false);
    esc.line().alignCenter().println('--- HET ---').newLine(3).cut();
    const ok = printRaw(printerName, esc.build());
    res.json(ok);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/print-receipt', (req, res) => {
  const { printerName, table, items, paymentMethod } = req.body;
  if (!printerName) return res.json({ success: false, error: 'Missing printerName' });
  try {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const id = 'HD-' + Date.now().toString().slice(-4);
    const list = (items || []).filter(i => i.name);
    const total = list.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const fmt = n => new Intl.NumberFormat('vi-VN').format(n) + 'd';
    const esc = new EscPos();
    esc.init()
      .alignCenter().bold(true).size(1, 1).println('HA NOI XUA').size(0, 0).bold(false)
      .println('Bun rieu - Bun dau')
      .println('220 Nguyen Hoang, An Phu, Thu Duc')
      .println('Tel: 0901 681 567').line()
      .alignLeft().println('Don: #' + id + '    ' + time)
      .println('Ban: ' + (table || 'Ban ?')).line()
      .bold(true).tableRow([{ text: 'Mon', width: .5, align: 'left' }, { text: 'SL', width: .1, align: 'center' }, { text: 'T.Tien', width: .4, align: 'right' }])
      .bold(false).line();
    for (const item of list) {
      esc.tableRow([
        { text: item.name, width: .5, align: 'left' },
        { text: String(item.qty || 1), width: .1, align: 'center' },
        { text: fmt((item.price || 0) * (item.qty || 1)), width: .4, align: 'right' },
      ]);
    }
    esc.line().bold(true).size(0, 1)
      .tableRow([{ text: 'TONG CONG:', width: .5, align: 'left' }, { text: fmt(total), width: .5, align: 'right' }])
      .size(0, 0).bold(false)
      .println('TT: ' + (paymentMethod === 'transfer' ? 'Chuyen khoan' : 'Tien mat')).line()
      .alignCenter().println('Cam on quy khach!').println('Hen gap lai :)').newLine(3).cut();
    const ok = printRaw(printerName, esc.build());
    res.json(ok);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ────────────────────────────────────────
// HTML (dùng string concat, không dùng template literal để tránh conflict)
// ────────────────────────────────────────

function buildHtml() {
  return [
    '<!DOCTYPE html>',
    '<html lang="vi">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Printer Test Tool</title>',
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f0ebe5;color:#1a1412;min-height:100vh}',
    '.hdr{background:#1a1412;color:#fff;padding:16px 24px;display:flex;align-items:center;gap:12px}',
    '.hdr h1{font-size:18px;font-weight:700}.hdr p{font-size:13px;color:#a0998f}',
    '.wrap{padding:20px;max-width:760px;margin:0 auto}',
    '.card{background:#fff;border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,.07)}',
    '.ct{font-size:13px;font-weight:700;color:#5a4e46;text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;display:flex;align-items:center;gap:6px}',
    '.printers{display:grid;gap:10px}',
    '.pc{border:2px solid #e3ddd6;border-radius:10px;padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:.15s;user-select:none}',
    '.pc:hover{border-color:#c24b30;background:#fdf9f8}',
    '.pc.sel{border-color:#c24b30;background:#fde8e2}',
    '.pi{font-size:22px;flex-shrink:0}.pn{font-weight:700;font-size:15px;margin-bottom:2px}',
    '.ps{font-size:12px;padding:2px 8px;border-radius:20px;display:inline-block}',
    '.sr{background:#d6ede4;color:#1e6b4f}.sw{background:#fce0e3;color:#c4303e}',
    '.ck{width:22px;height:22px;border-radius:50%;border:2px solid #d4cbc2;display:flex;align-items:center;justify-content:center;font-size:12px;transition:.15s;flex-shrink:0}',
    '.pc.sel .ck{background:#c24b30;border-color:#c24b30;color:#fff}',
    '.np{text-align:center;padding:24px;color:#7a6e66;font-size:14px}',
    '.acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}',
    '.btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:13px 16px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:.15s;width:100%}',
    '.btn:active{transform:scale(.96)}.btn:disabled{opacity:.4;cursor:not-allowed}',
    '.bt{background:#c24b30;color:#fff}.bk{background:#1e6b4f;color:#fff}',
    '.br{background:#2e72ad;color:#fff}.bf{background:#e3ddd6;color:#1a1412}',
    'label{display:block;font-size:11px;font-weight:700;color:#5a4e46;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}',
    'input,select,textarea{width:100%;padding:9px 12px;border:2px solid #d4cbc2;border-radius:8px;font-size:13px;margin-bottom:10px;font-family:inherit;background:#fff;color:#1a1412}',
    'input:focus,select:focus,textarea:focus{border-color:#c24b30;outline:none}',
    'textarea{resize:vertical;min-height:80px}',
    '.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.badge{background:#fde8e2;border:1px solid #f0c4b8;border-radius:8px;padding:8px 12px;font-size:13px;color:#c24b30;font-weight:600;margin-bottom:14px;display:none;align-items:center;gap:6px}',
    '.badge.show{display:flex}',
    '.log{background:#1a1412;color:#a0f0a0;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;max-height:160px;overflow-y:auto;white-space:pre-wrap;line-height:1.6}',
    '.le{color:#ff8080}.lo{color:#a0f0a0}.li{color:#ffd080}',
    '@media(max-width:500px){.acts{grid-template-columns:1fr}.g2{grid-template-columns:1fr}}',
    '</style></head><body>',

    '<div class="hdr"><span style="font-size:26px">&#128424;&#65039;</span><div>',
    '<h1>Printer Test Tool</h1><p>Ha Noi Xua &mdash; Chon may in de test</p>',
    '</div></div>',

    '<div class="wrap">',

    // Printer list card
    '<div class="card">',
    '<div class="ct">&#128424; May in kha dung',
    '<button class="btn bf" style="width:auto;padding:5px 12px;font-size:12px;margin-left:auto;border-radius:8px" onclick="load()">&#8635; Tai lai</button>',
    '</div>',
    '<div id="printers" class="printers"><div class="np">Dang tai...</div></div>',
    '</div>',

    // Badge + actions
    '<div class="badge" id="badge">&#128424;&#65039; <span id="badge-name">Chua chon</span></div>',
    '<div class="card"><div class="ct">&#9889; Thao tac nhanh</div>',
    '<div class="acts">',
    '<button class="btn bt" id="btn-test" onclick="pTest()" disabled>&#129514; In test (to thong tin)</button>',
    '<button class="btn bk" id="btn-kit" onclick="show(\'kit\')" disabled>&#128203; In phieu bep mau</button>',
    '</div>',
    '<div class="acts">',
    '<button class="btn br" id="btn-rec" onclick="show(\'rec\')" disabled>&#129534; In hoa don mau</button>',
    '<div></div></div></div>',

    // Kitchen form
    '<div class="card" id="sec-kit" style="display:none">',
    '<div class="ct">&#128203; Phieu bep mau</div>',
    '<div class="g2">',
    '<div><label>Ban</label><input id="k-tbl" value="Ban 1"></div>',
    '<div><label>Ghi chu</label><input id="k-note" value="It cay, khong hanh"></div>',
    '</div>',
    '<label>Mon an (moi dong: ten,so luong)</label>',
    '<textarea id="k-items">To Dac Biet,2\nTo Day Du,1\nTra da,3</textarea>',
    '<button class="btn bk" onclick="pKitchen()">&#128424; In phieu bep</button>',
    '</div>',

    // Receipt form
    '<div class="card" id="sec-rec" style="display:none">',
    '<div class="ct">&#129534; Hoa don mau</div>',
    '<div class="g2">',
    '<div><label>Ban</label><input id="r-tbl" value="Ban 1"></div>',
    '<div><label>Thanh toan</label><select id="r-pay"><option value="cash">Tien mat</option><option value="transfer">Chuyen khoan</option></select></div>',
    '</div>',
    '<label>Mon an (ten,so luong,don gia)</label>',
    '<textarea id="r-items">To Dac Biet,2,68000\nTo Day Du,1,59000\nTra da,3,10000</textarea>',
    '<button class="btn br" onclick="pReceipt()">&#128424; In hoa don</button>',
    '</div>',

    // Log
    '<div class="card"><div class="ct">&#128220; Log</div>',
    '<div id="log" class="log">San sang. Chon may in de bat dau...\n</div></div>',
    '</div>',

    // Script
    '<script>',
    'var sel = null;',
    'function lg(m,t){',
    '  var el=document.getElementById("log"),ts=new Date().toLocaleTimeString("vi-VN");',
    '  el.innerHTML+="<span class=\'l"+(t||"o")+"\'>"+ ts +"  "+ m +"</span>\\n";',
    '  el.scrollTop=el.scrollHeight;',
    '}',
    'function show(id){',
    '  ["sec-kit","sec-rec"].forEach(function(s){document.getElementById(s).style.display="none";});',
    '  var el=document.getElementById("sec-"+id);',
    '  el.style.display="block";',
    '  el.scrollIntoView({behavior:"smooth",block:"start"});',
    '}',
    'function pick(name){',
    '  sel=name;',
    '  document.querySelectorAll(".pc").forEach(function(el){',
    '    var s=el.dataset.name===name;',
    '    el.classList.toggle("sel",s);',
    '    el.querySelector(".ck").textContent=s?"\\u2713":"";',
    '  });',
    '  document.getElementById("badge").classList.add("show");',
    '  document.getElementById("badge-name").textContent=name;',
    '  ["btn-test","btn-kit","btn-rec"].forEach(function(id){document.getElementById(id).disabled=false;});',
    '  lg("Da chon: "+name,"i");',
    '}',
    'async function load(){',
    '  var c=document.getElementById("printers");',
    '  c.innerHTML="<div class=\'np\'>Dang tai...</div>";',
    '  try{',
    '    var d=await fetch("/api/printers").then(function(r){return r.json();});',
    '    if(!d.printers||!d.printers.length){c.innerHTML="<div class=\'np\'>Khong co may in nao</div>";return;}',
    '    c.innerHTML=d.printers.map(function(p){',
    '      var safe=p.name.replace(/\\\\/g,"\\\\\\\\").replace(/"/g,"&quot;").replace(/\'/g,"\\\\\'");',
    '      var cls=p.status==="ready"?"sr":"sw";',
    '      return "<div class=\'pc\' data-name=\'"+p.name+"\' onclick=\'pick(\\""+safe+"\\")\'>"',
    '       +"<div class=\'pi\'>&#128424;</div>"',
    '       +"<div style=\'flex:1\'><div class=\'pn\'>"+p.name+"</div>"',
    '       +"<span class=\'ps "+cls+"\'>"+p.statusText+"</span></div>"',
    '       +"<div class=\'ck\'></div></div>";',
    '    }).join("");',
    '    lg("Tim thay "+d.printers.length+" may in","i");',
    '  }catch(e){c.innerHTML="<div class=\'np\'>Loi: "+e.message+"</div>";}',
    '}',
    'async function post(url,body){',
    '  try{',
    '    return await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json();});',
    '  }catch(e){return{success:false,error:e.message};}',
    '}',
    'async function pTest(){',
    '  if(!sel)return;lg("In test → "+sel,"i");',
    '  var d=await post("/api/print-test",{printerName:sel});',
    '  lg(d.success?"OK! Kiem tra giay ra.":"Loi: "+d.error,d.success?"o":"e");',
    '}',
    'async function pKitchen(){',
    '  if(!sel)return;',
    '  var table=document.getElementById("k-tbl").value;',
    '  var note=document.getElementById("k-note").value;',
    '  var items=document.getElementById("k-items").value.split("\\n").filter(Boolean).map(function(l){',
    '    var p=l.split(",");return{name:p[0].trim(),qty:parseInt(p[1])||1};',
    '  });',
    '  lg("In phieu bep → "+sel,"i");',
    '  var d=await post("/api/print-kitchen",{printerName:sel,table:table,items:items,note:note});',
    '  lg(d.success?"Phieu bep OK!":"Loi: "+d.error,d.success?"o":"e");',
    '}',
    'async function pReceipt(){',
    '  if(!sel)return;',
    '  var table=document.getElementById("r-tbl").value;',
    '  var pay=document.getElementById("r-pay").value;',
    '  var items=document.getElementById("r-items").value.split("\\n").filter(Boolean).map(function(l){',
    '    var p=l.split(",");return{name:p[0].trim(),qty:parseInt(p[1])||1,price:parseInt(p[2])||0};',
    '  });',
    '  lg("In hoa don → "+sel,"i");',
    '  var d=await post("/api/print-receipt",{printerName:sel,table:table,items:items,paymentMethod:pay});',
    '  lg(d.success?"Hoa don OK!":"Loi: "+d.error,d.success?"o":"e");',
    '}',
    'load();',
    '</script>',
    '</body></html>',
  ].join('\n');
}

app.get('/', (_req, res) => res.send(buildHtml()));

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║  🌐 PRINTER TEST WEB UI              ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('  URL: http://localhost:' + PORT);
  console.log('');
  console.log('  Mo browser va chon may in de test!');
  console.log('');
});
