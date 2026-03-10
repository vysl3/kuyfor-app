import { useState } from "react";

const SAMPLE_DATA = [
  {
    id: 1,
    firstName: "Ayşe",
    lastName: "Kaya",
    phone: "0532 111 2233",
    visits: [
      { id: 101, date: "2026-03-05", formula: "9.1 + 20vol + Argan yağı — 45dk", care: "Keratin bakım, nemlendirici maske" },
      { id: 102, date: "2026-01-18", formula: "8.0 + 30vol — 50dk röfle", care: "Onarıcı bakım serumu" },
      { id: 103, date: "2025-11-02", formula: "7.3 + 20vol tüm boyama", care: "İlk keratin işlemi" },
    ]
  },
  {
    id: 2,
    firstName: "Zeynep",
    lastName: "Arslan",
    phone: "0543 987 6655",
    visits: [
      { id: 201, date: "2026-02-20", formula: "Balayage — 9.3 lifter + 40vol", care: "Mor toner + maske" },
    ]
  }
];

const emptyVisit = { date: "", formula: "", care: "" };
const emptyClient = { firstName: "", lastName: "", phone: "" };

export default function App() {
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem("kuyfor_clients");
      return saved ? JSON.parse(saved) : SAMPLE_DATA;
    } catch { return SAMPLE_DATA; }
  });

  const saveClients = (updated) => {
    setClients(updated);
    try { localStorage.setItem("kuyfor_clients", JSON.stringify(updated)); } catch {}
  };

  const [view, setView] = useState("list");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [visitForm, setVisitForm] = useState(emptyVisit);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColor = (c) => {
    const colors = ["#C17B5C","#7B9E87","#9B8EC4","#D4956A","#6A9BB5","#C47B8A","#7BB5A0"];
    return colors[(c.firstName.charCodeAt(0) + c.lastName.charCodeAt(0)) % colors.length];
  };

  const initials = (c) => `${c.firstName[0]}${c.lastName[0]}`.toUpperCase();

  const lastVisit = (c) => c.visits.length > 0
    ? [...c.visits].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const addClient = () => {
    if (!clientForm.firstName || !clientForm.lastName || !clientForm.phone) {
      showToast("Ad, soyad ve telefon zorunlu ✗", "err"); return;
    }
    saveClients([{ ...clientForm, id: Date.now(), visits: [] }, ...clients]);
    setClientForm(emptyClient);
    setView("list");
    showToast("Müşteri eklendi ✓");
  };

  const updateClient = () => {
    const updated = clients.map(c => c.id === selectedClient.id ? { ...c, ...clientForm } : c);
    saveClients(updated);
    setSelectedClient({ ...selectedClient, ...clientForm });
    setView("clientDetail");
    showToast("Güncellendi ✓");
  };

  const deleteClient = (id) => {
    saveClients(clients.filter(c => c.id !== id));
    setView("list");
    showToast("Müşteri silindi");
  };

  const addVisit = () => {
    if (!visitForm.date) { showToast("Tarih zorunlu ✗", "err"); return; }
    const newVisit = { ...visitForm, id: Date.now() };
    const updatedClient = { ...selectedClient, visits: [newVisit, ...selectedClient.visits] };
    const updated = clients.map(c => c.id === selectedClient.id ? updatedClient : c);
    saveClients(updated);
    setSelectedClient(updatedClient);
    setVisitForm(emptyVisit);
    setView("clientDetail");
    showToast("Ziyaret eklendi ✓");
  };

  const updateVisit = () => {
    const updatedVisits = selectedClient.visits.map(v =>
      v.id === selectedVisit.id ? { ...visitForm, id: v.id } : v
    );
    const updatedClient = { ...selectedClient, visits: updatedVisits };
    const updated = clients.map(c => c.id === selectedClient.id ? updatedClient : c);
    saveClients(updated);
    setSelectedClient(updatedClient);
    setSelectedVisit({ ...visitForm, id: selectedVisit.id });
    setView("visitDetail");
    showToast("Ziyaret güncellendi ✓");
  };

  const deleteVisit = (visitId) => {
    const updatedVisits = selectedClient.visits.filter(v => v.id !== visitId);
    const updatedClient = { ...selectedClient, visits: updatedVisits };
    const updated = clients.map(c => c.id === selectedClient.id ? updatedClient : c);
    saveClients(updated);
    setSelectedClient(updatedClient);
    setView("clientDetail");
    showToast("Ziyaret silindi");
  };

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const sortedVisits = (c) => [...c.visits].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={S.wrap}>
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "err" ? "#A0523A" : "#3A2E28" }}>
          {toast.msg}
        </div>
      )}

      {/* LIST */}
      {view === "list" && (
        <div style={S.screen}>
          <div style={S.header}>
            <div>
              <div style={S.appTitle}>✂ Müşteri</div>
              <div style={S.appSub}>Boya Kartı</div>
            </div>
            <button style={S.addBtn} onClick={() => { setClientForm(emptyClient); setView("addClient"); }}>+</button>
          </div>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input style={S.searchInput} placeholder="Ara..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={S.scroll}>
            {filtered.length === 0 && (
              <div style={S.empty}>
                <div style={{ fontSize: 48 }}>💇‍♀️</div>
                <div style={S.emptyText}>Henüz müşteri yok</div>
                <button style={S.emptyBtn} onClick={() => setView("addClient")}>Müşteri Ekle</button>
              </div>
            )}
            {filtered.map(c => {
              const lv = lastVisit(c);
              return (
                <button key={c.id} style={S.card}
                  onClick={() => { setSelectedClient(c); setView("clientDetail"); }}>
                  <div style={{ ...S.avatar, background: avatarColor(c) }}>{initials(c)}</div>
                  <div style={S.cardInfo}>
                    <div style={S.cardName}>{c.firstName} {c.lastName}</div>
                    <div style={S.cardPhone}>{c.phone}</div>
                    {lv && <div style={S.cardMeta}>📅 {formatDate(lv.date)} · {c.visits.length} ziyaret</div>}
                  </div>
                  <div style={S.chevron}>›</div>
                </button>
              );
            })}
          </div>
          <div style={S.countBar}>{clients.length} müşteri</div>
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
          <div style={S.scroll}>
            <ClientFields form={clientForm} setForm={setClientForm} />
          </div>
        </div>
      )}

      {/* CLIENT DETAIL */}
      {view === "clientDetail" && selectedClient && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("list")}>‹</button>
            <span style={S.headerTitle}>{selectedClient.firstName} {selectedClient.lastName}</span>
            <button style={S.editBtnH} onClick={() => {
              setClientForm({ firstName: selectedClient.firstName, lastName: selectedClient.lastName, phone: selectedClient.phone });
              setView("editClient");
            }}>Düzenle</button>
          </div>
          <div style={S.scroll}>
            <div style={S.hero}>
              <div style={{ ...S.avatarLg, background: avatarColor(selectedClient) }}>{initials(selectedClient)}</div>
              <div style={S.heroName}>{selectedClient.firstName} {selectedClient.lastName}</div>
              <div style={S.heroPhone}>{selectedClient.phone}</div>
              <div style={S.heroBadge}>{selectedClient.visits.length} Ziyaret</div>
            </div>
            <button style={S.addVisitBtn} onClick={() => { setVisitForm(emptyVisit); setView("addVisit"); }}>
              + Yeni Ziyaret Ekle
            </button>
            {selectedClient.visits.length === 0 && (
              <div style={S.noVisit}>Henüz ziyaret kaydı yok</div>
            )}
            {sortedVisits(selectedClient).map((v, i) => (
              <button key={v.id} style={S.visitCard}
                onClick={() => { setSelectedVisit(v); setView("visitDetail"); }}>
                <div style={S.visitLine}>
                  <div style={S.visitDot} />
                  {i < selectedClient.visits.length - 1 && <div style={S.visitConnector} />}
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
      {view === "editClient" && selectedClient && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("clientDetail")}>‹</button>
            <span style={S.headerTitle}>Müşteri Düzenle</span>
            <button style={S.saveBtn} onClick={updateClient}>Kaydet</button>
          </div>
          <div style={S.scroll}>
            <ClientFields form={clientForm} setForm={setClientForm} />
          </div>
        </div>
      )}

      {/* ADD VISIT */}
      {view === "addVisit" && selectedClient && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("clientDetail")}>‹</button>
            <span style={S.headerTitle}>Yeni Ziyaret</span>
            <button style={S.saveBtn} onClick={addVisit}>Kaydet</button>
          </div>
          <div style={S.scroll}>
            <VisitFields form={visitForm} setForm={setVisitForm} />
          </div>
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
            <div style={{ ...S.hero, paddingBottom: 16 }}>
              <div style={{ fontSize: 42 }}>💇‍♀️</div>
              <div style={S.heroName}>{formatDate(selectedVisit.date)}</div>
              <div style={S.heroPhone}>{selectedClient.firstName} {selectedClient.lastName}</div>
            </div>
            {selectedVisit.formula && (
              <div style={S.detailCard}>
                <div style={S.detailLabel}>🎨 Boya Formülü</div>
                <div style={S.detailValue}>{selectedVisit.formula}</div>
              </div>
            )}
            {selectedVisit.care && (
              <div style={S.detailCard}>
                <div style={S.detailLabel}>💆‍♀️ Bakım</div>
                <div style={S.detailValue}>{selectedVisit.care}</div>
              </div>
            )}
            <button style={S.deleteBtn} onClick={() => deleteVisit(selectedVisit.id)}>🗑 Ziyareti Sil</button>
          </div>
        </div>
      )}

      {/* EDIT VISIT */}
      {view === "editVisit" && selectedVisit && (
        <div style={S.screen}>
          <div style={S.header}>
            <button style={S.backBtn} onClick={() => setView("visitDetail")}>‹</button>
            <span style={S.headerTitle}>Ziyaret Düzenle</span>
            <button style={S.saveBtn} onClick={updateVisit}>Kaydet</button>
          </div>
          <div style={S.scroll}>
            <VisitFields form={visitForm} setForm={setVisitForm} />
          </div>
        </div>
      )}
    </div>
  );
}

function ClientFields({ form, setForm }) {
  return (
    <div style={{ padding: "16px 20px" }}>
      {[
        { label: "Ad", key: "firstName", placeholder: "Ayşe", type: "text" },
        { label: "Soyad", key: "lastName", placeholder: "Kaya", type: "text" },
        { label: "Telefon", key: "phone", placeholder: "0532 000 0000", type: "tel" },
      ].map(f => (
        <div key={f.key} style={S.fieldGroup}>
          <label style={S.fieldLabel}>{f.label}</label>
          <input style={S.input} type={f.type} placeholder={f.placeholder} value={form[f.key]}
            onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

function VisitFields({ form, setForm }) {
  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Tarih</label>
        <input style={S.input} type="date" value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Boya Formülü</label>
        <textarea style={{ ...S.input, ...S.textarea }} placeholder="Örn: 9.1 + 20vol + Argan — 45dk"
          value={form.formula} onChange={e => setForm({ ...form, formula: e.target.value })} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Bakım Notu</label>
        <textarea style={{ ...S.input, ...S.textarea }} placeholder="Örn: Keratin bakım, maske..."
          value={form.care} onChange={e => setForm({ ...form, care: e.target.value })} />
      </div>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: "100vh",
    background: "#F5F0EB",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Georgia', serif",
    position: "relative",
    maxWidth: 480,
    margin: "0 auto",
  },
  screen: { flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" },
  header: {
    padding: "52px 22px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#F5F0EB", borderBottom: "1px solid #E0D8CF", flexShrink: 0,
    position: "sticky", top: 0, zIndex: 10,
  },
  appTitle: { fontSize: 22, fontWeight: 700, color: "#3A2E28", letterSpacing: "-0.5px" },
  appSub: { fontSize: 12, color: "#9B8B7E", marginTop: 1, fontStyle: "italic" },
  addBtn: {
    width: 42, height: 42, borderRadius: 21, background: "#C17B5C", color: "#fff",
    border: "none", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", lineHeight: 1, paddingBottom: 2,
    boxShadow: "0 4px 12px rgba(193,123,92,0.4)",
  },
  searchWrap: {
    margin: "12px 18px 8px", background: "#EDE6DE", borderRadius: 14,
    display: "flex", alignItems: "center", padding: "0 14px", flexShrink: 0,
  },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: {
    flex: 1, border: "none", background: "transparent", padding: "11px 0",
    fontSize: 15, color: "#3A2E28", outline: "none", fontFamily: "Georgia, serif",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "8px 0 40px" },
  card: {
    width: "calc(100% - 36px)", background: "#fff", border: "none", borderRadius: 18,
    padding: "14px 16px", margin: "0 18px 10px", display: "flex", alignItems: "center",
    cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "left",
    boxSizing: "border-box",
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23, color: "#fff", fontWeight: 700, fontSize: 17,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: 1,
  },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardName: { fontSize: 16, fontWeight: 700, color: "#3A2E28" },
  cardPhone: { fontSize: 13, color: "#9B8B7E", marginTop: 2 },
  cardMeta: { fontSize: 12, color: "#C17B5C", marginTop: 3 },
  chevron: { color: "#C8BEB7", fontSize: 22, marginLeft: 6 },
  countBar: {
    textAlign: "center", padding: "10px", fontSize: 12, color: "#B0A49B",
    borderTop: "1px solid #E0D8CF", background: "#F5F0EB", flexShrink: 0, fontStyle: "italic",
  },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "60px 20px", gap: 12,
  },
  emptyText: { fontSize: 16, color: "#9B8B7E", fontStyle: "italic" },
  emptyBtn: {
    marginTop: 8, background: "#C17B5C", color: "#fff", border: "none",
    borderRadius: 22, padding: "12px 28px", fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif",
  },
  backBtn: {
    fontSize: 32, color: "#C17B5C", background: "none", border: "none",
    cursor: "pointer", lineHeight: 1, padding: "0 4px", marginLeft: -4,
  },
  headerTitle: { fontSize: 16, fontWeight: 700, color: "#3A2E28", letterSpacing: "-0.3px" },
  saveBtn: {
    background: "#C17B5C", color: "#fff", border: "none", borderRadius: 16,
    padding: "8px 16px", fontSize: 14, cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600,
  },
  editBtnH: {
    background: "none", color: "#C17B5C", border: "none", fontSize: 15,
    cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: 600,
  },
  hero: { display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 20px", gap: 6 },
  avatarLg: {
    width: 72, height: 72, borderRadius: 36, color: "#fff", fontWeight: 700, fontSize: 26,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  },
  heroName: { fontSize: 22, fontWeight: 700, color: "#3A2E28", marginTop: 4 },
  heroPhone: { fontSize: 15, color: "#9B8B7E", fontStyle: "italic" },
  heroBadge: {
    background: "#F0E6DD", color: "#C17B5C", borderRadius: 20, padding: "4px 14px",
    fontSize: 12, fontWeight: 700, marginTop: 4, letterSpacing: 0.5,
  },
  addVisitBtn: {
    margin: "0 18px 16px", width: "calc(100% - 36px)", background: "#C17B5C", color: "#fff",
    border: "none", borderRadius: 16, padding: "14px", fontSize: 15, cursor: "pointer",
    fontFamily: "Georgia, serif", fontWeight: 600,
    boxShadow: "0 4px 14px rgba(193,123,92,0.35)", boxSizing: "border-box",
  },
  noVisit: { textAlign: "center", color: "#B0A49B", fontStyle: "italic", padding: "20px", fontSize: 14 },
  visitCard: {
    width: "calc(100% - 36px)", margin: "0 18px 0", background: "#fff", border: "none",
    display: "flex", alignItems: "flex-start", cursor: "pointer", padding: "12px 14px 12px 0",
    textAlign: "left", borderBottom: "1px solid #F0EAE4", boxSizing: "border-box",
  },
  visitLine: { display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0, paddingTop: 4 },
  visitDot: { width: 10, height: 10, borderRadius: 5, background: "#C17B5C", flexShrink: 0 },
  visitConnector: { width: 2, height: 40, background: "#E8DDD6", marginTop: 4 },
  visitBody: { flex: 1 },
  visitDate: { fontSize: 14, fontWeight: 700, color: "#3A2E28", marginBottom: 4 },
  visitFormula: { fontSize: 12, color: "#7B6B60", marginBottom: 2 },
  visitCare: { fontSize: 12, color: "#9B8B7E" },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    display: "block", fontSize: 12, fontWeight: 600, color: "#9B8B7E",
    marginBottom: 6, letterSpacing: 0.8, textTransform: "uppercase",
  },
  input: {
    width: "100%", background: "#fff", border: "1.5px solid #E0D8CF", borderRadius: 14,
    padding: "12px 14px", fontSize: 15, color: "#3A2E28", outline: "none",
    fontFamily: "Georgia, serif", boxSizing: "border-box",
  },
  textarea: { minHeight: 80, resize: "none", lineHeight: 1.6 },
  detailCard: {
    background: "#fff", borderRadius: 18, padding: "14px 18px", margin: "0 18px 12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  detailLabel: { fontSize: 11, fontWeight: 700, color: "#C17B5C", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  detailValue: { fontSize: 15, color: "#3A2E28", lineHeight: 1.55 },
  deleteBtn: {
    width: "calc(100% - 36px)", margin: "8px 18px 24px", background: "none",
    border: "1.5px solid #E8C4B8", borderRadius: 16, color: "#C17B5C", padding: "13px",
    fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif", boxSizing: "border-box",
  },
  toast: {
    position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
    color: "#fff", padding: "10px 22px", borderRadius: 20, fontSize: 13, zIndex: 100,
    whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
};
