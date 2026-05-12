import google.generativeai as genai

genai.configure(api_key="AIzaSyB3Btp0vidb6FfQ9fzImFAWyHuTH-HDsnQ")

for m in genai.list_models():
    print(m.name, m.supported_generation_methods)