import { useState, useEffect } from "react";

const SUPABASE_URL = "https://ojwtikokfvlcinyudkne.supabase.co";
const SUPABASE_KEY = "sb_publishable_sfHE0dEzg3EoEVRRd1vphQ_2PObBvv6";

const db = async (method, path, body) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=minimal"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (method === "GET" || method === "POST") return res.json();
  return res;
};

const emptyVisit = { date: "", formula: "", haircut: "", care: "", note: "" };
const emptyClient = { firstName: "", lastName: "", phone: "" };

export default function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [visitForm, setVisitForm] = useState(emptyVisit);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await db("GET", "clients?order=created_at.desc");
      if (Array.isArray(data)) setClients(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColor = (c) => {
    const colors = ["#C17B5C","#7B9E87","#9B8EC4","#D4956A","#6A9BB5","#C47B8A","#7BB5A0"];
    return colors[((c.first_name||"A").charCodeAt(0) + (c.last_name||"A").charCodeAt(0)) % colors.length];
  };

  const initials = (c) => `${(c.first_name||"?")[0]}${(c.last_name||"?")[0]}`.toUpperCase();

  const lastVisit = (c) => {
    const visits = c.visits || [];
    return visits.length > 0 ? [...visits].sort((a,b) => b.date.localeCompare(a.date))[0] : null;
  };

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
  };

  const sortedVisits = (c) => [...(c.visits||[])].sort((a,b) => b.date.localeCompare(a.date));

  // CLIENT CRUD
  const addClient = async () => {
    if (!clientForm.firstName || !clientForm.lastName || !clientForm.phone) {
      showToast("Ad, soyad ve telefon zorunlu ✗", "err"); return;
    }
    const res = await db("POST", "clients", {
      first_name: clientForm.firstName,
      last_name: clientForm.lastName,
      phone: clientForm.phone,
      visits: []
    });
    if (res && res[0]) {
      setClients([res[0], ...clients]);
      setClientForm(emptyClient);
      setView("list");
      showToast("Müşteri eklendi ✓");
    }
  };

  const updateClient = async () => {
    await db("PATCH", `clients?id=eq.${selectedClient.id}`, {
      first_name: clientForm.firstName,
      last_name: clientForm.lastName,
      phone: clientForm.phone
    });
    const updated = clients.map(c => c.id === selectedClient.id
      ? { ...c, first_name: clientForm.firstName, last_name: clientForm.lastName, phone: clientForm.phone }
      : c);
    setClients(updated);
    setSelectedClient({ ...selectedClient, first_name: clientForm.firstName, last_name: clientForm.lastName, phone: clientForm.phone });
    setView("clientDetail");
    showToast("Güncellendi ✓");
  };

  const deleteClient = async (id) => {
    await db("DELETE", `clients?id=eq.${id}`);
    setClients(clients.filter(c => c.id !== id));
    setView("list");
    showToast("Müşteri silindi");
  };

  // VISIT CRUD
  const addVisit = async () => {
    if (!visitForm.date) { showToast("Tarih zorunlu ✗", "err"); return; }
    const newVisit = { id: Date.now(), ...visitForm };
    const updatedVisits = [newVisit, ...(selectedClient.visits || [])];
    await db("PATCH", `clients?id=eq.${selectedClient.id}`, { visits: updatedVisits });
    const updatedClient = { ...selectedClient, visits: updatedVisits };
    setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
    setVisitForm(emptyVisit);
    setView("clientDetail");
    showToast("Ziyaret eklendi ✓");
  };

  const updateVisit = async () => {
    const updatedVisits = selectedClient.visits.map(v =>
      v.id === selectedVisit.id ? { ...visitForm, id: v.id } : v
    );
    await db("PATCH", `clients?id=eq.${selectedClient.id}`, { visits: updatedVisits });
    const updatedClient = { ...selectedClient, visits: updatedVisits };
    setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
    setSelectedVisit({ ...visitForm, id: selectedVisit.id });
    setView("visitDetail");
    showToast("Ziyaret güncellendi ✓");
  };

  const deleteVisit = async (visitId) => {
    const updatedVisits = selectedClient.visits.filter(v => v.id !== visitId);
    await db("PATCH", `clients?id=eq.${selectedClient.id}`, { visits: updatedVisits });
    const updatedClient = { ...selectedClient, visits: updatedVisits };
    setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
    setView("clientDetail");
    showToast("Ziyaret silindi");
  };

  return (
    <div style={S.wrap}>
      {toast && <div style={{...S.toast, background: toast.type==="err"?"#A0523A":"#3A2E28"}}>{toast.msg}</div>}

      {/* LIST */}
      {view === "list" && (
        <div style={S.screen}>
          <div style={S.header}>
            <div>
              <div style={S.appTitle}>VK Müşteri</div>
              <div style={S.appSub}>Müşteri Kartı</div>
            </div>
            <button style={S.addBtn} onClick={() => { setClientForm(emptyClient); setView("addClient"); }}>+</button>
          </div>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input style={S.searchInput} placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={S.statsRow}>
            <div style={S.statBox}>
              <div style={S.statNum}>{clients.length}</div>
              <div style={S.statLabel}>Müşteri</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.statBox}>
              <div style={S.statNum}>{clients.reduce((acc, c) => acc + (c.visits||[]).length, 0)}</div>
              <div style={S.statLabel}>Toplam Ziyaret</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.statBox}>
              <div style={S.statNum}>{clients.filter(c => {
                const lv = lastVisit(c);
                if (!lv) return false;
                const diff = (new Date() - new Date(lv.date)) / (1000*60*60*24);
                return diff <= 30;
              }).length}</div>
              <div style={S.statLabel}>Bu Ay</div>
            </div>
          </div>
          <div style={S.scroll}>
            {loading && <div style={S.loading}>Yükleniyor... ☁️</div>}
            {!loading && filtered.length === 0 && (
              <div style={S.empty}>
                <div style={{width:72,height:72,borderRadius:36,background:"#C17B5C",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,letterSpacing:-1,margin:"0 auto"}}>VK</div>
                <div style={S.emptyText}>Henüz müşteri yok</div>
                <button style={S.emptyBtn} onClick={() => setView("addClient")}>Müşteri Ekle</button>
              </div>
            )}
            {filtered.map(c => {
              const lv = lastVisit(c);
              return (
                <button key={c.id} style={S.card} onClick={() => { setSelectedClient(c); setView("clientDetail"); }}>
                  <div style={{...S.avatar, background: avatarColor(c)}}>{initials(c)}</div>
                  <div style={S.cardInfo}>
                    <div style={S.cardName}>{c.first_name} {c.last_name}</div>
                    <div style={S.cardPhone}>{c.phone}</div>
                    {lv && <div style={S.cardMeta}>📅 {formatDate(lv.date)} · {(c.visits||[]).length} ziyaret</div>}
                  </div>
                  <div style={S.chevron}>›</div>
                </button>
              );
            })}
          </div>
          <div style={S.countBar}>{clients.length} müşteri ☁️ bulut</div>
        </div>
      )}

      {/* ADD CLIENT */}
      {view === "addClient" && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("list")}>‹</button>
            <span style={S.headerTitle}>Yeni Müşteri</span>
            <button style={S.saveBtn} onClick={addClient}>Kaydet</button>
          </div>
          <div style={S.scroll}><ClientFields form={clientForm} setForm={setClientForm} /></div>
        </div>
      )}

      {/* CLIENT DETAIL */}
      {view === "clientDetail" && selectedClient && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("list")}>‹</button>
            <span style={S.headerTitle}>{selectedClient.first_name} {selectedClient.last_name}</span>
            <button style={S.editBtnH} onClick={() => {
              setClientForm({ firstName: selectedClient.first_name, lastName: selectedClient.last_name, phone: selectedClient.phone });
              setView("editClient");
            }}>Düzenle</button>
          </div>
          <div style={S.scroll}>
            <div style={S.hero}>
              <div style={{...S.avatarLg, background: avatarColor(selectedClient)}}>{initials(selectedClient)}</div>
              <div style={S.heroName}>{selectedClient.first_name} {selectedClient.last_name}</div>
              <div style={S.heroPhone}>{selectedClient.phone}</div>
              <div style={S.heroBadge}>{(selectedClient.visits||[]).length} Ziyaret</div>
            </div>
            <button style={S.addVisitBtn} onClick={() => { setVisitForm(emptyVisit); setView("addVisit"); }}>
              + Yeni Ziyaret Ekle
            </button>
            {(selectedClient.visits||[]).length === 0 && <div style={S.noVisit}>Henüz ziyaret kaydı yok</div>}
            {sortedVisits(selectedClient).map((v, i) => (
              <button key={v.id} style={S.visitCard} onClick={() => { setSelectedVisit(v); setView("visitDetail"); }}>
                <div style={S.visitLine}>
                  <div style={S.visitDot} />
                  {i < (selectedClient.visits||[]).length - 1 && <div style={S.visitConnector} />}
                </div>
                <div style={S.visitBody}>
                  <div style={S.visitDate}>{formatDate(v.date)}</div>
                  {v.formula && <div style={S.visitFormula}>🎨 {v.formula}</div>}
                  {v.care && <div style={S.visitCare}>💆 {v.care}</div>}
                </div>
                <div style={S.chevron}>›</div>
              </button>
            ))}
            <button style={S.deleteBtn} onClick={() => deleteClient(selectedClient.id)}>🗑 Müşteriyi Sil</button>
          </div>
        </div>
      )}

      {/* EDIT CLIENT */}
      {view === "editClient" && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("clientDetail")}>‹</button>
            <span style={S.headerTitle}>Müşteri Düzenle</span>
            <button style={S.saveBtn} onClick={updateClient}>Kaydet</button>
          </div>
          <div style={S.scroll}><ClientFields form={clientForm} setForm={setClientForm} /></div>
        </div>
      )}

      {/* ADD VISIT */}
      {view === "addVisit" && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("clientDetail")}>‹</button>
            <span style={S.headerTitle}>Yeni Ziyaret</span>
            <button style={S.saveBtn} onClick={addVisit}>Kaydet</button>
          </div>
          <div style={S.scroll}><VisitFields form={visitForm} setForm={setVisitForm} /></div>
        </div>
      )}

      {/* VISIT DETAIL */}
      {view === "visitDetail" && selectedVisit && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("clientDetail")}>‹</button>
            <span style={S.headerTitle}>Ziyaret Detayı</span>
            <button style={S.editBtnH} onClick={() => {
              setVisitForm({ date: selectedVisit.date, formula: selectedVisit.formula, care: selectedVisit.care });
              setView("editVisit");
            }}>Düzenle</button>
          </div>
          <div style={S.scroll}>
            <div style={{...S.hero, paddingBottom:16}}>
              <div style={{width:60,height:60,borderRadius:30,background:"#111",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,letterSpacing:-1,margin:"0 auto"}}>VK</div>
              <div style={S.heroName}>{formatDate(selectedVisit.date)}</div>
              <div style={S.heroPhone}>{selectedClient.first_name} {selectedClient.last_name}</div>
            </div>
            {selectedVisit.formula && <div style={S.detailCard}><div style={S.detailLabel}>🎨 Boya Formülü</div><div style={S.detailValue}>{selectedVisit.formula}</div></div>}
            {selectedVisit.haircut && <div style={S.detailCard}><div style={S.detailLabel}>✂ Saç Kesimi</div><div style={S.detailValue}>{selectedVisit.haircut}</div></div>}
            {selectedVisit.care && <div style={S.detailCard}><div style={S.detailLabel}>💆‍♀️ Bakım</div><div style={S.detailValue}>{selectedVisit.care}</div></div>}
            {selectedVisit.note && <div style={S.detailCard}><div style={S.detailLabel}>📝 Genel Not</div><div style={S.detailValue}>{selectedVisit.note}</div></div>}
            <button style={S.deleteBtn} onClick={() => deleteVisit(selectedVisit.id)}>🗑 Ziyareti Sil</button>
          </div>
        </div>
      )}

      {/* EDIT VISIT */}
      {view === "editVisit" && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("visitDetail")}>‹</button>
            <span style={S.headerTitle}>Ziyaret Düzenle</span>
            <button style={S.saveBtn} onClick={updateVisit}>Kaydet</button>
          </div>
          <div style={S.scroll}><VisitFields form={visitForm} setForm={setVisitForm} /></div>
        </div>
      )}
    </div>
  );
}

function ClientFields({ form, setForm }) {
  return (
    <div style={{padding:"16px 20px"}}>
      {[
        {label:"Ad", key:"firstName", placeholder:"Ayşe", type:"text"},
        {label:"Soyad", key:"lastName", placeholder:"Kaya", type:"text"},
        {label:"Telefon", key:"phone", placeholder:"0532 000 0000", type:"tel"},
      ].map(f => (
        <div key={f.key} style={S.fieldGroup}>
          <label style={S.fieldLabel}>{f.label}</label>
          <input style={S.input} type={f.type} placeholder={f.placeholder} value={form[f.key]}
            onChange={e => setForm({...form, [f.key]: e.target.value})} />
        </div>
      ))}
    </div>
  );
}

function VisitFields({ form, setForm }) {
  return (
    <div style={{padding:"16px 20px"}}>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Tarih</label>
        <input style={S.input} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Boya Formülü</label>
        <textarea style={{...S.input, ...S.textarea}} placeholder="Örn: 9.1 + 20vol + Argan — 45dk"
          value={form.formula} onChange={e => setForm({...form, formula: e.target.value})} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>✂ Saç Kesimi</label>
        <textarea style={{...S.input, ...S.textarea}} placeholder="Örn: Küt kesim, 3cm kısaltma, yanlarda kademe..."
          value={form.haircut} onChange={e => setForm({...form, haircut: e.target.value})} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Bakım Notu</label>
        <textarea style={{...S.input, ...S.textarea}} placeholder="Örn: Keratin bakım, maske..."
          value={form.care} onChange={e => setForm({...form, care: e.target.value})} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>📝 Genel Not</label>
        <textarea style={{...S.input, ...S.textarea}} placeholder="Serbest not ekle..."
          value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
      </div>
    </div>
  );
}

const S = {
  wrap: { minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column",
    fontFamily:"'Georgia', serif", position:"relative", maxWidth:480, margin:"0 auto" },
  screen: { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" },
  header: { padding:"52px 22px 14px", display:"flex", alignItems:"center", justifyContent:"space-between",
    background:"#111", borderBottom:"1px solid #222", flexShrink:0, position:"sticky", top:0, zIndex:10 },
  appTitle: { fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.5px" },
  appSub: { fontSize:12, color:"#999", marginTop:1, fontStyle:"italic" },
  addBtn: { width:42, height:42, borderRadius:21, background:"#fff", color:"#111", border:"none",
    fontSize:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
    lineHeight:1, paddingBottom:2 },
  statsRow: { display:"flex", alignItems:"center", margin:"10px 18px 4px", background:"#111",
    borderRadius:16, padding:"14px 0" },
  statBox: { flex:1, display:"flex", flexDirection:"column", alignItems:"center" },
  statNum: { fontSize:22, fontWeight:700, color:"#fff", letterSpacing:-0.5 },
  statLabel: { fontSize:11, color:"#888", marginTop:2, letterSpacing:0.5 },
  statDivider: { width:1, height:30, background:"#333" },
    display:"flex", alignItems:"center", padding:"0 14px", flexShrink:0 },
  searchIcon: { fontSize:14, marginRight:8, opacity:0.4 },
  searchInput: { flex:1, border:"none", background:"transparent", padding:"11px 0",
    fontSize:15, color:"#111", outline:"none", fontFamily:"Georgia, serif" },
  scroll: { flex:1, overflowY:"auto", padding:"8px 0 40px" },
  loading: { textAlign:"center", padding:"40px", color:"#888", fontSize:16, fontStyle:"italic" },
  card: { width:"calc(100% - 36px)", background:"#F8F8F8", border:"0.5px solid #E5E5E5", borderRadius:18,
    padding:"14px 16px", margin:"0 18px 10px", display:"flex", alignItems:"center",
    cursor:"pointer", textAlign:"left", boxSizing:"border-box" },
  avatar: { width:46, height:46, borderRadius:23, color:"#fff", fontWeight:700, fontSize:17,
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, letterSpacing:1, background:"#111" },
  cardInfo: { flex:1, marginLeft:14 },
  cardName: { fontSize:16, fontWeight:700, color:"#111" },
  cardPhone: { fontSize:13, color:"#888", marginTop:2 },
  cardMeta: { fontSize:12, color:"#555", marginTop:3 },
  chevron: { color:"#bbb", fontSize:22, marginLeft:6 },
  countBar: { textAlign:"center", padding:"10px", fontSize:12, color:"#999",
    borderTop:"0.5px solid #E5E5E5", background:"#fff", flexShrink:0, fontStyle:"italic" },
  empty: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", gap:12 },
  emptyText: { fontSize:16, color:"#888", fontStyle:"italic" },
  emptyBtn: { marginTop:8, background:"#111", color:"#fff", border:"none", borderRadius:22,
    padding:"12px 28px", fontSize:15, cursor:"pointer", fontFamily:"Georgia, serif" },
  backBtn: { fontSize:32, color:"#fff", background:"none", border:"none", cursor:"pointer", lineHeight:1, padding:"0 4px", marginLeft:-4 },
  headerTitle: { fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"-0.3px" },
  saveBtn: { background:"#fff", color:"#111", border:"none", borderRadius:16, padding:"8px 16px",
    fontSize:14, cursor:"pointer", fontFamily:"Georgia, serif", fontWeight:600 },
  editBtnH: { background:"none", color:"#aaa", border:"none", fontSize:15, cursor:"pointer", fontFamily:"Georgia, serif", fontWeight:600 },
  hero: { display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 0 20px", gap:6 },
  avatarLg: { width:72, height:72, borderRadius:36, color:"#fff", fontWeight:700, fontSize:26,
    background:"#111", display:"flex", alignItems:"center", justifyContent:"center" },
  heroName: { fontSize:22, fontWeight:700, color:"#111", marginTop:4 },
  heroPhone: { fontSize:15, color:"#888", fontStyle:"italic" },
  heroBadge: { background:"#F2F2F2", color:"#333", borderRadius:20, padding:"4px 14px",
    fontSize:12, fontWeight:700, marginTop:4, letterSpacing:0.5, border:"0.5px solid #DDD" },
  addVisitBtn: { margin:"0 18px 16px", width:"calc(100% - 36px)", background:"#111", color:"#fff",
    border:"none", borderRadius:16, padding:"14px", fontSize:15, cursor:"pointer",
    fontFamily:"Georgia, serif", fontWeight:600, boxSizing:"border-box" },
  noVisit: { textAlign:"center", color:"#aaa", fontStyle:"italic", padding:"20px", fontSize:14 },
  visitCard: { width:"calc(100% - 36px)", margin:"0 18px 0", background:"#fff", border:"none",
    display:"flex", alignItems:"flex-start", cursor:"pointer", padding:"12px 14px 12px 0",
    textAlign:"left", borderBottom:"0.5px solid #EEE", boxSizing:"border-box" },
  visitLine: { display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0, paddingTop:4 },
  visitDot: { width:10, height:10, borderRadius:5, background:"#111", flexShrink:0 },
  visitConnector: { width:2, height:40, background:"#DDD", marginTop:4 },
  visitBody: { flex:1 },
  visitDate: { fontSize:14, fontWeight:700, color:"#111", marginBottom:4 },
  visitFormula: { fontSize:12, color:"#444", marginBottom:2 },
  visitCare: { fontSize:12, color:"#666" },
  fieldGroup: { marginBottom:18 },
  fieldLabel: { display:"block", fontSize:12, fontWeight:600, color:"#666", marginBottom:6, letterSpacing:0.8, textTransform:"uppercase" },
  input: { width:"100%", background:"#F8F8F8", border:"0.5px solid #DDD", borderRadius:14,
    padding:"12px 14px", fontSize:15, color:"#111", outline:"none", fontFamily:"Georgia, serif", boxSizing:"border-box" },
  textarea: { minHeight:80, resize:"none", lineHeight:1.6 },
  detailCard: { background:"#F8F8F8", borderRadius:18, padding:"14px 18px", margin:"0 18px 12px", border:"0.5px solid #E5E5E5" },
  detailLabel: { fontSize:11, fontWeight:700, color:"#333", letterSpacing:1, textTransform:"uppercase", marginBottom:6 },
  detailValue: { fontSize:15, color:"#111", lineHeight:1.55 },
  deleteBtn: { width:"calc(100% - 36px)", margin:"8px 18px 24px", background:"none",
    border:"0.5px solid #DDD", borderRadius:16, color:"#888", padding:"13px",
    fontSize:15, cursor:"pointer", fontFamily:"Georgia, serif", boxSizing:"border-box" },
  toast: { position:"fixed", bottom:40, left:"50%", transform:"translateX(-50%)", color:"#fff",
    padding:"10px 22px", borderRadius:20, fontSize:13, zIndex:100, whiteSpace:"nowrap",
    background:"#111" },
};
