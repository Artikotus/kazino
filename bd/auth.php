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

$database = getenv('DB_NAME') ?: '';
$username = getenv('DB_USER') ?: '';
$password = getenv('DB_PASSWORD') ?: '';
$host = getenv('DB_HOST') ?: 'localhost';

if ($database === '' || $username === '' || $password === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Server DB config missing', 'message' => 'Server DB config missing']);
    exit();
}

try {
    $conn = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

$path = $_SERVER['PATH_INFO'] ?? '';
if ($path === '') {
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    if ($scriptName !== '' && str_starts_with($requestPath, $scriptName)) {
        $path = substr($requestPath, strlen($scriptName));
    } else {
        $path = $requestPath;
    }
}
$path = trim($path, '/');
$path = $_GET['action'] ?? $path;

$method = $_SERVER['REQUEST_METHOD'];

if ($path == 'register' && $method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $login = $input['username'] ?? '';
    $pass = $input['password'] ?? '';
    
    if (strlen($login) < 3) {
        http_response_code(400);
        echo json_encode(['error' => 'Login too short', 'message' => 'Login too short']);
        exit();
    }
    
    if (strlen($pass) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password too short', 'message' => 'Password too short']);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT id FROM users WHERE login = ?");
    $stmt->execute([$login]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'User already exists', 'message' => 'User already exists']);
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
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials', 'message' => 'Invalid credentials']);
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
        http_response_code(401);
        echo json_encode(['error' => 'Not logged in', 'message' => 'Not logged in']);
    }
    exit();
}

http_response_code(404);
echo json_encode(['error' => 'Route not found', 'path' => $path]);
