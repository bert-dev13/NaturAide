const m = require('mysql2/promise');
(async () => {
  const c = await m.createConnection({ host: 'localhost', user: 'root', database: 'natureaide_db' });
  const q = async (s) => { const [r] = await c.query(s); return r; };
  console.log((await q('SHOW COLUMNS FROM literature_references')).map(x => x.Field + ':' + x.Type).join(', '));
  console.log(await q('SELECT COUNT(*) n, COUNT(projectId) withProject FROM literature_references').catch(e => e.message));
  console.log(await q('SELECT id, projectId, title, plantOrCompound FROM literature_references LIMIT 20').catch(e => e.message));
  await c.end();
})();
