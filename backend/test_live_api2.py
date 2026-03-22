import urllib.request
import urllib.parse
import json

data = urllib.parse.urlencode({"username": "superadmin@test.com", "password": "password123"}).encode("ascii")
req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=data)
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        token = res["access_token"]
        
        req2 = urllib.request.Request("http://localhost:8000/api/v1/admin/students", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req2) as resp2:
            print(json.loads(resp2.read().decode())[0])
except Exception as e:
    print(e)
