import fitz, os, re, json
from PIL import Image, ImageDraw, ImageFont
import pandas as pd

# Caminhos principais
PDF_PATH = "2024_PV_impresso_D1_CD1.pdf"
OUT_DIR = "output"
IMG_DIR = os.path.join(OUT_DIR, "images")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)

def span_to_text(span):
    if "text" in span:
        return span["text"]
    if "chars" in span:
        return "".join(ch.get("c","") for ch in span["chars"])
    return ""

def normalize_spaces(s):
    return re.sub(r"\s+", " ", s).strip()

def classify_theme(text):
    t = text.lower()
    rules = [
        (r"parintins|caprichoso|garantido|bumb[oó]dromo", "Cultura popular (Parintins)"),
        (r"câncer de mama|oncolog", "Saúde (câncer de mama)"),
        (r"feijoada|vinicius de moraes|poema|poesia", "Literatura / Poema"),
        (r"amazon[eê]s|manauara|caboco|express[oõ]es|falares", "Variação linguística regional"),
        (r"paral[ií]mpic|parapan|lan[cç]amento de disco|tiro com arco", "Esporte e Inclusão (paralímpico)"),
        (r"cavaquinho|ukulele|machete|cord[oó]fono", "Música e Instrumentos"),
        (r"memes?|fake news|whatsapp|m[ií]dia social|checagem", "Mídias sociais / Letramento midiático"),
        (r"jogos ol[ií]mpicos|break dance|skate|surfe|bmx", "Esporte / Programa olímpico"),
        (r"fotografia|pinhole|exposi[cç][aã]o|telesc[oó]pio", "Arte / Fotografia"),
        (r"linklado|diacr[ií]ticos|l[ií]nguas ind[ií]genas", "Tecnologia linguística / Línguas indígenas"),
        (r"doa[cç][aã]o|campanha de inverno|defesa civil", "Campanha social / Doação"),
        (r"mar[ií]lia acorda|decl[ií]nio f[ií]sico", "Prosa contemporânea / Dramaticidade"),
        (r"borderlands|speak english|sotaque|accent|anglo", "Questão de língua estrangeira (inglês)"),
        (r"¿|¡|sevilla|gallegos|andaluzes|tlatelolco|tenochtit", "Questão de língua estrangeira (espanhol)"),
        (r"cancelaci[oó]n", "Debate contemporâneo (cultura do cancelamento)"),
        (r"holy war", "Letra de canção (inglês)"),
    ]
    for pat, label in rules:
        if re.search(pat, t):
            return label
    return "Interpretação de texto"

def draw_id_on_image(pil_img, ref):
    img = pil_img.convert("RGBA")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/Library/Fonts/Arial.ttf", 28)
    except:
        font = ImageFont.load_default()
    padding = 10
    text = ref
    bbox = draw.textbbox((0,0), text, font=font)
    w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
    rect = (padding-4, padding-4, padding + w + 4, padding + h + 4)
    draw.rectangle(rect, fill=(0,0,0,180))
    draw.text((padding, padding), text, font=font, fill=(255,255,255,255))
    return img.convert("RGB")

def extract_images_with_boxes(page, zoom=2.0):
    items = []
    raw = page.get_text("rawdict")
    for block in raw["blocks"]:
        if block["type"] == 1:
            bbox = fitz.Rect(block["bbox"])
            mat = fitz.Matrix(zoom, zoom)
            try:
                pix = page.get_pixmap(matrix=mat, clip=bbox)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            except Exception:
                img = None
            items.append({"bbox": tuple(bbox), "image": img})
    return items

q_header_re = re.compile(r"^QUEST(Ã|A)O\s+(\d{1,2})\b", re.IGNORECASE)
doc = fitz.open(PDF_PATH)
questions = []

for page_idx, page in enumerate(doc, start=1):
    height = page.rect.height
    raw = page.get_text("rawdict")
    lines = []
    for block in raw["blocks"]:
        if block["type"] == 0:
            for line in block["lines"]:
                text = "".join(span_to_text(span) for span in line["spans"])
                if text.strip():
                    y0 = min(line["bbox"][1], line["bbox"][3])
                    y1 = max(line["bbox"][1], line["bbox"][3])
                    x0 = min(line["bbox"][0], line["bbox"][2])
                    x1 = max(line["bbox"][0], line["bbox"][2])
                    lines.append({"text": text, "y0": y0, "y1": y1, "x0": x0, "x1": x1})
    lines.sort(key=lambda x: (x["y0"], x["x0"]))
    headers = []
    for i, L in enumerate(lines):
        if q_header_re.search(L["text"].strip()):
            qnum = int(q_header_re.search(L["text"].strip()).group(2))
            headers.append((i, qnum, L["y0"]))
    for idx, (i, qnum, y_start) in enumerate(headers):
        y_end = height if idx+1 == len(headers) else headers[idx+1][2] - 1
        qid = f"ENEM2024_LC_Q{qnum:03d}"
        segs, imgs = [], extract_images_with_boxes(page)
        for L in lines:
            if y_start <= L["y0"] <= y_end:
                segs.append({"type":"text","y":(L["y0"]+L["y1"])/2,"text":normalize_spaces(L["text"])})
        imgs_in_region = []
        for im in imgs:
            y_mid = (im["bbox"][1]+im["bbox"][3])/2.0
            if y_start <= y_mid <= y_end:
                imgs_in_region.append({"type":"image","y":y_mid,"bbox":im["bbox"],"pil":im["image"]})
        merged = sorted(segs + imgs_in_region, key=lambda e:e["y"])
        content, img_refs, img_counter, pending_text = [], [], 0, []
        for item in merged:
            if item["type"]=="text":
                pending_text.append(item["text"])
            else:
                if pending_text:
                    content.append({"type":"text","value":normalize_spaces(" ".join(pending_text))})
                    pending_text=[]
                img_counter+=1
                ref=f"{qid}_IMG{img_counter:02d}"
                img_refs.append((ref,item))
                content.append({"type":"image","ref":ref})
        if pending_text:
            content.append({"type":"text","value":normalize_spaces(" ".join(pending_text))})
        saved_imgs=[]
        for ref,item in img_refs:
            if item["pil"] is None:
                continue
            stamped=draw_id_on_image(item["pil"],ref)
            fname=f"{ref}.png"
            fpath=os.path.join(IMG_DIR,fname)
            stamped.save(fpath,format="PNG")
            saved_imgs.append({"ref":ref,"path":fpath,"bbox":[float(x) for x in item["bbox"]]})
        full_text=" ".join([b["value"] for b in content if b["type"]=="text"])
        questions.append({
            "id":qid,"page":page_idx,"number":qnum,"theme":classify_theme(full_text),
            "content":content,"images":saved_imgs,"text_full":full_text
        })

questions=sorted(questions,key=lambda q:(q["number"],q["page"]))
json_path=os.path.join(OUT_DIR,"enem2024_lc_questions_content.json")
sql_path=os.path.join(OUT_DIR,"enem2024_import.sql")

with open(json_path,"w",encoding="utf-8") as f:
    json.dump({"source_pdf":PDF_PATH,"questions":questions},f,ensure_ascii=False,indent=2)

# SQL simplificado
with open(sql_path,"w",encoding="utf-8") as f:
    f.write("-- ENEM 2024 Extract\n")
    f.write("CREATE TABLE IF NOT EXISTS questions (id TEXT, number INTEGER, page INTEGER, theme TEXT, text_full TEXT);\n")
    for q in questions:
        val=q['text_full'].replace("'","''")
        f.write(f"INSERT INTO questions VALUES ('{q['id']}',{q['number']},{q['page']},'{q['theme']}','{val}');\n")

print(f"✅ Extração concluída!\nJSON: {json_path}\nSQL: {sql_path}\nImagens: {IMG_DIR}")
