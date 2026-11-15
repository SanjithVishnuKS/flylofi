import os
import struct
import zipfile
import hashlib
import base64
import datetime
import shutil
import io

from sign_apk import signer, keys, verify, zipdata, rezip
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.serialization import pkcs7

base_apk = r'd:\SERVER APP\clean-base.apk'
output_apk = r'd:\SERVER APP\focus-flight.apk'
web_apk = r'd:\SERVER APP\focus-flight\focus-flight.apk'
focus_dir = r'd:\SERVER APP\focus-flight'
master_clip = r'd:\SERVER APP\media\flight\clips\gemini_generated_video_09c1b3d1.mp4'
key_path = r'd:\SERVER APP\flylofi-release-key.pem'
cert_path = r'd:\SERVER APP\flylofi-release-cert.pem'

print("1. Loading persistent FlyLofi key material...")
if not os.path.exists(key_path) or not os.path.exists(cert_path):
    key_material = keys.generate_debug_key('Flylofi')
    keys.save_pem(key_material, key_path, cert_path)
    print("   Created new key pair.")
else:
    key_material = keys.load_pem(key_path, cert_path, None)
    print("   Loaded persistent key pair.")

print("2. Reading clean base APK...")
entries = {}
with zipfile.ZipFile(base_apk, 'r') as zin:
    for item in zin.infolist():
        if item.filename.startswith('META-INF/'):
            continue
        if item.filename.startswith('assets/web/') or item.filename == 'assets/settings.json':
            continue
        entries[item.filename] = zin.read(item.filename)

print("3. Patching resources.arsc (App name -> Flylofi)...")
arsc = bytearray(entries['resources.arsc'])
old_slot = b'\n\nMy WebView\x00'
new_slot = b'\x07\x07Flylofi\x00\x00\x00\x00'
pos = arsc.find(old_slot)
assert pos != -1, "Could not find app_name slot in resources.arsc"
arsc[pos:pos+len(old_slot)] = new_slot
entries['resources.arsc'] = bytes(arsc)

print("4. Patching AndroidManifest.xml (minSdkVersion -> 24)...")
manifest = bytearray(entries['AndroidManifest.xml'])
assert manifest[5296] == 31, f"Expected 31 at offset 5296, got {manifest[5296]}"
manifest[5296] = 24
entries['AndroidManifest.xml'] = bytes(manifest)

print("5. Injecting web assets and media...")
files_to_inject = {
    'assets/web/index.html': os.path.join(focus_dir, 'app.html'),
    'assets/web/app.html': os.path.join(focus_dir, 'app.html'),
    'assets/web/cruise.html': os.path.join(focus_dir, 'cruise.html'),
    'assets/web/cruise-enhancements.css': os.path.join(focus_dir, 'cruise-enhancements.css'),
    'assets/web/cruise-enhancements.js': os.path.join(focus_dir, 'cruise-enhancements.js'),
    'assets/web/app-controls.js': os.path.join(focus_dir, 'app-controls.js'),
    'assets/web/styles.css': os.path.join(focus_dir, 'styles.css'),
    'assets/web/sw.js': os.path.join(focus_dir, 'sw.js'),
    'assets/web/manifest.json': os.path.join(focus_dir, 'manifest.json'),
    'assets/web/icon-192.png': os.path.join(focus_dir, 'icon-192.png'),
    'assets/web/icon-512.png': os.path.join(focus_dir, 'icon-512.png'),
}
if os.path.exists(master_clip):
    files_to_inject['assets/web/media/flight/clips/gemini_generated_video_09c1b3d1.mp4'] = master_clip

for zpath, fpath in files_to_inject.items():
    if os.path.exists(fpath):
        with open(fpath, 'rb') as f:
            entries[zpath] = f.read()
    else:
        print(f"   WARNING: file missing: {fpath}")

# Direct redirect entry for local/index.html
local_index_html = b"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/assets/web/app.html">
  <title>Flylofi</title>
  <script>
    window.location.replace('/assets/web/app.html');
  </script>
</head>
<body style="background:#071117;color:#83e0b5;display:grid;place-items:center;height:100vh;margin:0;font-family:sans-serif">
  <p>Boarding Flylofi Focus Flight...</p>
</body>
</html>"""
entries['assets/local/index.html'] = local_index_html
entries['assets/demo/index.html'] = local_index_html

import json
settings_json = {
    "sites": [
        {
            "url": "https://appassets.androidplatform.net/assets/web/app.html",
            "title": "Flylofi Focus Flight"
        }
    ],
    "other": "https://appassets.androidplatform.net/assets/web/app.html",
    "match": [
        ["host", "equals", "appassets.androidplatform.net"],
        ["scheme", "equals", "https"],
        ["scheme", "equals", "http"],
        ["scheme", "equals", "file"]
    ],
    "remote_debug": True,
    "console_log": False,
    "js_interface": False,
    "context_menu": False,
    "not_matching": False,
    "local_sites": False,
    "web_settings": {
        "JavaScriptEnabled": True,
        "DomStorageEnabled": True,
        "AllowFileAccess": True,
        "AllowContentAccess": True,
        "MediaPlaybackRequiresUserGesture": False
    },
    "source": "assets",
    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
}
entries['assets/settings.json'] = json.dumps(settings_json, indent=2).encode('utf-8')

print("6. Creating v1 JAR signature...")
def wrap(line):
    b = line.encode('utf-8')
    if len(b) <= 70: return line + '\r\n'
    out = [b[:70].decode('utf-8', errors='ignore')]
    rem = b[70:]
    while rem:
        out.append(' ' + rem[:69].decode('utf-8', errors='ignore'))
        rem = rem[69:]
    return '\r\n'.join(out) + '\r\n'

manifest_body = 'Manifest-Version: 1.0\r\nCreated-By: 1.0 (Flylofi)\r\n\r\n'
manifest_sections = {}
for name in sorted(entries.keys()):
    content = entries[name]
    sha1 = base64.b64encode(hashlib.sha1(content).digest()).decode('ascii')
    sha256 = base64.b64encode(hashlib.sha256(content).digest()).decode('ascii')
    sec = wrap(f'Name: {name}') + wrap(f'SHA-256-Digest: {sha256}') + wrap(f'SHA1-Digest: {sha1}') + '\r\n'
    manifest_sections[name] = sec
    manifest_body += sec

manifest_bytes = manifest_body.encode('utf-8')
sf_manifest_sha1 = base64.b64encode(hashlib.sha1(manifest_bytes).digest()).decode('ascii')
sf_manifest_sha256 = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('ascii')

sf_body = (
    'Signature-Version: 1.0\r\n'
    'Created-By: 1.0 (Flylofi)\r\n'
    'X-Android-APK-Signed: 2, 3\r\n'
    f'SHA-256-Digest-Manifest: {sf_manifest_sha256}\r\n'
    f'SHA1-Digest-Manifest: {sf_manifest_sha1}\r\n\r\n'
)
for name in sorted(entries.keys()):
    sec_bytes = manifest_sections[name].encode('utf-8')
    sha1 = base64.b64encode(hashlib.sha1(sec_bytes).digest()).decode('ascii')
    sha256 = base64.b64encode(hashlib.sha256(sec_bytes).digest()).decode('ascii')
    sf_body += wrap(f'Name: {name}') + wrap(f'SHA-256-Digest: {sha256}') + wrap(f'SHA1-Digest: {sha1}') + '\r\n'

sf_bytes = sf_body.encode('utf-8')
cert_rsa = (
    pkcs7.PKCS7SignatureBuilder()
    .set_data(sf_bytes)
    .add_signer(key_material.certificate, key_material.private_key, hashes.SHA256())
    .sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.DetachedSignature])
)

entries['META-INF/MANIFEST.MF'] = manifest_bytes
entries['META-INF/CERT.SF'] = sf_bytes
entries['META-INF/CERT.RSA'] = cert_rsa

print("7. Building aligned ZIP archive with 4-byte boundary padding...")
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for name in ['META-INF/MANIFEST.MF', 'META-INF/CERT.SF', 'META-INF/CERT.RSA']:
        zout.writestr(name, entries[name])
    for name in sorted(entries.keys()):
        if name.startswith('META-INF/'): continue
        compress = zipfile.ZIP_STORED if name == 'resources.arsc' else zipfile.ZIP_DEFLATED
        zout.writestr(name, entries[name], compress_type=compress)

zip_bytes = buf.getvalue()
sections = zipdata.find_eocd(zip_bytes)
aligned_data = rezip.rebuild_zip(zip_bytes, sections.central_dir_offset, set())

print("8. Generating APK Signature Scheme v2 + v3 Merkle Tree Blocks...")
sections = zipdata.find_eocd(aligned_data)
before_cd = aligned_data[:sections.central_dir_offset]
cd = aligned_data[sections.central_dir_offset : sections.central_dir_offset + sections.central_dir_size]
sig_block_offset = len(before_cd)
eocd_digest = zipdata.set_eocd_cd_offset(sections.eocd, sig_block_offset)
content_sections = [before_cd, cd, eocd_digest]

v2_block_val, v2_dig, _ = signer.build_v2_signature_scheme_block(
    key_material.private_key, key_material.certificate, content_sections, v3_signing_enabled=True
)
v3_block_val, v3_dig, _ = signer.build_v3_signature_scheme_block(
    key_material.private_key, key_material.certificate, content_sections, min_sdk_version=24
)
sig_block = signer.assemble_apk_signing_block([
    (signer.APK_SIGNATURE_SCHEME_V2_BLOCK_ID, v2_block_val),
    (signer.APK_SIGNATURE_SCHEME_V3_BLOCK_ID, v3_block_val)
])

new_central_dir_offset = sig_block_offset + len(sig_block)
final_eocd = zipdata.set_eocd_cd_offset(sections.eocd, new_central_dir_offset)

print("9. Writing output APK...")
with open(output_apk, 'wb') as f:
    f.write(before_cd)
    f.write(sig_block)
    f.write(cd)
    f.write(final_eocd)

shutil.copy2(output_apk, web_apk)

print("10. Verifying APK signatures and alignment...")
ver = verify.verify_apk(output_apk)
print(f"    APK Verified: Schemes = {ver['schemes']}")
print(f"    APK Size: {os.path.getsize(output_apk):,} bytes")
print("SUCCESS: focus-flight.apk is built, aligned, and signed!")
