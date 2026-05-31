#!/data/data/com.termux/files/usr/bin/bash
echo "Installation AfriMarket Python..."
pkg install -y python git -q
mkdir -p templates/errors routers static/css static/js static/images
touch routers/__init__.py
pip install fastapi uvicorn jinja2 python-dotenv supabase python-jose passlib slowapi python-multipart httpx -q
echo "DONE"
