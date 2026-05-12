import json

log_path = r'C:\Users\dell\.gemini\antigravity\brain\2d35a7c6-937d-4f04-98a8-1d4ed3d6cab1\.system_generated\logs\overview.txt'
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    if 'App.jsx' in line:
        try:
            json_start = line.find('{')
            if json_start != -1:
                obj = json.loads(line[json_start:])
                for call in obj.get('tool_calls', []):
                    params = call.get('parameters', {})
                    if 'ReplacementChunks' in params:
                        for chunk in params['ReplacementChunks']:
                            if 'TargetContent' in chunk:
                                print("Found chunk TargetContent length:", len(chunk['TargetContent']))
                    if 'TargetContent' in params:
                        print("Found TargetContent length:", len(params['TargetContent']))
                    if 'CodeContent' in params:
                        print("Found CodeContent length:", len(params['CodeContent']))
        except Exception as e:
            pass
