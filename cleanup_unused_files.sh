#!/bin/bash

# Script untuk membersihkan file-file yang tidak terpakai setelah migrasi ke MongoDB dan TypeScript + Chakra UI

echo "🧹 Membersihkan file-file yang tidak terpakai..."

# File backup yang sudah tidak diperlukan
echo "Menghapus file backup..."
rm -f /app/config.json.backup
rm -f /app/backend/server.py.backup

# File testing dan migration yang tidak diperlukan lagi
echo "Menghapus file testing dan migration..."
rm -f /app/mongodb_migration_test.py
rm -f /app/backend_test.py
rm -f /app/backend_migration_test.py

# File config.json legacy (sekarang menggunakan MongoDB terenkripsi)
echo "Menghapus config.json legacy (menggunakan MongoDB terenkripsi)..."
rm -f /app/config.json

# Membersihkan cache Python
echo "Membersihkan cache Python..."
find /app -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find /app -name "*.pyc" -delete 2>/dev/null || true

# Membersihkan yarn.lock di root (duplikat dengan frontend)
echo "Menghapus yarn.lock duplikat..."
rm -f /app/yarn.lock

# Membersihkan file log lama jika ada
echo "Membersihkan log files lama..."
find /app/backend/logs -name "*.log.*" -delete 2>/dev/null || true

# Membersihkan session files lama jika ada
echo "Membersihkan session files lama..."
find /app/backend/telegram_sessions -name "*.session-journal" -delete 2>/dev/null || true

echo "✅ Pembersihan file selesai!"
echo ""
echo "📋 File yang sudah dihapus:"
echo "   - File backup (config.json.backup, server.py.backup)"
echo "   - File testing legacy (mongodb_migration_test.py, backend_test.py, backend_migration_test.py)"
echo "   - Config.json legacy (sekarang menggunakan MongoDB terenkripsi)"
echo "   - Cache Python (__pycache__, *.pyc)"
echo "   - Yarn.lock duplikat"
echo "   - Log files dan session files lama"
echo ""
echo "🎯 Proyek sekarang lebih bersih dan fokus!"