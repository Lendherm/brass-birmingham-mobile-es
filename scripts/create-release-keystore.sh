#!/usr/bin/env bash
# Keystore de release para sideload (no subir contraseñas a otro sitio).
set -euo pipefail
KEYSTORE="android/app/brass-release.jks"
if [ -f "$KEYSTORE" ]; then
  echo "Keystore ya existe: $KEYSTORE"
  exit 0
fi
mkdir -p android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore "$KEYSTORE" \
  -alias brass-mobile \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass brassmobile2026 -keypass brassmobile2026 \
  -dname "CN=Brass Movil ES, OU=Mobile, O=Lendherm, L=MX, ST=NA, C=MX"
echo "Creado $KEYSTORE"
