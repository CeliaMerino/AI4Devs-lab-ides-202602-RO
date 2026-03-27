# Update documentation

After code changes, align technical documentation with `ai-specs/specs/documentation-standards.mdc`.

## What to do

1. Review recent changes (API, data model, setup, libraries).
2. Update affected files, for example:
   - **Data / domain** → `ai-specs/specs/data-model.md`
   - **REST API** → `ai-specs/specs/api-spec.yml`
   - **Install / run / env** → `ai-specs/specs/development_guide.md` and root `README.md` as needed
   - **Standards** → `*-standards.mdc` only when global conventions change
3. Keep all documentation in **English** and consistent with existing structure.
4. Report which files were updated and what changed.

Invoke this command when finishing a feature or when asked to refresh docs after implementation.
