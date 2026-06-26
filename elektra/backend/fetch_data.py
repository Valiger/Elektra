import httpx
import csv

url = "https://docs.google.com/spreadsheets/d/1oGc1iGpacELS6tkHjesvAeKZo8v2iv4UkYFY04e0p-I/export?format=csv&gid=0"
res = httpx.get(url, timeout=15, follow_redirects=True)
lines = res.text.splitlines()
reader = csv.reader(lines)
for row in reader:
    if any(keyword in c for c in row for keyword in ["SORECO", "Sorsogon", "MASELCO", "Masbate", "SORSECO"]):
        print(row)
