import os
import re
import io
import base64
import uuid
import logging
import asyncio
import threading
from typing import Dict, Any, List, Tuple
from pathlib import Path

import cv2
import numpy as np
import easyocr
from PIL import Image
from dotenv import load_dotenv
from open_clip import create_model_from_pretrained, get_tokenizer

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger(__name__)


class ImageAnalysisService:
    UPLOADS_DIR = Path(__file__).parent.parent / "uploads" / "images"
    MODEL_ID = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"
    CONTEXT_LENGTH = 256

    LABELS: List[Tuple[str, str]] = [
        ("prescription_doc", "medical prescription document"),
        ("brain_mri", "brain MRI"),
        ("ct_scan", "brain CT scan"),
        ("bone_xray", "bone X-ray fracture"),
        ("chest_xray", "chest X-ray"),
        ("skin_condition", "skin rash condition"),
        ("wound_injury", "open wound injury"),
        ("burn_injury", "skin burn injury"),
        ("histopathology", "histopathology microscope slide"),
        ("chart_non_medical", "pie chart or line chart"),
        ("object_non_medical", "non-medical object photo"),
        ("scene_non_medical", "non-medical natural scene"),
    ]
    NON_MEDICAL = {"chart_non_medical", "object_non_medical", "scene_non_medical"}

    SAFETY_NOTE = (
        "Do NOT self-medicate if pregnant, kidney/liver disease, ulcer history, blood thinner use, "
        "or known drug allergy. Confirm with doctor/pharmacist."
    )

    CATEGORY_GUIDANCE = {
        "prescription_doc": {
            "detectedCondition": "Prescription/report document detected",
            "possibleCauses": ["Medical instruction document identified"],
            "recommendedCare": [
                "Verify extracted medicines with doctor/pharmacist",
                "Follow exact dosage and duration from prescription",
                "Avoid adding OTC medicines without interaction check",
            ],
            "homeRemedies": ["Use medication reminders", "Maintain hydration unless restricted"],
            "otcBySymptom": {"others": []},
            "whenToSeeDoctor": "Consult prescribing doctor for side effects/no improvement.",
        },
        "bone_xray": {
            "detectedCondition": "Bone X-ray detected (possible fracture context)",
            "possibleCauses": ["Bone/joint trauma pattern possible"],
            "recommendedCare": ["Immobilize area", "Avoid weight-bearing", "Orthopedic consultation"],
            "homeRemedies": ["RICE: Rest, Ice, Compression, Elevation"],
            "otcBySymptom": {"pain": ["Paracetamol", "Ibuprofen (if safe)"], "swelling": ["Topical anti-inflammatory gel"], "others": []},
            "whenToSeeDoctor": "Urgent doctor visit for severe pain, deformity, or movement loss.",
        },
        "brain_mri": {
            "detectedCondition": "Brain MRI scan detected (non-diagnostic)",
            "possibleCauses": ["Neurological imaging context detected"],
            "recommendedCare": ["Consult neurologist/radiologist with official report"],
            "homeRemedies": ["Rest and hydration till medical review"],
            "otcBySymptom": {"headache": ["Paracetamol (if suitable)"], "others": []},
            "whenToSeeDoctor": "Consult specialist with MRI report.",
        },
        "ct_scan": {
            "detectedCondition": "CT scan detected (non-diagnostic)",
            "possibleCauses": ["Internal diagnostic imaging context detected"],
            "recommendedCare": ["Consult specialist with CT report"],
            "homeRemedies": ["Follow physician advice"],
            "otcBySymptom": {"pain": ["Paracetamol (if suitable)"], "others": []},
            "whenToSeeDoctor": "Consult specialist promptly.",
        },
        "chest_xray": {
            "detectedCondition": "Chest X-ray detected (non-diagnostic)",
            "possibleCauses": ["Thoracic imaging context detected"],
            "recommendedCare": ["Consult doctor with chest X-ray report"],
            "homeRemedies": ["Rest, hydration"],
            "otcBySymptom": {"fever": ["Paracetamol"], "others": []},
            "whenToSeeDoctor": "Immediate care for breathing difficulty/chest pain.",
        },
        "skin_condition": {
            "detectedCondition": "Possible skin-related condition",
            "possibleCauses": ["Allergic/irritant/inflammatory skin pattern possible"],
            "recommendedCare": ["Keep area clean and dry", "Avoid scratching"],
            "homeRemedies": ["Cool compress", "Mild cleanser", "Avoid irritants"],
            "otcBySymptom": {"itching": ["Cetirizine", "Calamine lotion"], "others": []},
            "whenToSeeDoctor": "See dermatologist if worsening/spreading/persistent.",
        },
        "wound_injury": {
            "detectedCondition": "Possible wound/injury detected",
            "possibleCauses": ["Trauma or tissue injury pattern"],
            "recommendedCare": ["Clean wound", "Sterile dressing", "Monitor for infection"],
            "homeRemedies": ["Daily dressing", "RICE for swelling"],
            "otcBySymptom": {"pain": ["Paracetamol"], "woundCare": ["Povidone-iodine (minor wounds only)"], "others": []},
            "whenToSeeDoctor": "Immediate care if deep wound, bleeding, fever, severe pain.",
        },
        "burn_injury": {
            "detectedCondition": "Possible burn injury detected",
            "possibleCauses": ["Thermal/chemical irritation pattern possible"],
            "recommendedCare": ["Cool running water 10-20 mins", "No direct ice", "Cover with sterile dressing"],
            "homeRemedies": ["Keep burn clean and protected"],
            "otcBySymptom": {"pain": ["Paracetamol"], "others": []},
            "whenToSeeDoctor": "Urgent care for deep/large burns.",
        },
        "histopathology": {
            "detectedCondition": "Histopathology image detected (non-diagnostic)",
            "possibleCauses": ["Microscopy tissue slide image identified"],
            "recommendedCare": ["Consult pathology report and specialist"],
            "homeRemedies": [],
            "otcBySymptom": {"others": []},
            "whenToSeeDoctor": "Follow specialist guidance.",
        },
    }

    _model = None
    _preprocess = None
    _text_features = None
    _device = None
    _model_lock = threading.Lock()

    _ocr = None
    _ocr_lock = threading.Lock()

    def __init__(self):
        self.hf_token = os.environ.get("HF_TOKEN", "").strip()
        self.conf_threshold = float(os.environ.get("BIOMEDCLIP_CONFIDENCE_THRESHOLD", "0.35"))
        self.max_image_mb = int(os.environ.get("IMAGE_MAX_MB", "20"))
        self.min_image_bytes = int(os.environ.get("IMAGE_MIN_BYTES", "100"))
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

        if self.hf_token:
            os.environ["HF_TOKEN"] = self.hf_token
            os.environ["HUGGINGFACE_HUB_TOKEN"] = self.hf_token

        self._ensure_model_loaded()
        self._ensure_ocr_loaded()

    def _ensure_model_loaded(self):
        if self.__class__._model is not None:
            return
        with self.__class__._model_lock:
            if self.__class__._model is not None:
                return
            try:
                device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                model, preprocess = create_model_from_pretrained(self.MODEL_ID)
                tokenizer = get_tokenizer(self.MODEL_ID)

                prompts = [f"this is a medical image of {label}" for _, label in self.LABELS]
                with torch.no_grad():
                    toks = tokenizer(prompts, context_length=self.CONTEXT_LENGTH).to(device)
                    text_features = model.encode_text(toks)
                    text_features = text_features / text_features.norm(dim=-1, keepdim=True)

                model = model.to(device)
                model.eval()

                self.__class__._model = model
                self.__class__._preprocess = preprocess
                self.__class__._text_features = text_features
                self.__class__._device = device
                logger.info("BiomedCLIP loaded")
            except Exception as e:
                logger.error(f"BiomedCLIP load failed: {e}")
                self.__class__._model = None

    def _ensure_ocr_loaded(self):
        if self.__class__._ocr is not None:
            return
        with self.__class__._ocr_lock:
            if self.__class__._ocr is not None:
                return
            self.__class__._ocr = easyocr.Reader(["en"], gpu=torch.cuda.is_available())

    def _validate_image(self, base64_data: str) -> Tuple[bool, str]:
        try:
            clean = base64_data.split(",", 1)[1] if "," in base64_data else base64_data
            b = base64.b64decode(clean)
            if len(b) > self.max_image_mb * 1024 * 1024:
                return False, f"Image too large. Max {self.max_image_mb}MB"
            if len(b) < self.min_image_bytes:
                return False, "Image too small or corrupted"
            _ = Image.open(io.BytesIO(b))
            return True, ""
        except Exception as e:
            return False, f"Invalid image: {e}"

    async def save_image(self, base64_data: str) -> Tuple[str, int]:
        clean = base64_data.split(",", 1)[1] if "," in base64_data else base64_data
        image_bytes = base64.b64decode(clean)
        size = len(image_bytes)

        ext = "jpg"
        if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            ext = "png"
        elif image_bytes[:4] == b"RIFF":
            ext = "webp"

        name = f"{uuid.uuid4()}.{ext}"
        path = self.UPLOADS_DIR / name
        with open(path, "wb") as f:
            f.write(image_bytes)
        return f"/uploads/images/{name}", size

    def _predict(self, image_bytes: bytes) -> List[Tuple[str, str, float]]:
        if self.__class__._model is None:
            return []

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.__class__._preprocess(image).unsqueeze(0).to(self.__class__._device)

        with torch.no_grad():
            img_features = self.__class__._model.encode_image(tensor)
            img_features = img_features / img_features.norm(dim=-1, keepdim=True)
            probs = (100.0 * img_features @ self.__class__._text_features.T).softmax(dim=-1)[0]
            probs = probs.detach().cpu().tolist()

        out = []
        for i, p in enumerate(probs):
            key, label = self.LABELS[i]
            out.append((key, label, float(p)))
        out.sort(key=lambda x: x[2], reverse=True)
        return out

    def _extract_ocr_text(self, image_bytes: bytes) -> str:
        try:
            arr = np.frombuffer(image_bytes, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            variants = [gray]
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
            variants.append(cv2.adaptiveThreshold(clahe, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11))

            up = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
            variants.append(cv2.adaptiveThreshold(up, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 35, 15))

            texts = []
            for v in variants:
                lines = self.__class__._ocr.readtext(v, detail=0, paragraph=False)
                txt = "\n".join([x.strip() for x in lines if x and x.strip()])
                texts.append(txt)

            def score(t: str):
                k = ["tab", "tablet", "cap", "capsule", "mg", "ml", "od", "bd", "tds", "for", "days", "take", "took"]
                l = t.lower()
                return len(t) + sum(12 for x in k if x in l)

            return max(texts, key=score)[:12000] if texts else ""
        except Exception:
            return ""

    def _freq(self, dose: str) -> str:
        d = dose.upper().strip()
        m = {"OD": "Once daily", "BD": "Twice daily", "TDS": "Three times daily", "QID": "Four times daily", "HS": "At bedtime", "SOS": "As needed"}
        if d in m:
            return m[d]
        g = re.match(r"(\d)-(\d)-(\d)", d)
        if g:
            s = int(g.group(1)) + int(g.group(2)) + int(g.group(3))
            return {1: "Once daily", 2: "Twice daily", 3: "Three times daily"}.get(s, f"{s} times daily")
        return "As prescribed"

    def _parse_meds(self, text: str) -> List[Dict[str, Any]]:
        if not text.strip():
            return []
        lines = [x.strip() for x in re.split(r"[\n\r.;]+", text) if x.strip()]
        meds, seen = [], set()

        pat = re.compile(r"(tab|tablet|cap|capsule|syrup|syp|inj|mg|ml|mcg|od|bd|tds|qid|hs|sos|\d-\d-\d)", re.I)

        for line in lines:
            if len(line) < 4 or not pat.search(line):
                continue
            clean = " ".join(line.split())

            strength = (re.search(r"\b\d+\s?(mg|ml|mcg|g)\b", clean, re.I).group(0)
                        if re.search(r"\b\d+\s?(mg|ml|mcg|g)\b", clean, re.I) else "Not clearly detected")
            dose = (re.search(r"\b(\d-\d-\d|OD|BD|TDS|QID|HS|SOS)\b", clean, re.I).group(1).upper()
                    if re.search(r"\b(\d-\d-\d|OD|BD|TDS|QID|HS|SOS)\b", clean, re.I) else "Not clearly detected")
            duration = (lambda m: f"{m.group(1)} {m.group(2)}")(re.search(r"\b(?:x|for)?\s*(\d+)\s*(day|days|week|weeks|month|months)\b", clean, re.I)) \
                if re.search(r"\b(?:x|for)?\s*(\d+)\s*(day|days|week|weeks|month|months)\b", clean, re.I) else "Not clearly detected"
            timing = (re.search(r"(before food|after food|with food|empty stomach|morning|afternoon|night|bedtime)", clean, re.I).group(1).lower()
                      if re.search(r"(before food|after food|with food|empty stomach|morning|afternoon|night|bedtime)", clean, re.I) else "Not clearly detected")

            med = clean
            med = re.sub(r"\b(take|took|tab|tablet|cap|capsule|syrup|syp|inj)\b\.?", "", med, flags=re.I)
            med = re.sub(r"\b\d+\s?(mg|ml|mcg|g)\b", "", med, flags=re.I)
            med = re.sub(r"\b(\d-\d-\d|OD|BD|TDS|QID|HS|SOS)\b", "", med, flags=re.I)
            med = re.sub(r"\b(?:x|for)?\s*\d+\s*(day|days|week|weeks|month|months)\b", "", med, flags=re.I)
            med = re.sub(r"(before food|after food|with food|empty stomach|morning|afternoon|night|bedtime)", "", med, flags=re.I)
            med = re.sub(r"\s+", " ", med).strip(" -:,.")
            if len(med) < 2:
                med = "Unclear medicine name"

            row = {
                "medicine": med,
                "strength": strength,
                "dosagePattern": dose,
                "frequency": self._freq(dose) if dose != "Not clearly detected" else "As prescribed",
                "timing": timing,
                "duration": duration,
                "instructions": clean,
            }

            key = (row["medicine"].lower(), row["strength"], row["dosagePattern"], row["timing"], row["duration"])
            if key in seen:
                continue
            seen.add(key)
            meds.append(row)

        return meds[:30]

    def _clinical_notes(self, text: str) -> List[str]:
        lines = [x.strip() for x in text.splitlines() if x.strip()]
        out = []
        keys = ["c/o", "h/o", "no h/o", "o/e", "ulcer", "swelling", "fever", "pus", "discharge", "pain", "difficulty"]
        for ln in lines:
            ll = ln.lower()
            if any(k in ll for k in keys):
                out.append(ln)
        return out[:15]

    def _is_prescription_like(self, text: str, meds: List[Dict[str, Any]]) -> bool:
        if meds:
            return True
        t = text.lower()
        keys = ["tab", "tablet", "cap", "capsule", "mg", "ml", "od", "bd", "tds", "for", "days", "rx", "take", "took"]
        return sum(1 for k in keys if k in t) >= 2

    def _flat_otc(self, otc_by: Dict[str, List[str]]) -> List[str]:
        out, seen = [], set()
        for arr in otc_by.values():
            for x in arr:
                if x not in seen:
                    out.append(x)
                    seen.add(x)
        return out[:12]

    def _missing(self, meds: List[Dict[str, Any]]) -> List[str]:
        out = []
        for i, m in enumerate(meds, 1):
            if m["dosagePattern"] == "Not clearly detected":
                out.append(f"Medicine {i}: dosage pattern missing")
            if m["timing"] == "Not clearly detected":
                out.append(f"Medicine {i}: timing missing")
            if m["duration"] == "Not clearly detected":
                out.append(f"Medicine {i}: duration missing")
        return out

    def _questions(self, category: str, has_med_plan: bool) -> Dict[str, Any]:
        common = [
            {"id": "age", "question": "What is patient age?", "type": "number", "required": True},
            {"id": "sex", "question": "What is patient sex?", "type": "select", "options": ["Male", "Female", "Other"], "required": True},
            {"id": "allergy", "question": "Any known drug allergy?", "type": "text", "required": True},
            {"id": "comorbidity", "question": "Any diabetes/BP/kidney/liver disease?", "type": "text", "required": True},
        ]
        extra = {
            "prescription_doc": [
                {"id": "doctor_confirm", "question": "Did doctor/pharmacist confirm extracted dosage?", "type": "select", "options": ["Yes", "No"], "required": True},
                {"id": "pregnancy", "question": "Is patient pregnant?", "type": "select", "options": ["Yes", "No", "Not applicable"], "required": False},
            ],
            "bone_xray": [
                {"id": "trauma", "question": "Any recent trauma/fall?", "type": "select", "options": ["Yes", "No"], "required": True},
                {"id": "pain_score", "question": "Pain score (0-10)?", "type": "number", "required": True},
            ],
            "skin_condition": [
                {"id": "itching", "question": "Is itching present?", "type": "select", "options": ["Yes", "No"], "required": True},
                {"id": "spread", "question": "Is rash spreading?", "type": "select", "options": ["Yes", "No"], "required": True},
            ],
            "wound_injury": [
                {"id": "bleeding", "question": "Active bleeding now?", "type": "select", "options": ["Yes", "No"], "required": True},
                {"id": "fever", "question": "Any fever?", "type": "select", "options": ["Yes", "No"], "required": True},
            ],
        }

        return {
            "followUpQuestions": common + extra.get(category, []),
            "displaySections": {
                "showMedicationPlan": category == "prescription_doc",
                "showHomeRemedies": True,
                "showOTCBySymptom": True,
                "showRedFlags": True,
                "showDoctorCard": True,
                "showClinicalNotes": True,
                "showFollowUpQuestions": True,
            },
            "needsManualMedicationEntry": category == "prescription_doc" and not has_med_plan,
            "manualMedicationEntryTemplate": {
                "medicine": "",
                "strength": "",
                "dosagePattern": "",
                "frequency": "",
                "timing": "",
                "duration": "",
                "instructions": "",
            },
        }

    def _severity(self, category: str, conf: float) -> Tuple[str, bool]:
        if category in {"wound_injury", "burn_injury", "bone_xray"} and conf >= 0.60:
            return "Severe", True
        if conf >= 0.50:
            return "Moderate", False
        return "Mild", False

    def _fallback(self) -> Dict[str, Any]:
        return {
            "detectedCondition": "Analysis Unavailable",
            "severityLevel": "Moderate",
            "confidenceScore": 0,
            "visualFindings": "Image analysis service temporarily unavailable.",
            "possibleCauses": [],
            "recommendedCare": ["Consult healthcare professional for proper evaluation."],
            "homeRemedies": [],
            "immediateSteps": [],
            "otcBySymptom": {"others": []},
            "otcSuggestions": [],
            "redFlags": ["Worsening symptoms", "Severe pain", "Breathing trouble", "Uncontrolled bleeding"],
            "safetyNote": self.SAFETY_NOTE,
            "whenToSeeDoctor": "Please schedule doctor consultation.",
            "emergency": False,
            "prescriptionText": "",
            "medicationPlan": [],
            "prescriptionSummary": "Not available",
            "clinicalNotes": [],
            "missingInformation": [],
            "nextActionChecklist": ["Retry with clearer image", "Consult doctor directly"],
            "followUpQuestions": [],
            "displaySections": {},
            "needsManualMedicationEntry": False,
            "manualMedicationEntryTemplate": {},
            "disclaimer": "This image analysis is AI-assisted and not a medical diagnosis.",
        }

    async def analyze_image(self, base64_data: str) -> Dict[str, Any]:
        valid, err = self._validate_image(base64_data)
        if not valid:
            raise ValueError(err)

        try:
            clean = base64_data.split(",", 1)[1] if "," in base64_data else base64_data
            image_bytes = base64.b64decode(clean)

            preds = await asyncio.to_thread(self._predict, image_bytes)
            ocr_text = await asyncio.to_thread(self._extract_ocr_text, image_bytes)
            meds = self._parse_meds(ocr_text)
            notes = self._clinical_notes(ocr_text)
            is_prescription = self._is_prescription_like(ocr_text, meds)

            if preds:
                top_key, top_label, top_conf = preds[0]
            else:
                top_key, top_label, top_conf = "skin_condition", "skin rash condition", 0.40

            if is_prescription:
                top_key, top_label, top_conf = "prescription_doc", "medical prescription document", max(top_conf, 0.75)

            if top_key in self.NON_MEDICAL and not is_prescription:
                top = ", ".join([f"{lb} ({round(sc*100,1)}%)" for _, lb, sc in preds[:5]]) if preds else "N/A"
                r = {
                    "detectedCondition": "Non-medical image",
                    "severityLevel": "Mild",
                    "confidenceScore": 95,
                    "visualFindings": f"Model predicts non-medical content. Top predictions: {top}",
                    "possibleCauses": [],
                    "recommendedCare": ["Upload a medical image (MRI/X-ray/prescription/skin/wound)."],
                    "homeRemedies": [],
                    "immediateSteps": [],
                    "otcBySymptom": {"others": []},
                    "otcSuggestions": [],
                    "redFlags": [],
                    "safetyNote": self.SAFETY_NOTE,
                    "whenToSeeDoctor": "If symptoms exist, consult healthcare professional.",
                    "emergency": False,
                    "prescriptionText": "",
                    "medicationPlan": [],
                    "prescriptionSummary": "No prescription detected",
                    "clinicalNotes": [],
                    "missingInformation": [],
                    "nextActionChecklist": ["Upload a clearer medical image"],
                    "disclaimer": "This image analysis is AI-assisted and not a medical diagnosis.",
                }
                r.update(self._questions("skin_condition", False))
                return r

            guide = self.CATEGORY_GUIDANCE.get(top_key, self.CATEGORY_GUIDANCE["skin_condition"])
            severity, emergency = self._severity(top_key, top_conf)
            top = ", ".join([f"{lb} ({round(sc*100,1)}%)" for _, lb, sc in preds[:5]]) if preds else f"{top_label} ({round(top_conf*100,1)}%)"

            otc_by = guide.get("otcBySymptom", {"others": []})
            rec = list(guide.get("recommendedCare", []))
            home = list(guide.get("homeRemedies", []))

            if emergency:
                otc_by = {k: [] for k in otc_by.keys()}
                rec = ["Seek urgent medical care immediately."]
                home = ["Do not delay treatment in severe cases."]

            response = {
                "detectedCondition": guide.get("detectedCondition", "Medical image detected"),
                "severityLevel": severity,
                "confidenceScore": int(round(top_conf * 100)),
                "visualFindings": f"Top model predictions: {top}",
                "possibleCauses": guide.get("possibleCauses", []),
                "recommendedCare": rec,
                "homeRemedies": home,
                "immediateSteps": rec[:2] if rec else [],
                "otcBySymptom": otc_by,
                "otcSuggestions": self._flat_otc(otc_by),
                "redFlags": ["High fever", "Rapid worsening", "Severe pain", "Breathing difficulty", "Uncontrolled bleeding"],
                "safetyNote": self.SAFETY_NOTE,
                "whenToSeeDoctor": guide.get("whenToSeeDoctor", "Consult healthcare professional."),
                "emergency": emergency,
                "prescriptionText": ocr_text if is_prescription else "",
                "medicationPlan": meds if is_prescription else [],
                "prescriptionSummary": (
                    f"{len(meds)} medicine entries extracted."
                    if is_prescription and meds
                    else ("Prescription-like text detected, but medicine lines unclear." if is_prescription else "No prescription extraction performed")
                ),
                "clinicalNotes": notes if is_prescription else [],
                "missingInformation": self._missing(meds) if is_prescription else [],
                "nextActionChecklist": [
                    "Verify extracted data with doctor/pharmacist",
                    "Do not change medications without professional advice",
                    "Seek urgent care if red flags appear",
                ],
                "disclaimer": "This image analysis is AI-assisted and not a medical diagnosis.",
            }

            response.update(self._questions(top_key, len(meds) > 0))
            return response

        except Exception as e:
            logger.exception(f"analysis failed: {e}")
            return self._fallback()