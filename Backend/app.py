from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import mysql.connector
from groq import Groq
from flask import session
import bcrypt
import jwt
import datetime
from datetime import timezone
import os
import random
import secrets
from functools import wraps
from email_validator import validate_email, EmailNotValidError
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ─── XGBoost / AI imports ───────────────────────────────────
import pickle
import joblib
import json
import numpy as np
import pandas as pd

# ─── DenseNet121 (Keras) imports ────────────────────────────
import os
os.environ["KERAS_BACKEND"] = "tensorflow"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import keras
import tensorflow as tf
import cv2
import base64
from io import BytesIO
from PIL import Image

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", secrets.token_hex(32))

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------- DB ----------------
def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# ---------------- CONFIG ----------------
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app.config.update({
    'MAIL_SERVER': 'smtp.gmail.com',
    'MAIL_PORT': 587,
    'MAIL_USE_TLS': True,
    'MAIL_USERNAME': os.getenv("EMAIL_USER"),
    'MAIL_PASSWORD': os.getenv("EMAIL_PASS"),
    'MAIL_DEFAULT_SENDER': os.getenv("EMAIL_USER")
})

mail = Mail(app)
limiter = Limiter(get_remote_address, app=app)
CORS(app, supports_credentials=True)

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

# ═══════════════════════════════════════════════════════════════
#  XGBOOST v5 MODEL  (unchanged)
# ═══════════════════════════════════════════════════════════════
_BASE = os.path.join(os.path.dirname(__file__), "models")

try:
    XGB_MODEL     = joblib.load(os.path.join(_BASE, "xgboost_6disease_v5.pkl"))
    LABEL_ENCODER = joblib.load(os.path.join(_BASE, "label_encoder_v5.pkl"))

    with open(os.path.join(_BASE, "feature_list_v5.json")) as f:
        ALL_FEATURES = json.load(f)

    with open(os.path.join(_BASE, "frontend_mapping_v5.json")) as f:
        _mapping = json.load(f)

    print(f"✅ XGBoost loaded — {len(ALL_FEATURES)} features")

except FileNotFoundError as e:
    print(f"❌ XGBoost model missing: {e}")
    raise

SMOKING_MAP  = _mapping["SMOKING_MAP"]
DURATION_MAP = _mapping["DURATION_MAP"]
DISEASES     = _mapping["DISEASES"]

# ═══════════════════════════════════════════════════════════════
#  DENSENET121 — Keras X-ray model (3-class)
# ═══════════════════════════════════════════════════════════════

XRAY_CLASS_NAMES = ["Normal", "Pneumonia", "Tuberculosis"]   # ← EDIT THIS

_DENSENET_PATH = _BASE

XRAY_MODEL   = None
XRAY_CLASSES = XRAY_CLASS_NAMES

try:
    XRAY_MODEL = keras.models.load_model(_DENSENET_PATH, compile=False)
    XRAY_MODEL.trainable = False
    print(f"✅ DenseNet121 loaded — {len(XRAY_CLASSES)} classes: {XRAY_CLASSES}")
    print(f"   Input : {XRAY_MODEL.input_shape}")
    print(f"   Output: {XRAY_MODEL.output_shape}")

except FileNotFoundError:
    print(f"❌ DenseNet121 model folder missing: {_DENSENET_PATH}")
except Exception as e:
    print(f"❌ DenseNet121 load error: {e}")


# ── DenseNet121 preprocessing ────────────────────────────────
def preprocess_xray_image(pil_img: Image.Image) -> np.ndarray:
    img = pil_img.convert("RGB").resize((224, 224), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    arr = arr / 127.5 - 1.0
    return np.expand_dims(arr, axis=0)


# ── GradCAM for Keras functional model ───────────────────────
class DenseNetGradCAM:
    def __init__(self, model: keras.Model):
        self.model = model
        self.target_layer = None
        for layer in reversed(model.layers):
            if isinstance(layer, keras.layers.Conv2D):
                self.target_layer = layer
                break
        if self.target_layer is None:
            print("⚠️  GradCAM: no Conv2D layer found — GradCAM disabled")
        else:
            print(f"✅ GradCAM targeting layer: {self.target_layer.name}")

    def _build_grad_model(self):
        return keras.Model(
            inputs=self.model.inputs,
            outputs=[self.target_layer.output, self.model.output]
        )

    def generate(self, preprocessed: np.ndarray, class_idx: int) -> np.ndarray:
        if self.target_layer is None:
            return np.ones((224, 224), dtype=np.float32)

        grad_model = self._build_grad_model()

        with tf.GradientTape() as tape:
            inputs  = tf.cast(preprocessed, tf.float32)
            conv_out, preds = grad_model(inputs)
            loss = preds[:, class_idx]

        grads = tape.gradient(loss, conv_out)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        conv_out  = conv_out[0]
        cam       = conv_out @ pooled_grads[..., tf.newaxis]
        cam       = tf.squeeze(cam).numpy()
        cam       = np.maximum(cam, 0)

        cam = cv2.resize(cam.astype(np.float32), (224, 224))
        mn, mx = cam.min(), cam.max()
        cam = (cam - mn) / (mx - mn + 1e-8)
        return cam

    def overlay_b64(self, pil_img: Image.Image, cam: np.ndarray) -> str:
        orig = pil_img.convert("RGB").resize((224, 224), Image.LANCZOS)
        orig_arr = np.array(orig, dtype=np.uint8)

        hm  = cv2.applyColorMap((cam * 255).astype(np.uint8), cv2.COLORMAP_JET)
        hm  = cv2.cvtColor(hm, cv2.COLOR_BGR2RGB)
        ov  = cv2.addWeighted(orig_arr, 0.55, hm, 0.45, 0)

        buf = BytesIO()
        Image.fromarray(ov).save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        return f"data:image/png;base64,{b64}"


if XRAY_MODEL is not None:
    GRADCAM = DenseNetGradCAM(XRAY_MODEL)
else:
    GRADCAM = None


# ── X-ray disease recommendations ────────────────────────────
XRAY_DISEASE_RECS = {
    "Normal": [
        "No significant findings detected on this X-ray",
        "Continue regular health check-ups as advised",
        "Maintain a healthy lifestyle and balanced diet",
        "Report any new or worsening symptoms to your doctor",
    ],
    "Pneumonia": [
        "Consult a doctor immediately for antibiotic treatment",
        "Rest adequately and stay well hydrated",
        "Monitor oxygen saturation with a pulse oximeter",
        "Seek emergency care if breathing worsens significantly",
        "Complete the full antibiotic course as prescribed",
        "Follow up with chest X-ray after treatment completion",
    ],
    "Tuberculosis": [
        "Visit a government TB centre or specialist immediately",
        "Begin DOTS (Directly Observed Treatment) as prescribed",
        "Wear a mask — TB is airborne and contagious",
        "Maintain adequate nutrition and rest throughout treatment",
        "Complete the full 6-month course without stopping",
        "Isolate from vulnerable family members during treatment",
    ],
    "Lung_Cancer": [
        "Seek urgent specialist consultation — early detection is critical",
        "Schedule CT scan, PET scan, and biopsy as advised",
        "Quit smoking immediately to slow disease progression",
        "Discuss treatment options: surgery, chemo, radiation",
        "Enrol in a patient support group for emotional wellbeing",
        "Ensure regular follow-ups with your oncologist",
    ],
    "Fibrosis": [
        "Consult a pulmonologist urgently for HRCT chest scan",
        "Avoid all dust, smoke, and occupational lung irritants",
        "Oxygen therapy may be required — discuss with your doctor",
        "Anti-fibrotic medications may slow progression",
        "Enrol in a pulmonary rehabilitation programme",
        "Consider lung transplant evaluation in advanced cases",
    ],
    "Effusion": [
        "Consult a doctor immediately for further evaluation",
        "Thoracentesis may be required to drain the fluid",
        "Investigate underlying cause — infection, cancer, heart failure",
        "Monitor breathing closely and seek emergency care if worsens",
        "Follow up with repeat imaging as advised",
        "Rest and avoid strenuous activity",
    ],
    "Atelectasis": [
        "Consult a pulmonologist for evaluation",
        "Deep breathing exercises and incentive spirometry may help",
        "Investigate underlying cause — obstruction, surgery, or compression",
        "Bronchoscopy may be required if obstruction is suspected",
        "Physiotherapy and chest percussion may be recommended",
        "Follow up with repeat X-ray after treatment",
    ],
    "Emphysema": [
        "Stop smoking immediately — most critical intervention",
        "Consult a pulmonologist for lung function tests (spirometry)",
        "Bronchodilator inhalers are the main treatment",
        "Pulmonary rehabilitation significantly improves quality of life",
        "Supplemental oxygen may be needed in advanced cases",
        "Annual influenza and pneumococcal vaccinations are essential",
    ],
    "Pneumothorax": [
        "Seek EMERGENCY care immediately if breathing is severely impaired",
        "Small pneumothorax may resolve on its own with monitoring",
        "Large pneumothorax requires needle aspiration or chest drain",
        "Avoid air travel and diving until fully resolved",
        "Follow up with repeat X-ray to confirm resolution",
        "Surgical intervention (pleurodesis) may prevent recurrence",
    ],
    "COVID-19": [
        "Isolate immediately to prevent spreading infection",
        "Monitor oxygen saturation with a pulse oximeter",
        "Stay well hydrated and get adequate rest",
        "Seek emergency care if breathlessness worsens severely",
        "Follow local health authority guidelines for quarantine",
        "Get vaccinated / boosted as soon as eligible",
    ],
    "Viral Pneumonia": [
        "Consult a doctor immediately — viral pneumonia needs prompt care",
        "Rest adequately and maintain good hydration",
        "Monitor oxygen saturation closely",
        "Antiviral therapy may be prescribed in some cases",
        "Seek emergency care if breathlessness worsens",
        "Follow up with repeat X-ray after recovery",
    ],
}

XRAY_DEFAULT_RECS = [
    "Consult a qualified physician with this X-ray result",
    "Do not self-medicate based on AI output alone",
    "Follow up with appropriate diagnostic tests",
    "Maintain a healthy lifestyle and monitor your symptoms",
]


# ── X-ray risk label ──────────────────────────────────────────
def xray_risk_label(pred_class: str, confidence_pct: float) -> str:
    emergency_classes = ["Pneumothorax", "Effusion"]
    high_classes      = ["Lung_Cancer", "Tuberculosis",
                         "Pneumonia", "Fibrosis", "COVID-19", "Viral Pneumonia"]
    moderate_classes  = ["Emphysema", "Atelectasis"]

    if pred_class in emergency_classes and confidence_pct >= 70:
        return "Critical"
    if pred_class in high_classes and confidence_pct >= 60:
        return "High"
    if pred_class in moderate_classes:
        return "Moderate"
    if pred_class == "Normal":
        return "Low"
    return "Moderate"


# ═══════════════════════════════════════════════════════════════
#  DISEASE RECOMMENDATIONS (XGBoost)  — unchanged
# ═══════════════════════════════════════════════════════════════
DISEASE_RECS = {
    "Covid-19": [
        "Isolate immediately to prevent spreading infection",
        "Monitor oxygen saturation with a pulse oximeter",
        "Stay well hydrated and get adequate rest",
        "Seek emergency care if breathlessness worsens severely",
        "Follow local health authority guidelines for quarantine",
        "Get vaccinated / boosted as soon as eligible",
    ],
    "Pulmonary Fibrosis": [
        "Consult a pulmonologist urgently for HRCT chest scan",
        "Avoid all dust, smoke, and occupational lung irritants",
        "Oxygen therapy may be required — discuss with your doctor",
        "Anti-fibrotic medications (nintedanib / pirfenidone) may slow progression",
        "Enrol in a pulmonary rehabilitation programme",
        "Consider lung transplant evaluation in advanced cases",
    ],
    "Pulmonary Embolism": [
        "Seek EMERGENCY care immediately — PE can be life-threatening",
        "Do NOT drive yourself — call an ambulance or get urgent help",
        "CT pulmonary angiography (CTPA) is required for diagnosis",
        "Anticoagulation (blood thinners) is the primary treatment",
        "Avoid prolonged immobility during recovery",
        "Compression stockings help prevent recurrence (DVT prevention)",
    ],
    "Tuberculosis": [
        "Visit a government TB centre or specialist immediately",
        "Begin DOTS (Directly Observed Treatment) as prescribed",
        "Wear a mask — TB is airborne and contagious",
        "Maintain adequate nutrition and rest throughout treatment",
        "Avoid alcohol and smoking during the full treatment course",
        "Complete the full 6-month course without stopping — critical",
    ],
    "Asthma": [
        "Consult a pulmonologist and get allergy / spirometry testing",
        "Use prescribed reliever and preventer inhalers correctly",
        "Identify and strictly avoid your personal asthma triggers",
        "Keep a symptom diary to track attack patterns and triggers",
        "Ensure good indoor air quality — dust, mould, pet dander",
        "Have a written asthma action plan ready for emergencies",
    ],
    "Lung Cancer": [
        "Seek urgent specialist consultation — early detection is critical",
        "Schedule CT scan, PET scan, and biopsy as advised immediately",
        "Quit smoking immediately to slow disease progression",
        "Discuss treatment options: surgery, chemo, radiation, immunotherapy",
        "Enrol in a patient support group for emotional wellbeing",
        "Ensure regular follow-ups with your oncologist without delay",
    ],
}

DEFAULT_RECS = [
    "Consult a qualified physician with this result",
    "Do not self-medicate based on AI output alone",
    "Follow up with appropriate diagnostic tests",
    "Maintain a healthy lifestyle and monitor your symptoms",
]

SMOKING_LABEL = {
    "non_smoker": "Non-Smoker",
    "former":     "Former Smoker",
    "occasional": "Occasional Smoker",
    "regular":    "Regular Smoker",
    "heavy":      "Heavy Smoker",
}

DURATION_LABEL = {
    "1_3_days": "1–3 Days",
    "1_week":   "~1 Week",
    "1_month":  "~1 Month",
    "3_months": "3+ Months",
}

SEVERITY_LABEL_MAP = {
    "covid19": [
        "None", "Dry cough only",
        "Fever + dry cough",
        "Fever + cough + breathlessness",
    ],
    "pulmonary_fibrosis": [
        "None", "Dry cough (no mucus)",
        "Dry cough + breathlessness on exertion",
        "Progressive breathlessness at rest",
    ],
    "pulmonary_embolism": [
        "None", "Mild chest pain",
        "Sudden breathlessness + chest pain",
        "Severe breathlessness at rest (minutes onset)",
    ],
    "tuberculosis": [
        "None", "Cough < 3 weeks",
        "Cough 3+ weeks + night sweats",
        "Cough + night sweats + weight loss + blood",
    ],
    "asthma": [
        "None", "Occasional wheeze (trigger-driven)",
        "Frequent episodic wheeze + chest tightness",
        "Severe attack — breathlessness at rest",
    ],
    "lung_cancer": [
        "None", "Persistent new cough",
        "Cough + blood streaks + hoarseness",
        "Haemoptysis + weight loss + severe breathlessness",
    ],
}

DISEASE_DISPLAY = {
    "covid19":            "Covid-19",
    "pulmonary_fibrosis": "Pulmonary Fibrosis",
    "pulmonary_embolism": "Pulmonary Embolism",
    "tuberculosis":       "Tuberculosis",
    "asthma":             "Asthma",
    "lung_cancer":        "Lung Cancer",
}

# ═══════════════════════════════════════════════════════════════
#  CLINICAL RISK ENGINE  — unchanged
# ═══════════════════════════════════════════════════════════════
def calculate_risk(predicted_disease, severity,
                   adv_answers, smoking, duration):
    covid_sev    = int(severity.get("covid19",            0))
    fibrosis_sev = int(severity.get("pulmonary_fibrosis", 0))
    pe_sev       = int(severity.get("pulmonary_embolism", 0))
    tb_sev       = int(severity.get("tuberculosis",       0))
    asthma_sev   = int(severity.get("asthma",             0))
    cancer_sev   = int(severity.get("lung_cancer",        0))
    smoking_level = SMOKING_MAP.get(smoking, 0)

    if predicted_disease == "Covid-19":
        if covid_sev >= 3:   return "High"
        elif covid_sev >= 2: return "Moderate"
        return "Low"

    elif predicted_disease == "Asthma":
        if asthma_sev >= 3:   return "High"
        elif asthma_sev >= 2: return "Moderate"
        return "Low"

    elif predicted_disease == "Tuberculosis":
        if (adv_answers.get("blood_in_cough") or
                adv_answers.get("drenching_sweats") or
                adv_answers.get("unexplained_wt")):
            return "High"
        elif tb_sev >= 2: return "Moderate"
        return "Low"

    elif predicted_disease == "Lung Cancer":
        if (adv_answers.get("blood_in_cough") or
                adv_answers.get("cancer_wt_loss")):
            return "Critical"
        elif smoking_level >= 3: return "High"
        return "Moderate"

    elif predicted_disease == "Pulmonary Fibrosis":
        if fibrosis_sev >= 3:   return "High"
        elif fibrosis_sev >= 2: return "Moderate"
        return "Low"

    elif predicted_disease == "Pulmonary Embolism":
        if (pe_sev >= 2 or
                adv_answers.get("leg_swelling") or
                adv_answers.get("immobility_risk")):
            return "Critical"
        return "High"

    return "Moderate"


# ═══════════════════════════════════════════════════════════════
#  FRONTEND → FEATURE VECTOR CONVERTER  — unchanged
# ═══════════════════════════════════════════════════════════════
def frontend_to_features(severity: dict, adv_answers: dict,
                          smoking: str, duration: str) -> list:
    sev = {k: int(v) for k, v in severity.items()}
    adv = {k: int(bool(v)) for k, v in adv_answers.items()}

    cough_severity = max(
        sev.get('covid19', 0), sev.get('tuberculosis', 0),
        sev.get('lung_cancer', 0), sev.get('pulmonary_fibrosis', 0),
        sev.get('asthma', 0),
    )
    fever_severity = max(
        sev.get('covid19', 0), sev.get('tuberculosis', 0),
    )
    breathlessness_severity = max(
        sev.get('pulmonary_embolism', 0),
        sev.get('pulmonary_fibrosis', 0),
        sev.get('covid19', 0), sev.get('asthma', 0),
        sev.get('lung_cancer', 0),
    )
    wheezing_severity   = sev.get('asthma', 0)
    chest_pain_severity = max(
        sev.get('pulmonary_embolism', 0), sev.get('lung_cancer', 0),
    )
    fatigue_severity = max(
        sev.get('lung_cancer', 0), sev.get('tuberculosis', 0),
        sev.get('covid19', 0),
    )

    dur_int = DURATION_MAP.get(duration, 0)
    if sev.get('pulmonary_embolism', 0) >= 2 or adv.get('minutes_onset', 0):
        onset_speed = 3
    elif dur_int == 0:  onset_speed = 2
    elif dur_int == 1:  onset_speed = 2
    elif dur_int == 2:  onset_speed = 1
    else:               onset_speed = 0

    duration_level    = dur_int
    smell_taste_loss  = adv.get('smell_taste_loss',  0)
    muscle_aches      = adv.get('muscle_aches',      0)
    night_sweats      = adv.get('drenching_sweats',  0)
    tb_exposure       = adv.get('tb_exposure',       0)
    blood_cough       = adv.get('blood_in_cough',    0)
    weight_loss       = max(adv.get('unexplained_wt', 0),
                             adv.get('cancer_wt_loss', 0))
    velcro_crackles   = adv.get('velcro_crackles',   0)
    wheezing_episodic = adv.get('normal_between',    0)
    known_trigger     = adv.get('specific_trigger',  0)
    inhaler_reversal  = adv.get('inhaler_relief',    0)
    hoarseness        = adv.get('new_hoarseness',    0)
    leg_swelling      = adv.get('leg_swelling',      0)
    recent_immobility = adv.get('immobility_risk',   0)
    smoking_level     = SMOKING_MAP.get(smoking, 0)

    if adv.get('drenching_sweats', 0) or sev.get('tuberculosis', 0) >= 2:
        fever_pattern = 2
    elif sev.get('covid19', 0) >= 1:
        fever_pattern = 1
    else:
        fever_pattern = 0

    return [
        cough_severity, fever_severity, breathlessness_severity,
        wheezing_severity, chest_pain_severity, fatigue_severity,
        onset_speed, duration_level,
        smell_taste_loss, muscle_aches,
        night_sweats, tb_exposure,
        blood_cough, weight_loss,
        velcro_crackles,
        wheezing_episodic, known_trigger, inhaler_reversal,
        hoarseness,
        leg_swelling, recent_immobility,
        smoking_level, fever_pattern,
    ]


# ---------------- JWT HELPER ----------------
def generate_token(user_id):
    return jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm="HS256"
    )


# ---------------- JWT DECORATOR ----------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"message": "Token missing"}), 401
        token = auth_header.split(" ")[1].strip()
        if not token:
            return jsonify({"message": "Token missing"}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            print("JWT decode error:", str(e))
            return jsonify({"message": "Invalid token"}), 401
        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"message": "Invalid token payload"}), 401
        try:
            conn = get_db()
            cur  = conn.cursor()
            cur.execute(
                "SELECT id, email, name FROM users WHERE id=%s",
                (user_id,)
            )
            user = cur.fetchone()
            cur.close()
            conn.close()
        except Exception as e:
            print("DB error in token_required:", str(e))
            return jsonify({"message": "Database error"}), 500
        if not user:
            return jsonify({"message": "User not found"}), 401
        return f(user, *args, **kwargs)
    return decorated


# ---------------- LOG ----------------
def log_activity(email, status, user_id=None):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "INSERT INTO login_activity (user_id,email,status,ip_address,user_agent) VALUES (%s,%s,%s,%s,%s)",
            (user_id, email, status, request.remote_addr, request.headers.get('User-Agent'))
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("LOG ERROR:", e)


# ---------------- VALIDATION ----------------
def sanitize(data, signup=True):
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")
    try:
        email = validate_email(email).email
    except:
        return None, "Invalid email"
    if signup:
        full_name = data.get("name") or f"{data.get('firstName','')} {data.get('lastName','')}".strip()
        return {"email": email, "password": password, "full_name": full_name}, None
    return {"email": email, "password": password}, None


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    patient_name = data.get("name", "")
    print("PATIENT NAME =", patient_name)
    clean, err = sanitize(data, True)
    if err:
        return jsonify({"message": err}), 400
    hashed = bcrypt.hashpw(clean["password"].encode(), bcrypt.gensalt()).decode()
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "INSERT INTO users (name,email,password) VALUES (%s,%s,%s)",
            (clean["full_name"], clean["email"], hashed)
        )
        conn.commit()
        user_id = cur.lastrowid
        cur.close()
        conn.close()
        token = generate_token(user_id)
        return jsonify({"token": token}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── shared helper: create + email a fresh OTP for a user ─────
def _issue_otp(user_id, email):
    """Generate a new 6-digit OTP, store it with a 10-min expiry, and email it."""
    otp    = str(random.randint(100000, 999999))
    expiry = datetime.datetime.now() + datetime.timedelta(minutes=10)

    conn = get_db()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE users SET mfa_code=%s, mfa_expiry=%s WHERE id=%s",
        (otp, expiry, user_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    msg = Message(
        "Your MediScan OTP",
        recipients=[email],
        body=f"Your OTP is: {otp}\n\nIt expires in 10 minutes."
    )
    mail.send(msg)


# ---------------- LOGIN + OTP ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    clean, err = sanitize(data, False)
    if err:
        return jsonify({"message": err}), 400
    conn = get_db()
    cur  = conn.cursor()
    cur.execute("SELECT id,password FROM users WHERE email=%s", (clean["email"],))
    user = cur.fetchone()

    print("EMAIL:", clean["email"])
    print("USER:", user)

    if not user:
        print("EMAIL NOT FOUND")
        return jsonify({"message": "Invalid credentials"}), 401

    user_id, hashed = user

    print("PASSWORD MATCH:", bcrypt.checkpw(clean["password"].encode(), hashed.encode()))

    if not bcrypt.checkpw(clean["password"].encode(), hashed.encode()):
        return jsonify({"message": "Wrong password"}), 401

    cur.close()
    conn.close()

    _issue_otp(user_id, clean["email"])

    return jsonify({
    "message": "MFA_REQUIRED",
    "user_id": user_id
})

# ---------------- VERIFY OTP ----------------
@app.route("/verify-mfa", methods=["POST"])
def verify_mfa():
    data = request.get_json()
    conn = get_db()
    cur  = conn.cursor()
    cur.execute(
        "SELECT mfa_code, mfa_expiry FROM users WHERE id=%s",
        (data["user_id"],)
    )
    user = cur.fetchone()
    if user and user[0] == data["otp"] and datetime.datetime.now() < user[1]:
        token = generate_token(data["user_id"])
        cur.execute("SELECT name FROM users WHERE id=%s", (data["user_id"],))
        name = cur.fetchone()[0]
        cur.execute(
            "UPDATE users SET mfa_code=NULL, mfa_expiry=NULL WHERE id=%s",
            (data["user_id"],)
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"token": token, "name": name})
    cur.close()
    conn.close()
    return jsonify({"message": "Invalid or expired OTP"}), 401


# ---------------- RESEND OTP ---------------- (✅ NEW)
@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    data    = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    conn = get_db()
    cur  = conn.cursor()
    cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"message": "User not found"}), 404

    email = row[0]
    try:
        _issue_otp(user_id, email)
    except Exception as e:
        print("RESEND OTP ERROR:", e)
        return jsonify({"message": "Could not resend OTP"}), 500

    return jsonify({"message": "OTP resent"}), 200


# ---------------- PROFILE ----------------
@app.route("/profile", methods=["GET"])
@token_required
def profile(user):
    return jsonify({"id": user[0], "email": user[1], "name": user[2]})


# ---------------- CONTACT ----------------
@app.route("/contact", methods=["POST"])
def contact():
    data    = request.get_json()
    name    = data.get("name",    "").strip()
    email   = data.get("email",   "").strip()
    message = data.get("message", "").strip()
    if not name or not email or not message:
        return jsonify({"message": "All fields are required."}), 400
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "INSERT INTO contact_messages (name, email, message) VALUES (%s, %s, %s)",
            (name, email, message)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({"message": "Failed to save message."}), 500
    try:
        msg = Message(
            subject=f"📩 New Contact Message from {name}",
            recipients=[os.getenv("EMAIL_USER")],
            reply_to=email,
            body=f"Name: {name}\nEmail: {email}\nMessage:\n{message}"
        )
        mail.send(msg)
    except Exception as e:
        print("MAIL ERROR:", e)
        return jsonify({"message": "Message saved but email failed."}), 207
    return jsonify({"message": "Message sent successfully."}), 200


# ---------------- APPOINTMENTS — GET ----------------
@app.route("/appointments", methods=["GET"])
@token_required
def get_appointments(user):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            """SELECT id, name, date, doctor, time, hospital, type
               FROM appointments WHERE user_id = %s
               ORDER BY date ASC, time ASC""",
            (user[0],)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([
            {"id": r[0], "name": r[1], "date": str(r[2]),
             "doctor": r[3], "time": r[4],
             "hospital": r[5] or "", "type": r[6] or ""}
            for r in rows
        ])
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ---------------- APPOINTMENTS — POST ----------------
@app.route("/appointments", methods=["POST"])
@token_required
def add_appointment(user):
    data     = request.get_json()
    name     = data.get("name",     "").strip()
    date     = data.get("date",     "").strip()
    doctor   = data.get("doctor",   "").strip()
    time     = data.get("time",     "").strip()
    hospital = data.get("hospital", "").strip()
    apt_type = data.get("type",     "").strip()
    if not all([name, date, doctor, time]):
        return jsonify({"message": "Name, date, doctor and time are required."}), 400
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "SELECT id FROM appointments WHERE doctor=%s AND date=%s AND time=%s",
            (doctor, date, time)
        )
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"message": "This slot is already booked."}), 409
        cur.execute(
            """INSERT INTO appointments
               (user_id, hospital, name, date, doctor, time, type)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (user[0], hospital, name, date, doctor, time, apt_type)
        )
        conn.commit()
        new_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({
            "id": new_id, "name": name, "date": date,
            "doctor": doctor, "time": time,
            "hospital": hospital, "type": apt_type
        }), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ---------------- APPOINTMENTS — DELETE ----------------
@app.route("/appointments/<int:appointment_id>", methods=["DELETE"])
@token_required
def delete_appointment(user, appointment_id):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            "DELETE FROM appointments WHERE id=%s AND user_id=%s",
            (appointment_id, user[0])
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ---------------- GOOGLE LOGIN ----------------
@app.route("/google/login")
def google_login():
    flow = Flow.from_client_secrets_file(
        "client_secret.json", scopes=SCOPES,
        redirect_uri="http://localhost:5001/google/callback"
    )
    auth_url, state = flow.authorization_url(
        prompt="select_account consent",
        access_type="offline",
        include_granted_scopes="true"
    )
    session["state"]         = state
    session["code_verifier"] = flow.code_verifier
    session.modified         = True
    return redirect(auth_url)


# ---------------- GOOGLE CALLBACK ----------------
@app.route("/google/callback")
def google_callback():
    state         = session.get("state")
    code_verifier = session.get("code_verifier")
    if not state:
        return jsonify({"message": "Session expired."}), 400
    flow = Flow.from_client_secrets_file(
        "client_secret.json", scopes=SCOPES, state=state,
        redirect_uri="http://localhost:5001/google/callback"
    )
    flow.code_verifier = code_verifier
    flow.fetch_token(authorization_response=request.url)
    credentials     = flow.credentials
    request_session = google_requests.Request()
    id_info = id_token.verify_oauth2_token(
        credentials.id_token, request_session, GOOGLE_CLIENT_ID
    )
    email = id_info["email"]
    name  = id_info.get("name") or email.split("@")[0]
    conn  = get_db()
    cur   = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    user  = cur.fetchone()
    if not user:
        fake_password = bcrypt.hashpw("google_login".encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "INSERT INTO users (name,email,password) VALUES (%s,%s,%s)",
            (name, email, fake_password)
        )
        conn.commit()
        user_id = cur.lastrowid
    else:
        user_id = user[0]
    log_activity(email, "GOOGLE_LOGIN", user_id)
    token = generate_token(user_id)
    cur.close()
    conn.close()
    session.pop("state",         None)
    session.pop("code_verifier", None)
    return redirect(f"http://localhost:5173/dashboard?token={token}&name={name}")


# ---------------- CHAT ----------------
@app.route("/chat", methods=["POST"])
def chat():
    data         = request.get_json()
    user_message = data.get("message")
    if not user_message:
        return jsonify({"reply": "Empty message"}), 400
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are MediScan AI, a helpful medical assistant."},
                {"role": "user",   "content": user_message}
            ]
        )
        reply = completion.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        print("Groq error:", str(e))
        return jsonify({"reply": str(e)}), 500


# ── INPUT VALIDATION ─────────────────────────────────────────
CONTRADICTION_RULES = [
    (
        lambda s, a, sm, d: bool(a.get('weight_loss')) and d == '1_3_days',
        "Weight loss takes weeks — duration of 1-3 days is contradictory"
    ),
    (
        lambda s, a, sm, d: s.get('pulmonary_embolism', 0) > 0 and d in ['1_month', '3_months'],
        "Pulmonary Embolism is always sudden onset — duration seems too long"
    ),
    (
        lambda s, a, sm, d: s.get('lung_cancer', 0) > 0 and d in ['1_3_days', '1_week'],
        "Lung Cancer symptoms develop over months — duration seems too short"
    ),
    (
        lambda s, a, sm, d: s.get('tuberculosis', 0) > 0 and d in ['1_3_days', '1_week'],
        "Tuberculosis develops over weeks/months — duration seems too short"
    ),
    (
        lambda s, a, sm, d: s.get('pulmonary_fibrosis', 0) > 0 and d in ['1_3_days', '1_week'],
        "Pulmonary Fibrosis develops over months — duration seems too short"
    ),
    (
        lambda s, a, sm, d: s.get('pulmonary_fibrosis', 0) > 0 and
        (s.get('covid19', 0) > 0 or s.get('tuberculosis', 0) > 0) and
        bool(a.get('drenching_sweats')),
        "Pulmonary Fibrosis does not cause fever or night sweats"
    ),
    (
        lambda s, a, sm, d: bool(a.get('smell_taste_loss')) and
        s.get('tuberculosis', 0) > 0 and s.get('covid19', 0) == 0,
        "Loss of smell/taste is a Covid-19 symptom — not typical for TB"
    ),
    (
        lambda s, a, sm, d: bool(a.get('velcro_crackles')) and
        s.get('pulmonary_fibrosis', 0) == 0,
        "Velcro crackles are exclusive to Pulmonary Fibrosis — please recheck"
    ),
    (
        lambda s, a, sm, d: bool(a.get('leg_swelling')) and
        s.get('pulmonary_embolism', 0) == 0,
        "Leg swelling strongly suggests Pulmonary Embolism — please check PE severity"
    ),
]


def validate_inputs(severity, adv_answers, smoking, duration):
    errors   = []
    warnings = []
    if not severity or not any(int(v) > 0 for v in severity.values()):
        errors.append("Please select severity for at least one disease.")
        return errors, warnings
    vec      = frontend_to_features(severity, adv_answers, smoking, duration)
    non_zero = sum(1 for v in vec if v != 0)
    if non_zero < 3:
        errors.append(
            f"Only {non_zero} symptom signal(s) detected. "
            "Please answer at least 3-4 follow-up questions for an accurate result."
        )
    for rule, message in CONTRADICTION_RULES:
        try:
            if rule(severity, adv_answers, smoking, duration):
                warnings.append(message)
        except Exception:
            pass
    return errors, warnings


# ═══════════════════════════════════════════════════════════════
#  PREDICT — XGBoost symptom diagnosis  (unchanged)
# ═══════════════════════════════════════════════════════════════
@app.route("/predict/symptom", methods=["POST"])
@token_required
def predict_symptom(user):
    data = request.get_json()

    patient_name = data.get("name", "").strip()

    print("PATIENT NAME =", patient_name)
    if not data:
        return jsonify({"message": "No JSON body received"}), 400

    severity    = data.get("severity",   {})
    adv_answers = data.get("advAnswers", {})
    smoking     = data.get("smoking",    "non_smoker")
    duration    = data.get("duration",   "1_week")

    errors, warnings = validate_inputs(severity, adv_answers, smoking, duration)
    if errors:
        return jsonify({
            "message":  errors[0],
            "errors":   errors,
            "warnings": warnings,
        }), 400

    try:
        vec = frontend_to_features(severity, adv_answers, smoking, duration)
    except Exception as e:
        return jsonify({"message": f"Feature conversion failed: {str(e)}"}), 500

    if len(vec) != len(ALL_FEATURES):
        return jsonify({"message": f"Feature mismatch: got {len(vec)}, expected {len(ALL_FEATURES)}"}), 500

    input_df = pd.DataFrame([dict(zip(ALL_FEATURES, vec))])

    try:
        pred_encoded = XGB_MODEL.predict(input_df)[0]
        proba        = XGB_MODEL.predict_proba(input_df)[0]
    except Exception as e:
        return jsonify({"message": f"Model prediction failed: {str(e)}"}), 500

    predicted_disease = LABEL_ENCODER.inverse_transform([pred_encoded])[0]
    confidence_pct    = round(float(proba[pred_encoded]) * 100, 1)

    all_classes   = list(LABEL_ENCODER.classes_)
    probabilities = [
        {"disease": cls, "pct": round(float(p) * 100, 1)}
        for cls, p in sorted(zip(all_classes, proba), key=lambda x: -x[1])
    ]

    non_zero_count = sum(1 for v in vec if v != 0)
    if confidence_pct >= 75 and non_zero_count >= 5:
        reliability  = "High"
        data_quality = "High"
    elif confidence_pct >= 55:
        reliability  = "Moderate"
        data_quality = "Moderate"
    else:
        reliability  = "Low"
        data_quality = "Low"

    risk            = calculate_risk(predicted_disease, severity, adv_answers, smoking, duration)
    recommendations = DISEASE_RECS.get(predicted_disease, DEFAULT_RECS)

    active_symptoms  = []
    severity_display = {}
    for dis_id, sval in severity.items():
        if int(sval) > 0:
            label      = DISEASE_DISPLAY.get(dis_id, dis_id.replace("_", " ").title())
            sev_labels = SEVERITY_LABEL_MAP.get(dis_id, ["None","Mild","Moderate","Severe"])
            active_symptoms.append(label)
            severity_display[label] = sev_labels[min(int(sval), len(sev_labels)-1)]

    adv_display = [
        k.replace("_", " ").title()
        for k, v in adv_answers.items() if v
    ]

    is_emergency = (
        predicted_disease == "Pulmonary Embolism" and confidence_pct >= 60
    )

    response_payload = {
        "result":          predicted_disease,
        "confidence":      f"{confidence_pct}%",
        "risk":            risk,
        "reliability":     reliability,
        "dataQuality":     data_quality,
        "aiMode":          "XGBoost Symptom Analysis v5",
        "assessmentType":  "Symptoms Only",
        "probabilities":   probabilities,
        "recommendations": recommendations,
        "symptoms":        active_symptoms,
        "severity":        severity_display,
        "advSymptoms":     adv_display,
        "smoking":         SMOKING_LABEL.get(smoking, smoking),
        "duration":        DURATION_LABEL.get(duration, duration),
        "featureVector":   vec,
        "featureCount":    non_zero_count,
        "warnings":        warnings,
        "isEmergency":     is_emergency,
        "patientName":     patient_name,
    }

    # ── Persist scan to DB ────────────────────────────────────
    save_scan_result(user[0], response_payload)

    return jsonify(response_payload)


# ═══════════════════════════════════════════════════════════════
#  PREDICT — DenseNet121 X-ray diagnosis
# ═══════════════════════════════════════════════════════════════
@app.route("/predict/xray", methods=["POST"])
@token_required
def predict_xray(user):
    if XRAY_MODEL is None:
        return jsonify({"message": "X-ray model not loaded. Check models/final_model_keras folder."}), 500

    if 'image' not in request.files:
        return jsonify({"message": "No image uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "Empty filename"}), 400

    # ── ✅ Patient name from form field ───────────────────────
    patient_name = request.form.get("patientName", "").strip()

    try:
        # ── Load & preprocess image ───────────────────────────
        pil_img      = Image.open(file.stream).convert('RGB')
        preprocessed = preprocess_xray_image(pil_img)

        # ── Convert original uploaded image to Base64 ─────────
        orig_buf = BytesIO()
        pil_img.resize((224, 224), Image.LANCZOS).save(orig_buf, format="PNG")
        original_xray_b64 = "data:image/png;base64," + base64.b64encode(orig_buf.getvalue()).decode()

        # ── Inference ─────────────────────────────────────────
        raw_preds = XRAY_MODEL.predict(preprocessed, verbose=0)
        probs     = raw_preds[0]

        pred_idx   = int(np.argmax(probs))
        pred_class = XRAY_CLASSES[pred_idx]
        confidence = round(float(probs[pred_idx]) * 100, 1)

        all_probs = sorted(
            [
                {"disease": XRAY_CLASSES[i], "pct": round(float(probs[i]) * 100, 1)}
                for i in range(len(XRAY_CLASSES))
            ],
            key=lambda x: -x["pct"]
        )

        # ── Grad-CAM ──────────────────────────────────────────
        gradcam_b64 = None
        if GRADCAM is not None:
            try:
                cam         = GRADCAM.generate(preprocessed, pred_idx)
                gradcam_b64 = GRADCAM.overlay_b64(pil_img, cam)
            except Exception as cam_err:
                print(f"GradCAM error: {cam_err}")

        # ── Risk / reliability ────────────────────────────────
        risk            = xray_risk_label(pred_class, confidence)
        recommendations = XRAY_DISEASE_RECS.get(pred_class, XRAY_DEFAULT_RECS)

        if confidence >= 75:
            reliability = "High"
        elif confidence >= 55:
            reliability = "Moderate"
        else:
            reliability = "Low"

        is_emergency = (
            pred_class in ["Pneumothorax", "Effusion"] and confidence >= 70
        )

        display_name = pred_class.replace("_", " ")

        response_payload = {
            "result":          display_name,
            "confidence":      f"{confidence}%",
            "risk":            risk,
            "reliability":     reliability,
            "dataQuality":     "High",
            "aiMode":          "DenseNet121 X-ray Analysis",
            "assessmentType":  "X-Ray Only",
            "probabilities":   all_probs,
            "recommendations": recommendations,
            "originalXray":    original_xray_b64,
            "gradcam":         gradcam_b64,
            "classes":         XRAY_CLASSES,
            "isEmergency":     is_emergency,
            "symptoms":        [],
            "severity":        {},
            "advSymptoms":     [],
            "warnings":        [],
            "featureVector":   [],
            "patientName":     patient_name,   # ✅ NEW
        }

        # ── Persist scan to DB ────────────────────────────────
        save_scan_result(user[0], response_payload)

        return jsonify(response_payload)

    except Exception as e:
        print("X-ray predict error:", str(e))
        return jsonify({"message": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
#  SCAN HISTORY — save & fetch
# ═══════════════════════════════════════════════════════════════

def save_scan_result(user_id: int, payload: dict):
    """
    Persist a completed scan into the `scan_results` table.

    SQL to run once on existing DB:
    ─────────────────────────────────────────────────────────────
    ALTER TABLE scan_results
      ADD COLUMN original_xray  LONGTEXT     NULL AFTER feature_vector,
      ADD COLUMN gradcam         LONGTEXT     NULL AFTER original_xray,
      ADD COLUMN patient_name    VARCHAR(120) NULL AFTER gradcam;
    ─────────────────────────────────────────────────────────────

    Full DDL for fresh installs:
    ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS scan_results (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        user_id         INT          NOT NULL,
        scan_date       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        result          VARCHAR(120) NOT NULL,
        risk            VARCHAR(30)  NOT NULL,
        confidence      VARCHAR(10)  NOT NULL,
        ai_mode         VARCHAR(80)  NOT NULL,
        assessment_type VARCHAR(40)  NOT NULL,
        reliability     VARCHAR(20)  NOT NULL,
        data_quality    VARCHAR(20)  NOT NULL,
        is_emergency    TINYINT(1)   NOT NULL DEFAULT 0,
        recommendations JSON,
        probabilities   JSON,
        symptoms        JSON,
        severity        JSON,
        adv_symptoms    JSON,
        warnings        JSON,
        feature_vector  JSON,
        original_xray   LONGTEXT,
        gradcam         LONGTEXT,
        patient_name    VARCHAR(120),
        INDEX idx_user_date (user_id, scan_date)
    );
    ─────────────────────────────────────────────────────────────
    """
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            """INSERT INTO scan_results
               (user_id, result, risk, confidence, ai_mode, assessment_type,
                reliability, data_quality, is_emergency,
                recommendations, probabilities, symptoms, severity,
                adv_symptoms, warnings, feature_vector,
                original_xray, gradcam, patient_name)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                user_id,
                payload.get("result",         ""),
                payload.get("risk",           ""),
                payload.get("confidence",     ""),
                payload.get("aiMode",         ""),
                payload.get("assessmentType", ""),
                payload.get("reliability",    ""),
                payload.get("dataQuality",    ""),
                int(payload.get("isEmergency", False)),
                json.dumps(payload.get("recommendations", [])),
                json.dumps(payload.get("probabilities",   [])),
                json.dumps(payload.get("symptoms",        [])),
                json.dumps(payload.get("severity",        {})),
                json.dumps(payload.get("advSymptoms",     [])),
                json.dumps(payload.get("warnings",        [])),
                json.dumps(payload.get("featureVector",   [])),
                payload.get("originalXray"),
                payload.get("gradcam"),
                payload.get("patientName"),   # ✅ NEW — None for symptom scans
            )
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"⚠️  save_scan_result error: {e}")


# ── /reports GET ─────────────────────────────────────────────
@app.route("/reports", methods=["GET"])
@token_required
def get_reports(user):
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            """SELECT id, scan_date, result, risk, confidence,
                      ai_mode, assessment_type, reliability, data_quality,
                      is_emergency, recommendations, probabilities,
                      symptoms, severity, adv_symptoms, warnings,
                      feature_vector, original_xray, gradcam, patient_name
               FROM scan_results
               WHERE user_id = %s
               ORDER BY scan_date ASC""",
            (user[0],)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        def _j(v):
            if v is None:
                return []
            if isinstance(v, (list, dict)):
                return v
            try:
                return json.loads(v)
            except Exception:
                return []

        result = []
        for r in rows:
            result.append({
                "id":             r[0],
                "date":           r[1].strftime("%b %d, %Y") if r[1] else "",
                "datetime":       r[1].isoformat()           if r[1] else "",
                "result":         r[2],
                "risk":           r[3],
                "confidence":     r[4],
                "aiMode":         r[5],
                "assessmentType": r[6],
                "reliability":    r[7],
                "dataQuality":    r[8],
                "isEmergency":    bool(r[9]),
                "recommendations":_j(r[10]),
                "probabilities":  _j(r[11]),
                "symptoms":       _j(r[12]),
                "severity":       _j(r[13]),
                "advSymptoms":    _j(r[14]),
                "warnings":       _j(r[15]),
                "featureVector":  _j(r[16]),
                "originalXray":   r[17],
                "gradcam":        r[18],
                "patientName":    r[19] or "",   # ✅ NEW
            })
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ── /reports DELETE ─────────────────────────────────────────────
@app.route("/reports/<int:report_id>", methods=["DELETE"])
@token_required
def delete_report(user, report_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM scan_results WHERE id=%s AND user_id=%s",
            (report_id, user[0])
        )
        conn.commit()
        if cur.rowcount == 0:
            cur.close()
            conn.close()
            return jsonify({"message": "Report not found"}), 404
        cur.close()
        conn.close()
        return jsonify({"success": True, "message": "Report deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True, port=5001)