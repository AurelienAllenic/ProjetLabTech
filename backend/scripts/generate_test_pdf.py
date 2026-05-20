"""Generates a realistic French biological lab report PDF for testing the /analyse endpoint."""
from fpdf import FPDF
from datetime import date

class LabReport(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 8, "LABORATOIRE BIOANALYSE MEDICAL", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 5, "12 Avenue de la Republique - 75011 Paris | Tel. 01 23 45 67 89 | SIRET 123 456 789 00012", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 5, f"Document genere le {date.today().strftime('%d/%m/%Y')} - Confidentiel", align="C")


pdf = LabReport(orientation="P", unit="mm", format="A4")
pdf.add_page()
pdf.set_auto_page_break(auto=True, margin=15)

# Patient info
pdf.set_font("Helvetica", "B", 11)
pdf.cell(0, 7, "COMPTE RENDU D'ANALYSES BIOLOGIQUES", new_x="LMARGIN", new_y="NEXT")
pdf.ln(2)

pdf.set_font("Helvetica", "", 10)
info_left = [
    ("Patient :", "MARTIN Jean"),
    ("Date de naissance :", "14/03/1978  (48 ans)"),
    ("Sexe :", "Masculin"),
    ("N dossier :", "BIO-2025-04821"),
]
info_right = [
    ("Medecin prescripteur :", "Dr. Sophie BERNARD"),
    ("Date prelevement :", "17/05/2026  09h15"),
    ("Date resultats :", "18/05/2026"),
    ("Nature prelevement :", "Sang veineux"),
]
for (lbl, val), (lbl2, val2) in zip(info_left, info_right):
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(32, 6, lbl)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(63, 6, val)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(45, 6, lbl2)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, val2, new_x="LMARGIN", new_y="NEXT")

pdf.ln(3)
pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
pdf.ln(4)

COL = [72, 34, 50, 34]

def table_header():
    pdf.set_fill_color(220, 230, 242)
    pdf.set_font("Helvetica", "B", 10)
    headers = ["Analyse", "Resultat", "Intervalle de reference", "Statut"]
    for w, h in zip(COL, headers):
        pdf.cell(w, 7, h, border=1, fill=True, align="C")
    pdf.ln()

def table_row(analyse, resultat, intervalle, statut, flag=False):
    pdf.set_font("Helvetica", "B" if flag else "", 10)
    if flag:
        pdf.set_text_color(200, 0, 0)
    vals = [analyse, resultat, intervalle, statut]
    for w, v in zip(COL, vals):
        pdf.cell(w, 6, v, border=1)
    pdf.set_text_color(0, 0, 0)
    pdf.ln()

# Section 1: NFS
pdf.set_font("Helvetica", "B", 11)
pdf.cell(0, 7, "1. Numeration Formule Sanguine (NFS)", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
table_header()
table_row("Hemoglobine",           "10.8 g/dL",   "13.0 - 17.5 g/dL",     "Bas",    flag=True)
table_row("Hematocrite",           "32 %",        "40 - 52 %",             "Bas",    flag=True)
table_row("Globules rouges (GR)",  "3.9 T/L",     "4.5 - 5.9 T/L",        "Bas",    flag=True)
table_row("VGM",                   "82 fL",       "80 - 100 fL",           "Normal")
table_row("Leucocytes",            "7.2 G/L",     "4.0 - 10.0 G/L",       "Normal")
table_row("Plaquettes",            "412 G/L",     "150 - 400 G/L",         "Eleve",  flag=True)
pdf.ln(3)

# Section 2: Bilan glucidique
pdf.set_font("Helvetica", "B", 11)
pdf.cell(0, 7, "2. Bilan Glucidique", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
table_header()
table_row("Glycemie a jeun",       "6.8 mmol/L",  "3.9 - 5.5 mmol/L",     "Eleve",  flag=True)
table_row("HbA1c",                 "7.2 %",       "< 5.7 %",               "Eleve",  flag=True)
pdf.ln(3)

# Section 3: Bilan lipidique
pdf.set_font("Helvetica", "B", 11)
pdf.cell(0, 7, "3. Bilan Lipidique", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
table_header()
table_row("Cholesterol total",     "5.9 mmol/L",  "< 5.2 mmol/L",         "Eleve",  flag=True)
table_row("HDL-cholesterol",       "1.1 mmol/L",  ">= 1.0 mmol/L",        "Normal")
table_row("LDL-cholesterol",       "4.1 mmol/L",  "< 3.4 mmol/L",         "Eleve",  flag=True)
table_row("Triglycerides",         "1.8 mmol/L",  "< 1.7 mmol/L",         "Eleve",  flag=True)
pdf.ln(3)

# Section 4: Bilan renal
pdf.set_font("Helvetica", "B", 11)
pdf.cell(0, 7, "4. Bilan Renal", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
table_header()
table_row("Creatinine serique",    "98 umol/L",   "62 - 115 umol/L",      "Normal")
table_row("DFG estime (CKD-EPI)",  "72 mL/min",   ">= 60 mL/min",         "Normal")
table_row("Uree",                  "7.4 mmol/L",  "2.5 - 7.5 mmol/L",     "Normal")
pdf.ln(3)

# Section 5: Marqueurs inflammatoires
pdf.set_font("Helvetica", "B", 11)
pdf.cell(0, 7, "5. Marqueurs Inflammatoires", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
table_header()
table_row("CRP (Proteine C-Reactive)", "32 mg/L",  "< 5 mg/L",            "Eleve",  flag=True)
table_row("VS (1re heure)",            "38 mm/h",  "< 15 mm/h",            "Eleve",  flag=True)
pdf.ln(3)

# Commentaire biologiste
pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
pdf.ln(3)
pdf.set_font("Helvetica", "B", 10)
pdf.cell(0, 6, "Commentaire du biologiste :", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
commentaire = (
    "Ce bilan revele une anemie moderee (Hb 10.8 g/dL) associee a un syndrome inflammatoire "
    "biologique significatif (CRP 32 mg/L, VS 38 mm/h) suggerant une cause inflammatoire ou infectieuse. "
    "La glycemie a jeun et l'HbA1c sont compatibles avec un diabete de type 2 insuffisamment equilibre. "
    "Le bilan lipidique montre une hypercholesterolemie mixte a risque cardiovasculaire. "
    "Un suivi diabetologique et cardiologique est recommande. "
    "Merci de reevaluer dans 3 mois apres adaptation therapeutique."
)
pdf.multi_cell(0, 5, commentaire)
pdf.ln(5)

pdf.set_font("Helvetica", "BI", 10)
pdf.cell(0, 6, "Dr. Amara KONE - Biologiste medical - N RPPS 10012345678", align="R")

out = "/Users/louan/Documents/cours/lab-ia/ProjetLabTech/backend/scripts/bilan_test.pdf"
pdf.output(out)
print(f"PDF generated: {out}")
