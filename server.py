#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌱 心情与能量小打卡 - 轻量级独立后台服务
基于 Python 标准库构建，零第三方依赖 (无需 pip install)
内置 SQLite 数据库持久化存储与 RESTful API
"""

import os
import sys
import json
import sqlite3
import mimetypes
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# 端口配置
PORT = 8080
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "psychological_data.db")
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

# 兼容 Windows GBK 控制台编码
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def init_db():
    """初始化 SQLite 数据库"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY,
            name TEXT,
            class_group TEXT,
            total_score INTEGER,
            battery_level INTEGER,
            status_tag TEXT,
            headline TEXT,
            grade_key TEXT,
            is_alert INTEGER,
            secret_note TEXT,
            submit_time TEXT,
            answers_json TEXT,
            client_ip TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print(f"[OK] SQLite database initialized: {DB_FILE}")

class SimpleRequestHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # 允许跨域请求 CORS，支持从 GitHub Pages 跨域上传和读取
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. 健康检查探测接口
        if path == "/api/health":
            self.send_json({"status": "ok", "message": "Backend server is running.", "db": DB_FILE})
            return

        # 2. 管理员拉取全部数据接口
        if path == "/api/admin/records":
            self.get_admin_records()
            return

        # 3. 静态文件代理（访问 / 或 index.html 等）
        self.serve_static_file(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. 普通用户提交答卷接口
        if path == "/api/submit":
            self.post_submit_record()
            return

        # 2. 清空所有数据接口
        if path == "/api/admin/records/clear":
            self.clear_all_records()
            return

        self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 删除单条记录: /api/admin/records/{id}
        if path.startswith("/api/admin/records/"):
            rec_id = path.split("/")[-1]
            self.delete_record(rec_id)
            return

        self.send_error(404, "Endpoint not found")

    def get_admin_records(self):
        try:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM records ORDER BY created_at DESC")
            rows = cursor.fetchall()

            result = []
            for row in rows:
                answers = {}
                if row["answers_json"]:
                    try:
                        answers = json.loads(row["answers_json"])
                    except:
                        pass

                result.append({
                    "id": row["id"],
                    "name": row["name"],
                    "group": row["class_group"],
                    "totalScore": row["total_score"],
                    "batteryLevel": row["battery_level"],
                    "statusTag": row["status_tag"],
                    "headline": row["headline"],
                    "gradeKey": row["grade_key"],
                    "isAlert": bool(row["is_alert"]),
                    "secretNote": row["secret_note"],
                    "submitTime": row["submit_time"],
                    "answers": answers,
                    "clientIp": row["client_ip"]
                })
            conn.close()
            self.send_json(result)
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def post_submit_record(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            rec_id = data.get("id") or f"rec_{int(datetime.now().timestamp()*1000)}"
            name = data.get("name", "神秘小天使")
            group = data.get("group", "未填写")
            total_score = data.get("totalScore", 0)
            battery_level = data.get("batteryLevel", 90)
            status_tag = data.get("statusTag", "")
            headline = data.get("headline", "")
            grade_key = data.get("gradeKey", "green")
            is_alert = 1 if data.get("isAlert") else 0
            secret_note = data.get("secretNote", "")
            submit_time = data.get("submitTime", datetime.now().strftime("%Y-%m-%d %H:%M"))
            answers_json = json.dumps(data.get("answers", {}), ensure_ascii=False)
            client_ip = self.client_address[0]

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO records 
                (id, name, class_group, total_score, battery_level, status_tag, headline, grade_key, is_alert, secret_note, submit_time, answers_json, client_ip)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (rec_id, name, group, total_score, battery_level, status_tag, headline, grade_key, is_alert, secret_note, submit_time, answers_json, client_ip))
            conn.commit()
            conn.close()

            print(f"[New Submission] Name: {name} ({group}), Score: {total_score}, Alert: {'YES' if is_alert else 'NO'}")
            self.send_json({"success": True, "id": rec_id})
        except Exception as e:
            print("Submission error:", e)
            self.send_json({"error": str(e)}, status=500)

    def delete_record(self, rec_id):
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM records WHERE id = ?", (rec_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "deleted": rec_id})
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def clear_all_records(self):
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM records")
            conn.commit()
            conn.close()
            self.send_json({"success": True, "cleared": True})
        except Exception as e:
            self.send_json({"error": str(e)}, status=500)

    def serve_static_file(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        
        file_path = os.path.normpath(os.path.join(STATIC_DIR, path.lstrip("/")))
        if not file_path.startswith(STATIC_DIR):
            self.send_error(403, "Access denied")
            return

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            self.send_error(404, "File not found")
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or "application/octet-stream"

        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def run_server():
    init_db()
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, SimpleRequestHandler)
    print("=" * 60)
    print(f"[*] Psychological Test Backend Server Started!")
    print(f"[*] Local URL: http://localhost:{PORT}")
    print(f"[*] SQLite DB: {DB_FILE}")
    print(f"[*] Default Admin Password: admin123")
    print(f"[*] Press Ctrl+C to stop.")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    run_server()
