<?php
/**
 * contact.php — receive the contact form POST and email it.
 *
 * Lightweight standalone handler for the static site:
 *   • Accepts JSON or urlencoded POST bodies
 *   • Multi-layer spam filter (honeypot, time-trap, content heuristics,
 *     duplicate detection, IP rate limit, optional Cloudflare Turnstile)
 *   • Sends via the server's mail() transport
 *   • Returns JSON so the JS frontend can show inline success/error
 *
 * Drop this file at the site root (same directory as contact.html) and
 * the form's action="contact.php" will hit it.
 *
 * Configure:
 *   $RECIPIENT          – where the form lands
 *   $FROM               – the From: address (usually noreply@yourdomain)
 *   $SITE_NAME          – used in subject line
 *   $TURNSTILE_SECRET   – Cloudflare Turnstile secret (optional; leave
 *                         empty to disable). Sign up free at
 *                         https://dash.cloudflare.com/?to=/turnstile.
 *                         When set, also un-comment the matching
 *                         <script> and <div class="cf-turnstile"> in
 *                         contact.html and en/contact.html and fill in
 *                         the data-sitekey there.
 *
 * Requires PHP 7.4+. No external dependencies.
 */

// ---- CONFIG -----------------------------------------------------------
$RECIPIENT = 'wernsdorfer@gmail.com';
$FROM      = 'noreply@markwernsdorfer.com';
$SITE_NAME = 'markwernsdorfer.com';
// IP rate limit: max N submissions per IP per hour (file-based)
$RATE_LIMIT       = 5;
$RATE_WINDOW_SEC  = 3600;
$RATE_DIR         = sys_get_temp_dir() . '/wc_contact_rate';
// Duplicate-detection window: ignore identical messages within this many seconds
$DUPE_WINDOW_SEC  = 86400;
$DUPE_DIR         = sys_get_temp_dir() . '/wc_contact_dupes';
// Time-trap: reject if form is submitted faster than this (ms after page load)
$MIN_FILL_MS      = 3000;
// Cloudflare Turnstile — leave empty to disable.
$TURNSTILE_SECRET = '';
// ---- END CONFIG -------------------------------------------------------

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Accept JSON bodies too (for fetch() POSTs that send application/json)
$body = $_POST;
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ct, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $parsed = json_decode($raw, true);
    if (is_array($parsed)) $body = $parsed;
}

// Fetch helper
$get = function (string $k, string $default = '') use ($body): string {
    return isset($body[$k]) ? trim((string)$body[$k]) : $default;
};

// Silent-success helper. Spam responses look identical to legit success
// so the bot doesn't retry or learn what tripped the filter.
$silentOk = function (): void {
    echo json_encode(['ok' => true]);
    exit;
};

// --- HONEYPOTS ----------------------------------------------------------
// Three hidden fields with names bots tend to fill: `website`, `phone2`,
// `fax`. Real users never see them; bots that auto-fill every text input
// will trip at least one. Any non-empty value = silent success.
foreach (['website', 'phone2', 'fax'] as $hp) {
    if ($get($hp) !== '') $silentOk();
}

// --- FIELD VALIDATION ---------------------------------------------------
$name  = $get('name');
$email = $get('email');
$org   = $get('org');
$topic = $get('topic');
$msg   = $get('msg');
$nda   = !empty($body['nda']) && $body['nda'] !== '0';

if ($name === '' || $email === '' || $msg === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Required fields missing', 'fields' => ['name', 'email', 'msg']]);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

// Length caps — anything wildly large is probably a bot.
if (strlen($msg) > 10000 || strlen($name) > 200 || strlen($org) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Field too long']);
    exit;
}

// --- TIME-TRAP ----------------------------------------------------------
// `_rt` is set by JS to Date.now() when the form mounts. If the submission
// arrives sooner than $MIN_FILL_MS after that, it's a bot. Submissions
// without `_rt` (no-JS users, raw curl POSTs) skip this check — the other
// layers will catch them.
$rt = (int)$get('_rt');
if ($rt > 0) {
    $nowMs = (int)(microtime(true) * 1000);
    if (($nowMs - $rt) < $MIN_FILL_MS) $silentOk();
}

// --- CONTENT HEURISTICS -------------------------------------------------
// Cheap pattern checks tuned for the spam this site actually receives.
// Tweak as new patterns show up.
$urlCount = preg_match_all('~(?:https?://|www\.)~i', $msg . ' ' . $org);
if ($urlCount >= 3) $silentOk();
// HTML tags inside the message body — almost always link-spam.
if (preg_match('~<[a-z/][^>]{0,200}>~i', $msg)) $silentOk();
// Long Cyrillic runs in name or message — extremely rare for a Berlin
// German/English consulting inquiry, common in spam.
if (preg_match('~[\x{0400}-\x{04FF}]{10,}~u', $name . ' ' . $msg)) $silentOk();
// BBCode tags ([url=...], [/url]) — classic forum-spam relic.
if (preg_match('~\[/?(?:url|link|img|b|i|u|color)~i', $msg)) $silentOk();

// --- DUPLICATE DETECTION ------------------------------------------------
// Same normalised message body within $DUPE_WINDOW_SEC = silent success.
// Bots blast the same body across many sites and often retry the same one.
@mkdir($DUPE_DIR, 0700, true);
$msgNorm = strtolower(preg_replace('~\s+~', ' ', $msg));
$dupeFile = $DUPE_DIR . '/' . md5($msgNorm);
if (is_file($dupeFile) && (time() - filemtime($dupeFile)) < $DUPE_WINDOW_SEC) {
    $silentOk();
}
@touch($dupeFile);

// --- IP RATE LIMIT ------------------------------------------------------
// One file per IP-hour bucket. Crude but works without a DB and is self-
// cleaning via tmp-file rotation.
@mkdir($RATE_DIR, 0700, true);
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = $RATE_DIR . '/' . md5($ip) . '_' . floor(time() / $RATE_WINDOW_SEC);
$count = file_exists($bucket) ? (int)file_get_contents($bucket) : 0;
if ($count >= $RATE_LIMIT) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded. Try again later.']);
    exit;
}
file_put_contents($bucket, $count + 1);

// --- CLOUDFLARE TURNSTILE -----------------------------------------------
// Server-side verification of the token the browser widget produced.
// Skipped entirely if $TURNSTILE_SECRET is empty. See top-of-file comment
// for activation steps.
if ($TURNSTILE_SECRET !== '') {
    $token = $get('cf-turnstile-response');
    if ($token === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Bot check missing — please reload the page.']);
        exit;
    }
    $verifyBody = http_build_query([
        'secret'   => $TURNSTILE_SECRET,
        'response' => $token,
        'remoteip' => $ip,
    ]);
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $verifyBody,
        'timeout' => 5,
    ]]);
    $verifyRes = @file_get_contents(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $ctx
    );
    $verifyJson = $verifyRes ? json_decode($verifyRes, true) : null;
    if (!is_array($verifyJson) || empty($verifyJson['success'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Bot check failed — please try again.']);
        exit;
    }
}

// --- SEND EMAIL ---------------------------------------------------------
$subject = "Anfrage über {$SITE_NAME} — " . ($topic !== '' ? $topic : 'Allgemein');
// Normalise line endings, strip header-injection attempts from email.
$safeEmail = preg_replace('/[\r\n]+/', ' ', $email);
$safeName  = preg_replace('/[\r\n]+/', ' ', $name);

$bodyText = "Neue Anfrage vom Kontaktformular\n"
          . "=================================\n\n"
          . "Name:          {$safeName}\n"
          . "E-Mail:        {$safeEmail}\n"
          . "Organisation:  {$org}\n"
          . "Thema:         {$topic}\n"
          . "NDA benötigt:  " . ($nda ? 'ja' : 'nein') . "\n\n"
          . "Nachricht:\n"
          . str_repeat('-', 40) . "\n"
          . $msg . "\n"
          . str_repeat('-', 40) . "\n\n"
          . "IP: {$ip}\n"
          . "Zeit: " . date('c') . "\n";

$headers  = "From: {$FROM}\r\n";
$headers .= "Reply-To: {$safeName} <{$safeEmail}>\r\n";
$headers .= "X-Mailer: {$SITE_NAME} contact.php\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";

$sent = @mail($RECIPIENT, $subject, $bodyText, $headers, '-f' . $FROM);
if (!$sent) {
    // Roll back the rate bucket — mail() failures aren't the user's fault.
    @file_put_contents($bucket, max(0, $count));
    http_response_code(500);
    echo json_encode(['error' => 'Mail send failed. Please email us directly.']);
    exit;
}

echo json_encode(['ok' => true]);
