import urllib.request
import urllib.error
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SUPABASE_URL = "https://nshrxfsceujjvpkysbmm.supabase.co"
SUPABASE_PUBLISHABLE = "sb_publishable_0B3yvBpnoc-KAdxND87RXw_MQywLA9D"

def check_connection():
    print("=" * 60)
    print("Testing Supabase Cloud Database & Service Status...")
    print("=" * 60)
    
    table_url = f"{SUPABASE_URL}/rest/v1/quiz_records?select=count&limit=1"
    headers_pub = {
        "apikey": SUPABASE_PUBLISHABLE,
        "Authorization": f"Bearer {SUPABASE_PUBLISHABLE}"
    }
    
    req_table = urllib.request.Request(table_url, headers=headers_pub)
    try:
        with urllib.request.urlopen(req_table, timeout=10) as r:
            print("[SUCCESS] quiz_records table is READY! (HTTP 200)")
            print("Supabase cloud database is fully operational for both submissions and admin dashboard.")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        if e.code == 404 and "PGRST205" in body:
            print("[NOTICE] Supabase API key authenticated successfully, but table 'public.quiz_records' has not been created yet.")
            print("-" * 60)
            print("Please run the SQL in 'supabase_schema.sql' in the Supabase SQL Editor:")
            print("Direct URL: https://supabase.com/dashboard/project/nshrxfsceujjvpkysbmm/sql/new")
            print("-" * 60)
            return False
        else:
            print(f"[ERROR] HTTP {e.code}: {body}")
            return False
    except Exception as e:
        print(f"[ERROR] Network exception: {e}")
        return False

if __name__ == "__main__":
    check_connection()
