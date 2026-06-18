import React from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { apiUrl } from "../lib/api";

const REPORTS = [
  { kind: "pdf", icon: FileText, title: "Placement report", body: "Year-by-year offers, recruiter ledger, department breakdown — board-ready.", href: "/reports/placement.pdf", file: "placement-report.pdf", color: "#c1440e" },
  { kind: "pdf", icon: FileText, title: "Training report", body: "Module-level completion across every program + top 30 student progress.", href: "/reports/training.pdf", file: "training-report.pdf", color: "#0a0a0a" },
  { kind: "pdf", icon: FileText, title: "Department report", body: "Per-department placement rate, avg CGPA, and total roster.", href: "/reports/department.pdf", file: "department-report.pdf", color: "#4a5d3a" },
  { kind: "csv", icon: FileSpreadsheet, title: "Students · CSV", body: "Every student row — skills, CGPA, ATS, readiness, placement.", href: "/reports/students.csv", file: "students.csv", color: "#0a0a0a" },
  { kind: "csv", icon: FileSpreadsheet, title: "Applications · CSV", body: "Every pipeline row — student, company, role, stage, dates.", href: "/reports/applications.csv", file: "applications.csv", color: "#0a0a0a" },
  { kind: "csv", icon: FileSpreadsheet, title: "Placements · CSV", body: "Recruiter-by-year selections and CTC ledger.", href: "/reports/placements.csv", file: "placements.csv", color: "#0a0a0a" },
];

export default function Reports() {
  const download = async (href, filename) => {
    const res = await fetch(apiUrl(href), { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-[10px] tracking-[0.28em] text-ink-400">§ REPORTS · MODULE 13</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tightest mt-3" data-testid="reports-heading">
          Boardroom-ready <span className="text-accent">exports.</span>
        </h1>
        <p className="font-serif text-lg text-ink-500 mt-2 max-w-2xl">
          One-click PDFs for management decks and CSVs for downstream tooling — generated on demand against live data.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-3" data-testid="reports-grid">
        {REPORTS.map((r) => (
          <div key={r.title} className="col-span-12 md:col-span-6 lg:col-span-4 editorial p-7 hover:border-ink-900 transition-colors group flex flex-col" data-testid={`report-${r.file}`}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 grid place-items-center text-bone-50" style={{ background: r.color }}>
                <r.icon size={18} />
              </div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-ink-400 uppercase">{r.kind}</span>
            </div>
            <h3 className="font-display text-2xl tracking-tight mt-5">{r.title}</h3>
            <p className="text-sm text-ink-500 mt-2 flex-1">{r.body}</p>
            <button onClick={() => download(r.href, r.file)} data-testid={`download-${r.file}`}
              className="mt-6 inline-flex items-center justify-center gap-2 btn py-3 text-xs">
              <Download size={14} /> Download {r.kind.toUpperCase()}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
