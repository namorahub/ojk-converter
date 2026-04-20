export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const sys = `Kamu adalah ekstractor data laporan kepemilikan saham OJK Indonesia (POJK 4/2024). Ekstrak semua data transaksi. Kembalikan HANYA JSON murni tanpa markdown. Format: {"kode_saham":"kode bursa","big_player":"nama lengkap","jabatan":"Direksi/Dewan Komisaris/kosong","jumlah_sebelum_total":0,"transaksi":[{"tanggal":"MM/DD/YYYY","jenis":"Pembelian atau Penjualan","jumlah_unit":0,"harga":0}]}`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, system: sys, messages: [{ role: 'user', content: 'Ekstrak:\n\n' + text.slice(0, 12000) }] })
    });
    const d = await r.json();
    if (d.error) return res.status(400).json({ error: d.error.message });
    const raw = d.content?.find(b => b.type === 'text')?.text || '';
    return res.status(200).json(JSON.parse(raw.replace(/```json|```/g, '').trim()));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
