<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = 'ck60547_tema';
$username = 'ck60547_tema';
$password = 'M6ydrHLU';
$host = 'localhost';

try {
    $conn = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$path = $_SERVER['REQUEST_URI'];
$path = str_replace('/api_artikotus.php', '', $path);
$path = trim($path, '/');

$method = $_SERVER['REQUEST_METHOD'];

if ($path == 'register' && $method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $login = $input['username'] ?? '';
    $pass = $input['password'] ?? '';
    
    if (strlen($login) < 3) {
        echo json_encode(['error' => 'Login too short']);
        exit();
    }
    
    if (strlen($pass) < 8) {
        echo json_encode(['error' => 'Password too short']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT id FROM users WHERE login = ?");
    $stmt->execute([$login]);
    if ($stmt->fetch()) {
        echo json_encode(['error' => 'User already exists']);
        exit();
    }
    
    $passwordHash = password_hash($pass, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (login, password_hash, crystals, coins) VALUES (?, ?, 150, 500)");
    $stmt->execute([$login, $passwordHash]);
    
    $stmt = $conn->prepare("SELECT id, login, crystals, coins, created_at FROM users WHERE login = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $_SESSION['user'] = $user;
    echo json_encode(['success' => true, 'user' => $user]);
    exit();
}

if ($path == 'login' && $method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $login = $input['username'] ?? '';
    $pass = $input['password'] ?? '';
    
    $stmt = $conn->prepare("SELECT id, login, password_hash, crystals, coins, created_at FROM users WHERE login = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($pass, $user['password_hash'])) {
        echo json_encode(['error' => 'Invalid credentials']);
        exit();
    }
    
    unset($user['password_hash']);
    $_SESSION['user'] = $user;
    echo json_encode(['success' => true, 'user' => $user]);
    exit();
}

if ($path == 'logout' && $method == 'POST') {
    unset($_SESSION['user']);
    session_destroy();
    echo json_encode(['success' => true]);
    exit();
}

if ($path == 'me' && $method == 'GET') {
    if (isset($_SESSION['user'])) {
        echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
    } else {
        echo json_encode(['error' => 'Not logged in']);
    }
    exit();
}

echo json_encode(['error' => 'Route not found', 'path' => $path]);
