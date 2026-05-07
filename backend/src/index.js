require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const Stripe      = require('stripe');
const PDFDocument = require('pdfkit');

const app    = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ── Supabase admin client (service role — server only) ─
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Raw body needed for Stripe webhooks
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── Auth helper ────────────────────────────────────────
async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

// ── GET /api/health ────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }));

// ── POST /api/calculations ─────────────────────────────
// Save a calculation (requires auth)
app.post('/api/calculations', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required to save' });

  const { title, notes, expenses } = req.body;
  if (!expenses?.length) return res.status(422).json({ error: 'At least one expense required' });

  const { data: calc, error: cErr } = await supabase
    .from('calculations')
    .insert({ user_id: user.id, title: title || 'Expense Split', notes })
    .select().single();
  if (cErr) return res.status(500).json({ error: cErr.message });

  const rows = expenses.map(e => ({
    calculation_id: calc.id,
    description:    e.description,
    amount:         parseFloat(e.amount),
    category:       e.category || 'Other',
    paid_by:        e.paidBy   || 'Parent A',
    split_a:        parseInt(e.splitA ?? 50),
  }));

  const { error: eErr } = await supabase.from('expenses').insert(rows);
  if (eErr) return res.status(500).json({ error: eErr.message });

  res.status(201).json({ id: calc.id, shareToken: calc.share_token });
});

// ── GET /api/calculations ──────────────────────────────
// List user's saved calculations (requires auth)
app.get('/api/calculations', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('calculations')
    .select('id, title, notes, share_token, created_at, expenses(id, description, amount, paid_by, split_a)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/share/:token ──────────────────────────────
// Public — fetch a shared calculation by token
app.get('/api/share/:token', async (req, res) => {
  const { data, error } = await supabase
    .from('calculations')
    .select('id, title, notes, created_at, expenses(*)')
    .eq('share_token', req.params.token)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// ── DELETE /api/calculations/:id ──────────────────────
app.delete('/api/calculations/:id', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { error } = await supabase
    .from('calculations')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── GET /api/calculations/:id/pdf ─────────────────────
// Generate PDF — requires valid purchase
app.get('/api/calculations/:id/pdf', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });

  // Check purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .limit(1)
    .single();

  if (!purchase && req.query.preview !== 'true') {
    return res.status(402).json({ error: 'PDF export requires purchase', code: 'PAYMENT_REQUIRED' });
  }

  const { data: calc, error } = await supabase
    .from('calculations')
    .select('*, expenses(*)')
    .eq('id', req.params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !calc) return res.status(404).json({ error: 'Not found' });

  // Build PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="coparentingpay-${calc.id.slice(0,8)}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a3d5c').text('CoParenting Pay', { align: 'center' });
  doc.fontSize(11).font('Helvetica').fillColor('#666').text('Expense Split Summary', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#111').text(calc.title, { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#888').text(`Generated: ${new Date().toLocaleDateString('en-AU')}`, { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#ddd');
  doc.moveDown();

  const expenses = calc.expenses || [];
  let totalA = 0, totalB = 0;

  // Table header
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#555');
  doc.text('Description',  50,  doc.y, { width: 180 });
  doc.text('Category',     230, doc.y - doc.currentLineHeight(), { width: 90 });
  doc.text('Amount',       320, doc.y - doc.currentLineHeight(), { width: 70, align: 'right' });
  doc.text('Paid By',      390, doc.y - doc.currentLineHeight(), { width: 70 });
  doc.text('Split',        460, doc.y - doc.currentLineHeight(), { width: 85, align: 'right' });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.3).stroke('#ccc');
  doc.moveDown(0.3);

  doc.fontSize(9).font('Helvetica').fillColor('#222');
  expenses.forEach(e => {
    const owedByA = e.paid_by === 'Parent B' ? (e.amount * e.split_a / 100) : 0;
    const owedByB = e.paid_by === 'Parent A' ? (e.amount * (100 - e.split_a) / 100) : 0;
    totalA += owedByA;
    totalB += owedByB;

    const y = doc.y;
    doc.text(e.description.slice(0, 28), 50,  y, { width: 180 });
    doc.text(e.category,                 230, y, { width: 90 });
    doc.text(`$${parseFloat(e.amount).toFixed(2)}`, 320, y, { width: 70, align: 'right' });
    doc.text(e.paid_by,                  390, y, { width: 70 });
    doc.text(`${e.split_a}/${100-e.split_a}`, 460, y, { width: 85, align: 'right' });
    doc.moveDown(0.6);
    if (doc.y > 750) doc.addPage();
  });

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#333');
  doc.moveDown(0.5);

  // Summary box
  const balance = totalA - totalB;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a3d5c');
  doc.text('Summary', 50);
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(`Parent A owes: $${totalA.toFixed(2)}`, 50);
  doc.text(`Parent B owes: $${totalB.toFixed(2)}`, 50);
  doc.moveDown(0.3);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(balance > 0 ? '#1d6a36' : '#c0392b');
  if (Math.abs(balance) < 0.01) {
    doc.text('✓ Balanced — no payment needed', 50);
  } else if (balance > 0) {
    doc.text(`→ Parent B pays Parent A: $${balance.toFixed(2)}`, 50);
  } else {
    doc.text(`→ Parent A pays Parent B: $${Math.abs(balance).toFixed(2)}`, 50);
  }

  if (calc.notes) {
    doc.moveDown(0.8);
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#888').text(`Notes: ${calc.notes}`, 50);
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#bbb').text('CoParenting Pay — coparentingpay.app', { align: 'center' });
  doc.end();
});

// ── POST /api/checkout ─────────────────────────────────
// Create Stripe checkout session for $4.99 PDF unlock
app.post('/api/checkout', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Login required' });

  const { calculationId } = req.body;
  const origin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    mode:                 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency:     'usd',
        unit_amount:  499,
        product_data: {
          name:        'CoParenting Pay — PDF Export + History',
          description: 'One-time unlock: export any calculation as PDF and access full history.',
        },
      },
      quantity: 1,
    }],
    metadata: { user_id: user.id, calculation_id: calculationId || '' },
    success_url: `${origin}/dashboard?unlocked=1`,
    cancel_url:  `${origin}/dashboard`,
  });

  // Record pending purchase
  await supabase.from('purchases').insert({
    user_id:          user.id,
    calculation_id:   calculationId || null,
    stripe_session_id: session.id,
    status:           'pending',
  });

  res.json({ url: session.url });
});

// ── POST /api/webhooks/stripe ──────────────────────────
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook signature invalid');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await supabase
      .from('purchases')
      .update({ status: 'completed' })
      .eq('stripe_session_id', session.id);
  }

  res.json({ received: true });
});

// ── GET /api/me/unlocked ───────────────────────────────
// Check if user has purchased
app.get('/api/me/unlocked', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({ unlocked: false });

  const { data } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .limit(1);

  res.json({ unlocked: !!(data && data.length > 0) });
});

// ── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CoParenting Pay API → http://localhost:${PORT}`));

module.exports = app;
