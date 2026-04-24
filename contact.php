<?php
/**
 * contact.php — receive the contact form POST and email it.
 *
 * Lightweight standalone handler for the static site:
 *   • Accepts JSON or urlencoded POST bodies
 *   • Basic honeypot + rate-limiting spam filter
 *   • Sends via the server's mail() transport
 *   • Returns JSON so the JS frontend can show inline success/error
 *
 * Drop this file at the site root (same directory as contact.html) and
 * the form's action="contact.php" will hit it.
 *
 * Configure:
 *   $RECIPIENT  – where the form lands
 *   $FROM       – the From: address (usually noreply@yourdomain)
 *   $SITE_NAME  – used in subject line
 *
 * Requires PHP 7.4+. No external dependencies.
 */

// ---- CONFIG -----------------------------------------------------------
$RECIPIENT = 'wernsdorfer@gmail.com';
$FROM      = 'noreply@markwernsdorfer.com';
$SITE_NAME = 'markwernsdorfer.com';
// Rate limit: max N submissions per IP per hour (simple file-based)
$RATE_LIMIT = 5;
$RATE_WINDOW_SEC = 3600;
$RATE_DIR = sys_get_temp_dir() . '/wc_contact_rate';
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

// --- HONEYPOT -----------------------------------------------------------
// The form includes a visually-hidden <input name="website">. Real users
// never fill it; bots tend to fill every text field. If set, we silently
// "succeed" so the bot doesn't retry.
if ($get('website') !== '') {
    echo json_encode(['ok' => true, 'honeypot' => true]);
    exit;
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

// Simple length checks — anything wildly large is probably a bot.
if (strlen($msg) > 10000 || strlen($name) > 200 || strlen($org) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Field too long']);
    exit;
}

// --- RATE LIMIT ---------------------------------------------------------
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
