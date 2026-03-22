import requests

# Login to get token
resp = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "superadmin@test.com", "password": "password123"})
if resp.status_code == 200:
    token = resp.json()["access_token"]
    
    # Fetch students
    st_resp = requests.get("http://localhost:8000/api/v1/admin/students", headers={"Authorization": f"Bearer {token}"})
    print(st_resp.status_code)
    import json
    print(json.dumps(st_resp.json(), indent=2))
else:
    print("Login failed", resp.status_code, resp.text)
