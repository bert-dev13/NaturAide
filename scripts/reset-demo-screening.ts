import pool from "../src/lib/db";

export async function resetDemoScreening() {
  const [users]: any = await pool.query(
    "SELECT id, email, role FROM users WHERE email = 'community@natureaide.test'"
  );

  if (users.length === 0) {
    console.error("Community user not found!");
    return;
  }

  const userId = users[0].id;
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [userId]);
  console.log(`Successfully reset and removed all health screening records for user ID ${userId} (${users[0].email}).`);

  const [remaining]: any = await pool.query(
    "SELECT id FROM community_health_screenings WHERE userId = ?",
    [userId]
  );
  console.log(`Remaining screening records for demo user: ${remaining.length}`);
}

if (require.main === module) {
  resetDemoScreening()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
