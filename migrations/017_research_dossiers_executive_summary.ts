import type { Migration, DbExecutor } from "../src/lib/migration-helpers";
import { addColumnIfNotExists } from "../src/lib/migration-helpers";

/**
 * Section 3 Research Summary stores the compiled executive summary on research_dossiers.
 * Older migrate-only databases created the table without this column.
 */
export const migration: Migration = {
  id: "017_research_dossiers_executive_summary",
  domain: "researcher",
  name: "Add executiveSummary to research_dossiers",
  up: async (conn: DbExecutor) => {
    await addColumnIfNotExists(
      conn,
      "research_dossiers",
      "executiveSummary",
      "LONGTEXT NULL AFTER status"
    );
  },
};
