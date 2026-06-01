"""
Translation Engine Adapter Layer

Supports multiple translation engines with a unified interface:
- DeepSeek (LLM-based, OpenAI-compatible API)
- Tencent Cloud TMT (TC3-HMAC-SHA256 signature)
- Huawei Cloud NLP (AK/SK + IAM token)
- Alibaba Cloud MT (HMAC-SHA1 signature)
- Volcengine (HMAC-SHA256 signature)
- NiuTrans (simple API key auth)
"""

import hashlib
import hmac
import json
import time
import base64
import urllib.parse
import requests
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, Optional


# ---------------------------------------------------------------------------
# Language code mapping
# ---------------------------------------------------------------------------
LANG_MAP = {
    'auto': 'auto', 'zh': 'zh', 'en': 'en', 'ja': 'ja', 'ko': 'ko',
    'fr': 'fr', 'de': 'de', 'es': 'es', 'it': 'it', 'pt': 'pt',
    'ru': 'ru', 'ar': 'ar', 'th': 'th', 'vi': 'vi', 'id': 'id', 'ms': 'ms',
}


def _resolve_lang(lang: str, engine: str) -> str:
    return LANG_MAP.get(lang, lang)


class BaseEngine(ABC):
    @abstractmethod
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class DefaultEngine(BaseEngine):
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return f"[翻译引擎未配置] {text}"

    def is_available(self) -> bool:
        return True


# =========================================================================
# DeepSeek (OpenAI-compatible Chat API)
# =========================================================================
class DeepSeekEngine(BaseEngine):
    API_URL = 'https://api.deepseek.com/chat/completions'

    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    def is_available(self) -> bool:
        return bool(self.api_key)

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.is_available():
            raise ValueError("DeepSeek engine not configured")

        lang_names = {
            'zh': 'Chinese', 'en': 'English', 'ja': 'Japanese',
            'ko': 'Korean', 'fr': 'French', 'de': 'German',
            'es': 'Spanish', 'it': 'Italian', 'pt': 'Portuguese',
            'ru': 'Russian', 'ar': 'Arabic', 'th': 'Thai',
            'vi': 'Vietnamese', 'auto': 'the most likely language',
        }
        target_name = lang_names.get(target_lang, target_lang)
        source_name = lang_names.get(source_lang, 'the source language')

        if source_lang == 'auto':
            system_prompt = (
                f"You are a professional translation engine. "
                f"Translate the following text into {target_name}. "
                f"Output ONLY the translated text, nothing else."
            )
        else:
            system_prompt = (
                f"You are a professional translation engine. "
                f"Translate the following text from {source_name} into {target_name}. "
                f"Output ONLY the translated text, nothing else."
            )

        payload = {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            "stream": False,
            "temperature": 0.3,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        resp = requests.post(self.API_URL, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        choices = data.get("choices", [])
        if choices:
            return choices[0]["message"]["content"].strip()
        raise ValueError(f"DeepSeek returned empty response: {json.dumps(data)}")


# =========================================================================
# Tencent Cloud TMT (TC3-HMAC-SHA256)
# =========================================================================
class TencentEngine(BaseEngine):
    ENDPOINT = 'tmt.tencentcloudapi.com'
    SERVICE = 'tmt'
    REGION = 'ap-beijing'
    ACTION = 'TextTranslate'
    VERSION = '2018-03-21'

    def __init__(self, secret_id: str = "", secret_key: str = ""):
        self.secret_id = secret_id
        self.secret_key = secret_key

    def is_available(self) -> bool:
        return bool(self.secret_id and self.secret_key)

    def _sign(self, payload: str, timestamp: int) -> str:
        date = datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime('%Y-%m-%d')

        http_request_method = 'POST'
        canonical_uri = '/'
        canonical_querystring = ''
        content_type = 'application/json'
        canonical_headers = f'content-type:{content_type}\nhost:{self.ENDPOINT}\n'
        signed_headers = 'content-type;host'
        hashed_payload = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        canonical_request = (
            f'{http_request_method}\n{canonical_uri}\n{canonical_querystring}\n'
            f'{canonical_headers}\n{signed_headers}\n{hashed_payload}'
        )

        algorithm = 'TC3-HMAC-SHA256'
        credential_scope = f'{date}/{self.SERVICE}/tc3_request'
        hashed_canonical = hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
        string_to_sign = f'{algorithm}\n{timestamp}\n{credential_scope}\n{hashed_canonical}'

        def _hmac_sha256(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

        secret_date = _hmac_sha256(('TC3' + self.secret_key).encode('utf-8'), date)
        secret_service = _hmac_sha256(secret_date, self.SERVICE)
        secret_signing = _hmac_sha256(secret_service, 'tc3_request')
        signature = hmac.new(secret_signing, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

        authorization = (
            f'{algorithm} Credential={self.secret_id}/{credential_scope}, '
            f'SignedHeaders={signed_headers}, Signature={signature}'
        )
        return authorization

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.is_available():
            raise ValueError("Tencent engine not configured")

        src = _resolve_lang(source_lang, 'tencent')
        tgt = _resolve_lang(target_lang, 'tencent')

        payload_dict = {
            "SourceText": text,
            "Source": src,
            "Target": tgt,
            "ProjectId": 0,
        }
        payload = json.dumps(payload_dict)
        timestamp = int(time.time())

        authorization = self._sign(payload, timestamp)

        headers = {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Host': self.ENDPOINT,
            'X-TC-Action': self.ACTION,
            'X-TC-Timestamp': str(timestamp),
            'X-TC-Version': self.VERSION,
            'X-TC-Region': self.REGION,
        }

        resp = requests.post(
            f'https://{self.ENDPOINT}',
            data=payload,
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        result = resp.json()

        response = result.get('Response', {})
        if 'Error' in response:
            err = response['Error']
            raise ValueError(f"Tencent API error: {err.get('Code')} - {err.get('Message')}")

        target_text = response.get('TargetText', '')
        if target_text:
            return target_text.strip()
        raise ValueError(f"Tencent returned empty response: {json.dumps(result)}")


# =========================================================================
# Alibaba Cloud MT (HMAC-SHA1)
# =========================================================================
class AliyunEngine(BaseEngine):
    ENDPOINT = 'http://mt.cn-hangzhou.aliyuncs.com'
    URL_PATH = 'api/translate/web/general'

    def __init__(self, access_key_id: str = "", access_key_secret: str = ""):
        self.access_key_id = access_key_id
        self.access_key_secret = access_key_secret

    def is_available(self) -> bool:
        return bool(self.access_key_id and self.access_key_secret)

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.is_available():
            raise ValueError("Aliyun engine not configured")

        src = _resolve_lang(source_lang, 'aliyun')
        tgt = _resolve_lang(target_lang, 'aliyun')

        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        nonce = str(int(time.time() * 1000))

        params = {
            'AccessKeyId': self.access_key_id,
            'Action': 'TranslateGeneral',
            'Format': 'JSON',
            'FormatType': 'text',
            'Scene': 'general',
            'SignatureMethod': 'HMAC-SHA1',
            'SignatureNonce': nonce,
            'SignatureVersion': '1.0',
            'SourceLanguage': src if src != 'auto' else '',
            'SourceText': text,
            'TargetLanguage': tgt,
            'Timestamp': timestamp,
            'Version': '2018-10-12',
        }

        sorted_params = sorted(params.items())
        query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote)

        string_to_sign = f'GET&{urllib.parse.quote("/", safe="")}&{urllib.parse.quote(query_string, safe="")}'

        signing_key = self.access_key_secret + '&'
        signature = base64.b64encode(
            hmac.new(signing_key.encode('utf-8'), string_to_sign.encode('utf-8'), hashlib.sha1).digest()
        ).decode('utf-8')

        url = f'{self.ENDPOINT}/{self.URL_PATH}?{query_string}&Signature={urllib.parse.quote(signature, safe="")}'

        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        result = resp.json()

        if result.get('Code') == '200':
            translated = result.get('Data', {}).get('Translated', '')
            if translated:
                return translated.strip()
        raise ValueError(f"Aliyun API error: {json.dumps(result)}")


# =========================================================================
# Volcengine (HMAC-SHA256)
# =========================================================================
class VolcengineEngine(BaseEngine):
    HOST = 'translate.volcengineapi.com'
    SERVICE = 'translate'
    REGION = 'cn-north-1'
    SERVICE_VERSION = '2020-06-01'

    def __init__(self, access_key_id: str = "", secret_access_key: str = ""):
        self.access_key_id = access_key_id
        self.secret_access_key = secret_access_key

    def is_available(self) -> bool:
        return bool(self.access_key_id and self.secret_access_key)

    def _sign(self, body_str: str, timestamp: datetime) -> Dict[str, str]:
        format_date = timestamp.strftime('%Y%m%dT%H%M%SZ')
        date_str = format_date[:8]

        body_hash = hashlib.sha256(body_str.encode('utf-8')).hexdigest()
        credential_scope = f'{date_str}/{self.REGION}/{self.SERVICE}/request'

        signed_headers_dict = {
            'content-type': 'application/json',
            'host': self.HOST,
            'x-content-sha256': body_hash,
            'x-date': format_date,
        }

        signed_header_keys = sorted(signed_headers_dict.keys())
        signed_str = ''
        md_signed_headers = ''
        for key in signed_header_keys:
            signed_str += f'{key}:{signed_headers_dict[key]}\n'
            md_signed_headers += f'{key};'
        md_signed_headers = md_signed_headers.rstrip(';')

        method = 'POST'
        norm_uri = '/'
        norm_query = f'Action=TranslateText&Version={self.SERVICE_VERSION}'
        canonical_request = (
            f'{method}\n{norm_uri}\n{norm_query}\n'
            f'{signed_str}\n{md_signed_headers}\n{body_hash}'
        )

        hashed_canonical = hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()

        algorithm = 'HMAC-SHA256'
        string_to_sign = f'{algorithm}\n{format_date}\n{credential_scope}\n{hashed_canonical}'

        def _hmac_sha256(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

        k_date = _hmac_sha256(self.secret_access_key.encode('utf-8'), date_str)
        k_region = _hmac_sha256(k_date, self.REGION)
        k_service = _hmac_sha256(k_region, self.SERVICE)
        signing_key = _hmac_sha256(k_service, 'request')

        signature = hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

        authorization = (
            f'{algorithm} Credential={self.access_key_id}/{credential_scope}, '
            f'SignedHeaders={md_signed_headers}, Signature={signature}'
        )

        return {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Host': self.HOST,
            'X-Content-Sha256': body_hash,
            'X-Date': format_date,
        }

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.is_available():
            raise ValueError("Volcengine engine not configured")

        tgt = _resolve_lang(target_lang, 'volcengine')

        body_dict = {
            'TargetLanguage': tgt,
            'TextList': [text],
        }
        body_str = json.dumps(body_dict)

        timestamp = datetime.now(timezone.utc)
        headers = self._sign(body_str, timestamp)

        url = f'https://{self.HOST}/?Action=TranslateText&Version={self.SERVICE_VERSION}'

        resp = requests.post(url, data=body_str, headers=headers, timeout=15)
        resp.raise_for_status()
        result = resp.json()

        # Check for error in response metadata
        meta = result.get('ResponseMetadata', {})
        error = meta.get('Error')
        if error:
            code = error.get('Code', '')
            msg = error.get('Message', '')
            raise ValueError(f"Volcengine API error: {code} - {msg}")

        translation_list = result.get('TranslationList', [])
        if translation_list:
            translations = []
            for item in translation_list:
                t = item.get('Translation', '')
                if t:
                    translations.append(t)
            if translations:
                return '\n'.join(translations).strip()

        raise ValueError(f"Volcengine returned unexpected response: {json.dumps(result)}")


# =========================================================================
# NiuTrans (小牛翻译)
# =========================================================================
class NiuTransEngine(BaseEngine):
    API_URL = 'https://api.niutrans.com/NiuTransServer/translation'

    def __init__(self, api_key: str = "", app_id: str = ""):
        self.api_key = api_key
        self.app_id = app_id

    def is_available(self) -> bool:
        return bool(self.api_key)

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.is_available():
            raise ValueError("NiuTrans engine not configured")

        src = _resolve_lang(source_lang, 'niutrans')
        tgt = _resolve_lang(target_lang, 'niutrans')

        payload = {
            'from': src if src != 'auto' else 'auto',
            'to': tgt,
            'apikey': self.api_key,
            'src_text': text,
        }

        headers = {'Content-Type': 'application/json'}
        resp = requests.post(self.API_URL, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        result = resp.json()

        tgt_text = result.get('tgt_text', '')
        if tgt_text:
            return tgt_text.strip()

        if 'error_msg' in result:
            raise ValueError(f"NiuTrans API error: {result.get('error_msg')}")

        raise ValueError(f"NiuTrans returned unexpected response: {json.dumps(result)}")


# =========================================================================
# Main Translation Engine Adapter
# =========================================================================
class TranslationEngine:
    def __init__(self):
        self.engines: Dict[str, BaseEngine] = {
            'default': DefaultEngine(),
            'deepseek': DeepSeekEngine(),
            'tencent': TencentEngine(),
            'aliyun': AliyunEngine(),
            'volcengine': VolcengineEngine(),
            'niutrans': NiuTransEngine(),
        }
        self.default_engine = 'default'

    def translate(
        self,
        text: str,
        source_lang: str = 'auto',
        target_lang: str = 'zh',
        engine_name: str = 'default',
    ) -> Dict[str, Any]:
        engine = self.engines.get(engine_name)
        if not engine:
            engine = self.engines[self.default_engine]
            engine_name = self.default_engine

        if not engine.is_available():
            engine = self.engines[self.default_engine]
            engine_name = self.default_engine

        translated_text = engine.translate(text, source_lang, target_lang)

        return {
            'translatedText': translated_text,
            'engine': engine_name,
        }

    def get_available_engines(self) -> list:
        return [
            {
                'name': name,
                'label': self._engine_label(name),
                'available': engine.is_available(),
            }
            for name, engine in self.engines.items()
        ]

    def configure_engine(self, engine_name: str, config: Dict[str, Any]) -> bool:
        try:
            if engine_name == 'deepseek':
                self.engines['deepseek'] = DeepSeekEngine(
                    api_key=config.get('apiKey', ''),
                )
            elif engine_name == 'tencent':
                self.engines['tencent'] = TencentEngine(
                    secret_id=config.get('secretId', ''),
                    secret_key=config.get('secretKey', ''),
                )
            elif engine_name == 'aliyun':
                self.engines['aliyun'] = AliyunEngine(
                    access_key_id=config.get('accessKeyId', ''),
                    access_key_secret=config.get('accessKeySecret', ''),
                )
            elif engine_name == 'volcengine':
                self.engines['volcengine'] = VolcengineEngine(
                    access_key_id=config.get('accessKeyId', ''),
                    secret_access_key=config.get('secretAccessKey', ''),
                )
            elif engine_name == 'niutrans':
                self.engines['niutrans'] = NiuTransEngine(
                    api_key=config.get('apiKey', ''),
                    app_id=config.get('appId', ''),
                )
            else:
                return False
            return True
        except Exception:
            return False

    @staticmethod
    def _engine_label(name: str) -> str:
        labels = {
            'default': '默认',
            'deepseek': 'DeepSeek',
            'tencent': '腾讯翻译',
            'aliyun': '阿里翻译',
            'volcengine': '火山翻译',
            'niutrans': '小牛翻译',
        }
        return labels.get(name, name)
