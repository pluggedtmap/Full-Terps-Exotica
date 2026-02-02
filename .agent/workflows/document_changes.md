---
description: Automatically document recent changes into Obsidian
---

1. [Optional] View the file `c:/Users/simon/Documents/Obsidian/Mini app/Projet MiniApp/Prompt/AUTO_DOCUMENTATION_PROMPT.md` to refresh your instructions.
2. Ask yourself: "What changes did I just make or what file is the user focused on?"
3. Identify the correct project (`Hashboyz75`, `Jefecali`, or `hashfiltered`) based on the file path or context.
4. Determine the type of the change (Backend, Frontend, Admin, etc.).
5. Construct the target path using the rule: `c:/Users/simon/Documents/Obsidian/Mini app/Projet MiniApp/[ProjectName]/[HubNamespace]/[Category]/[FeatureName].md`.
   - Example namespaces: `Obsidian_hashboyz`, `JefeCali_Obsidian`, `Obsidianhashfiltered`.
6. Generate the content using the "Atomic Note" template (see PROMPT file).
   - Ensure you use frontmatter: `tags: [...]`.
   - Ensure you use WikiLinks: `[[...]]`.
7. Write the file using `write_to_file`.
8. Notify the user that the documentation has been updated.
