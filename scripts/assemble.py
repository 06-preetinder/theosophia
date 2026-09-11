
from pathlib import Path

out_path = Path("src/frontend/static/index.html")
out_path.parent.mkdir(parents=True, exist_ok=True)

with open(out_path, "w", encoding="utf-8") as f:
    f.write("<!DOCTYPE html>\n<html lang=\"en\" data-theme=\"light\">\n<head>\n")
    f.write("<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n")
    f.write("<title>Theosophia: Autonomous Enterprise Knowledge Synthesis & Skill Compilation</title>\n")


    f.write("<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n")
    f.write("<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n")
    f.write("<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n")
    f.write("<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark-dimmed.min.css\">\n")
    f.write("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js\"></script>\n")
    f.write("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js\"></script>\n")
    f.write("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js\"></script>\n")
    f.write("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/yaml.min.js\"></script>\n")
    f.write("<script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js\"></script>\n")

