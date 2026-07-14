import httpx
import csv
from io import StringIO

url = "https://docs.google.com/spreadsheets/d/1oGc1iGpacELS6tkHjesvAeKZo8v2iv4UkYFY04e0p-I/export?format=csv&gid=0"
response = httpx.get(url)
response.raise_for_status()

csv_reader = csv.reader(StringIO(response.text))
du_names = set()
for row in csv_reader:
    if row and len(row) > 0:
        name = row[0].strip()
        if name and name not in ["DU Name", "PRIVATEINVESTOR OWNED UTILITIES", "ELECTRIC COOPERATIVES", "LUZON", "VISAYAS", "MINDANAO", "REGION 1", "REGION 2", "REGION 3", "REGION 4A", "REGION 4B", "REGION 5", "CAR", "BARMM"] and "Region" not in name:
            du_names.add(name)

print("--- DU NAMES IN CSV ---")
for n in sorted(list(du_names)):
    print(n)
