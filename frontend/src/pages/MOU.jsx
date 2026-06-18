import React, { useEffect, useState, useRef } from "react";
import { api, apiUrl } from "../lib/api";
import { toast } from "sonner";
import { Upload, FileText, Calendar, Download } from "lucide-react";

export default function MOU() {
  const [mou, setMou] = useState(null);
  const [file, setFile] = useState(null);
  const [expiresOn, setExpiresOn] = useState("");
  const [partnership, setPartnership] = useState("CRT");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = () => api.get("/mou").then(({ data }) => setMou(data)).catch(() => setMou(null));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file || !expiresOn) { toast.error("Choose file and renewal date"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("expires_on", new Date(expiresOn).toISOString()); fd.append("partnership_type", partnership);
    try {
      await api.post("/mou/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("MOU uploaded"); setFile(null); setExpiresOn(""); load();
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const days = mou?.days_until_renewal;
  const urgent = days != null && days < 90;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ MOU · PARTNERSHIP VAULT</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="mou-heading">
          Documents, countdowns, <span className="text-accent">revenue.</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className={`col-span-12 md:col-span-7 p-10 ${urgent ? "border border-accent bg-accent/5" : "editorial"}`} data-testid="mou-countdown">
          <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">DAYS UNTIL RENEWAL</div>
          <div className="font-display text-[12vw] md:text-[8vw] tracking-tightest leading-[0.85] mt-3 tnum">{days != null ? days : "—"}</div>
          <div className="text-ink-500 mt-2">Renewal due · {mou?.expires_on?.slice(0, 10) || "—"}</div>
          <div className="hairline my-8" />
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">PARTNERSHIP</div>
              <div className="font-display text-xl mt-2">{mou?.partnership_type || "—"}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">SEATS</div>
              <div className="font-display text-xl mt-2 tnum">{mou?.seats_used || 0} / {mou?.seats_purchased || 0}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">ACCRUED</div>
              <div className="font-display text-xl mt-2 text-accent tnum">₹{((mou?.accrued_share_inr || 0) / 100000).toFixed(2)}L</div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-5 editorial bg-ink-900 text-bone-100 p-10" data-testid="mou-doc">
          <div className="font-mono text-[10px] tracking-[0.24em] text-bone-100/60">DOCUMENT ON FILE</div>
          <FileText size={32} className="mt-4 text-accent" />
          <div className="font-display text-2xl tracking-tight mt-4 break-all">{mou?.document_name || "No file uploaded"}</div>
          <div className="text-bone-50 text-sm mt-2 opacity-90">{mou?.document_size_kb || 0} KB · signed {mou?.signed_on?.slice(0, 10)}</div>
          {mou?.gridfs_id && (
            <a href={apiUrl("/mou/download")} download={mou.document_name} data-testid="mou-download-btn"
              className="mt-5 inline-flex items-center gap-2 border border-accent text-accent px-4 py-2 text-xs hover:bg-accent hover:text-bone-100 transition-colors">
              <Download size={12} /> Download original
            </a>
          )}
          <div className="hairline my-6 border-bone-100/30" />
          <div className="font-mono text-[10px] tracking-[0.24em] text-bone-100/60">PAYOUT</div>
          <div className="font-serif text-lg mt-2 text-bone-50">{mou?.payout_status || "—"}</div>
        </div>

        <form onSubmit={upload} className="col-span-12 border-2 border-dashed border-ink-900/20 p-10 bg-bone-50 hover:border-accent transition-colors" data-testid="mou-upload-form">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">REPLACE OR ADD MOU</div>
              <h3 className="font-display text-2xl tracking-tight mt-2">Drag · drop · or click to upload</h3>
              <button type="button" onClick={() => inputRef.current.click()} className="mt-4 btn btn-ghost text-xs py-2 px-3" data-testid="mou-file-btn">
                <Upload size={14} /> {file ? file.name : "Choose file"}
              </button>
              <input ref={inputRef} type="file" hidden onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx" data-testid="mou-file-input" />
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">RENEWAL DATE</div>
              <div className="mt-2 flex items-center gap-2 border border-line px-3 py-2 bg-bone-100">
                <Calendar size={14} className="text-ink-400" />
                <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} data-testid="mou-date-input" className="bg-transparent focus:outline-none" />
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.24em] text-ink-400">TYPE</div>
              <select value={partnership} onChange={(e) => setPartnership(e.target.value)} className="mt-2 px-3 py-2 border border-line bg-bone-100" data-testid="mou-type-input">
                <option>CRT</option><option>FDP</option><option>External Placement Partner</option><option>Multi-program</option>
              </select>
            </div>
            <button type="submit" disabled={uploading} data-testid="mou-upload-btn" className="btn">
              {uploading ? "Uploading…" : "Upload MOU"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
