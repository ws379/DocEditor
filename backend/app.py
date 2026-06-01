import os
import uuid
import asyncio
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from translate.engine import TranslationEngine
from terms_db import (
    get_all_terms as db_get_all_terms,
    add_term as db_add_term,
    update_term as db_update_term,
    delete_term as db_delete_term,
    import_terms_csv as db_import_terms_csv,
    import_terms_json as db_import_terms_json,
    correct_term as db_correct_term,
)

# Optional: PDF generation with Playwright
try:
    from pdf_generator import generate_pdf
    HAS_PDF_GENERATOR = True
except ImportError:
    HAS_PDF_GENERATOR = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize translation engine
engine = TranslationEngine()

# Configure engines from environment variables ONLY — no hardcoded secrets
_ENGINE_CONFIGS = {
    'deepseek': ['DEEPSEEK_API_KEY:apiKey'],
    'tencent': ['TENCENT_SECRET_ID:secretId', 'TENCENT_SECRET_KEY:secretKey'],
    'aliyun': ['ALIYUN_ACCESS_KEY_ID:accessKeyId', 'ALIYUN_ACCESS_KEY_SECRET:accessKeySecret'],
    'volcengine': ['VOLCENGINE_ACCESS_KEY_ID:accessKeyId', 'VOLCENGINE_SECRET_ACCESS_KEY:secretAccessKey'],
    'niutrans': ['NIUTRANS_API_KEY:apiKey'],
}

for eng_name, key_specs in _ENGINE_CONFIGS.items():
    config = {}
    for spec in key_specs:
        env_name, param_name = spec.split(':', 1)
        val = os.environ.get(env_name, '').strip()
        if val:
            config[param_name] = val
    if config:
        engine.configure_engine(eng_name, config)
        logger.info(f"Configured engine '{eng_name}' from environment variables")
    else:
        logger.info(f"Engine '{eng_name}' not configured (set env vars or use UI)")


@app.route('/api/translate', methods=['POST'])
def translate():
    """Translate text endpoint"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    text = data.get('text')
    source_lang = data.get('sourceLang', 'auto')
    target_lang = data.get('targetLang', 'zh')
    engine_name = data.get('engine', 'default')

    if not text:
        return jsonify({'success': False, 'error': 'No text provided'}), 400

    try:
        result = engine.translate(
            text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            engine_name=engine_name,
        )
        return jsonify({
            'success': True,
            'translatedText': result['translatedText'],
            'engine': result['engine'],
            'sourceLang': source_lang,
            'targetLang': target_lang,
        })
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/terms', methods=['GET'])
def get_terms():
    """Get all terms"""
    try:
        terms = db_get_all_terms()
        return jsonify({'success': True, 'terms': terms})
    except Exception as e:
        logger.error(f"Failed to get terms: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/terms', methods=['POST'])
def add_term():
    """Add a new term"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    source = data.get('source', '').strip()
    target = data.get('target', '').strip()
    if not source or not target:
        return jsonify({'success': False, 'error': 'source and target are required'}), 400
    try:
        term = db_add_term(source, target)
        return jsonify({'success': True, 'term': term})
    except Exception as e:
        logger.error(f"Failed to add term: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/terms/<int:term_id>', methods=['PUT'])
def update_term(term_id):
    """Update a term"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    source = data.get('source', '').strip()
    target = data.get('target', '').strip()
    if not source or not target:
        return jsonify({'success': False, 'error': 'source and target are required'}), 400
    try:
        updated = db_update_term(term_id, source, target)
        if updated:
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Term not found'}), 404
    except Exception as e:
        logger.error(f"Failed to update term {term_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/terms/<int:term_id>', methods=['DELETE'])
def delete_term(term_id):
    """Delete a term"""
    try:
        deleted = db_delete_term(term_id)
        if deleted:
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Term not found'}), 404
    except Exception as e:
        logger.error(f"Failed to delete term {term_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/terms/import', methods=['POST'])
def import_terms():
    """Import terms from CSV or JSON file"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    file = request.files['file']
    try:
        content = file.read().decode('utf-8')
        filename = file.filename.lower()
        if filename.endswith('.json'):
            count = db_import_terms_json(content)
        else:
            count = db_import_terms_csv(content)
        return jsonify({'success': True, 'count': count})
    except Exception as e:
        logger.error(f"Failed to import terms: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/terms/correct', methods=['POST'])
def correct_term():
    """Correct a term translation"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    term_id = data.get('id')
    old_target = data.get('old_target', '')
    new_target = data.get('new_target', '')
    if not term_id or not old_target or not new_target:
        return jsonify({'success': False, 'error': 'id, old_target, and new_target are required'}), 400
    try:
        corrected = db_correct_term(term_id, old_target, new_target)
        if corrected:
            return jsonify({'success': True})
        return jsonify({'success': False, 'error': 'Term not found or target mismatch'}), 404
    except Exception as e:
        logger.error(f"Failed to correct term: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/config/engines', methods=['GET'])
def get_engines():
    """Get available translation engines"""
    return jsonify({'engines': engine.get_available_engines()})


@app.route('/api/config/engines/<engine_name>', methods=['PUT'])
def update_engine_config(engine_name):
    """Update engine configuration"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No config provided'}), 400
    success = engine.configure_engine(engine_name, data)
    if success:
        return jsonify({'success': True, 'message': f'Engine {engine_name} config updated'})
    return jsonify({'success': False, 'error': f'Unknown engine: {engine_name}'}), 400


@app.route('/api/config/engines/<engine_name>/check', methods=['GET'])
def check_engine(engine_name):
    """Check if engine is available"""
    eng = engine.engines.get(engine_name)
    if eng:
        return jsonify({'available': eng.is_available()})
    return jsonify({'available': False, 'message': f'Unknown engine: {engine_name}'})


@app.route('/api/export/pdf', methods=['POST'])
def export_pdf():
    """Generate PDF from HTML using Playwright."""
    if not HAS_PDF_GENERATOR:
        return jsonify({'success': False, 'error': 'PDF generator not available'}), 501
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    html = data.get('html')
    title = data.get('title', 'document')
    if not html:
        return jsonify({'success': False, 'error': 'No HTML provided'}), 400
    try:
        pdf_bytes = asyncio.run(generate_pdf(html, title))
        return pdf_bytes, 200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': f'attachment; filename="{title}.pdf"',
        }
    except Exception as e:
        logger.error(f"PDF export failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/upload/image', methods=['POST'])
def upload_image():
    """Upload an image and return its URL."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({'success': False, 'error': f'Unsupported file type: {ext}'}), 400
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    return jsonify({'success': True, 'url': f"/api/uploads/{filename}", 'filename': filename})


@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded files."""
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(upload_dir, filename)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


# ── Global error handlers ──────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'error': 'Resource not found'}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'success': False, 'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
