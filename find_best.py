import json
import os

log = r'C:\Users\dell\.gemini\antigravity\brain\2d35a7c6-937d-4f04-98a8-1d4ed3d6cab1\.system_generated\logs\overview.txt'
with open(log, 'r', encoding='utf-8') as f:
    lines = f.readlines()

max_len = 0
best_content = ""

for line in reversed(lines):
    if 'tool_calls' in line:
        json_start = line.find('{')
        if json_start != -1:
            try:
                obj = json.loads(line[json_start:])
                for call in obj.get('tool_calls', []):
                    args = call.get('args', {})
                    if 'ReplacementChunks' in args:
                        for chunk in args['ReplacementChunks']:
                            if 'TargetContent' in chunk:
                                length = len(chunk['TargetContent'])
                                if length > max_len:
                                    max_len = length
                                    best_content = chunk['TargetContent']
                    if 'TargetContent' in args:
                        length = len(args['TargetContent'])
                        if length > max_len:
                            max_len = length
                            best_content = args['TargetContent']
            except Exception:
                pass

print(f"Max length found: {max_len}")
if best_content:
    with open('best_content.txt', 'w', encoding='utf-8') as f:
        f.write(best_content)
