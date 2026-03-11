const baseUrl = process.env.ADMIN_BASE_URL || 'http://localhost:4321';
const locale = process.env.ADMIN_LOCALE || 'es';

async function run() {
  const listRes = await fetch(`${baseUrl}/api/admin/home`);
  const listJson = await listRes.json();

  console.log('[list] status=', listRes.status, 'ok=', listJson.ok, 'rows=', listJson.data?.length ?? 0);

  const detailRes = await fetch(`${baseUrl}/api/admin/home/${locale}`);
  const detailJson = await detailRes.json();

  console.log('[detail] status=', detailRes.status, 'ok=', detailJson.ok, 'locale=', detailJson.data?.localeCode ?? 'n/a');

  if (!detailJson.data) {
    throw new Error('No detail data found, cannot run update smoke');
  }

  const updatePayload = {
    ...detailJson.data,
    subtitle: `${detailJson.data.subtitle}`,
  };

  delete updatePayload.localeCode;
  delete updatePayload.pageKey;
  delete updatePayload.updatedAt;

  const putRes = await fetch(`${baseUrl}/api/admin/home/${locale}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload),
  });
  const putJson = await putRes.json();

  console.log('[update] status=', putRes.status, 'ok=', putJson.ok);

  if (!listJson.ok || !detailJson.ok || !putJson.ok) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('[smoke] failed:', error.message);
  process.exitCode = 1;
});

