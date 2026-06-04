import requests
import os
from dotenv import load_dotenv
load_dotenv()

URL = os.getenv("SUPABASE_URL", "")
KEY = os.getenv("SUPABASE_ANON_KEY", "")

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get_db():
    return SupabaseClient()

class SupabaseClient:
    def table(self, name):
        return Table(name)

    class auth:
        @staticmethod
        def sign_in_with_password(data):
            r = requests.post(
                f"{URL}/auth/v1/token?grant_type=password",
                json={"email": data["email"], "password": data["password"]},
                headers={"apikey": KEY, "Content-Type": "application/json"}
            )
            result = r.json()
            if r.status_code == 200:
                class User:
                    id = result.get("user", {}).get("id")
                    email = result.get("user", {}).get("email")
                class Res:
                    user = User()
                return Res()
            return type("Res", (), {"user": None})()

        @staticmethod
        def sign_up(data):
            r = requests.post(
                f"{URL}/auth/v1/signup",
                json={"email": data["email"], "password": data["password"]},
                headers={"apikey": KEY, "Content-Type": "application/json"}
            )
            result = r.json()
            if r.status_code == 200 and result.get("id"):
                class User:
                    id = result.get("id")
                    email = result.get("email")
                class Res:
                    user = User()
                return Res()
            return type("Res", (), {"user": None})()

class Table:
    def __init__(self, name):
        self.name = name
        self._filters = []

    def upsert(self, data):
        self._data = data
        return self

    def insert(self, data):
        self._data = data
        return self

    def select(self, cols="*"):
        self._cols = cols
        return self

    def eq(self, col, val):
        self._filters.append(f"{col}=eq.{val}")
        return self

    def execute(self):
        url = f"{URL}/rest/v1/{self.name}"
        if hasattr(self, "_data"):
            r = requests.post(url, json=self._data, headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=representation"})
            return type("Res", (), {"data": r.json(), "error": None if r.ok else r.json()})()
        params = "&".join(self._filters) if self._filters else ""
        r = requests.get(f"{url}?{params}", headers=HEADERS)
        return type("Res", (), {"data": r.json(), "error": None if r.ok else r.json()})()
