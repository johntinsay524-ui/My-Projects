<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents('php://input'), true);

// Check for special action inside POST
$action = $input['action'] ?? null;

switch ($method) {

    // ── GET: Fetch all items ──────────────────────────────────────
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM inventory ORDER BY created_at DESC');
        echo json_encode($stmt->fetchAll());
        break;

    // ── POST: Add new item OR Sell stock ──────────────────────────
    case 'POST':
        if ($action === 'sell') {
            // Sell stock: reduce quantity, increase sold
            $id  = (int)$input['id'];
            $qty = (int)$input['qty'];

            // Check current quantity first
            $check = $pdo->prepare('SELECT quantity FROM inventory WHERE id = :id');
            $check->execute([':id' => $id]);
            $row = $check->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Item not found.']);
                break;
            }
            if ($row['quantity'] < $qty) {
                http_response_code(400);
                echo json_encode(['error' => 'Not enough stock. Available: ' . $row['quantity']]);
                break;
            }

            $stmt = $pdo->prepare(
                'UPDATE inventory SET quantity = quantity - :qty, sold = sold + :qty2 WHERE id = :id'
            );
            $stmt->execute([':qty' => $qty, ':qty2' => $qty, ':id' => $id]);
            echo json_encode(['success' => true]);

        } else {
            // Add new item
            $sql  = 'INSERT INTO inventory (itemID, itemName, category, quantity, price, supplier, sold)
                     VALUES (:itemID, :itemName, :category, :quantity, :price, :supplier, 0)';
            $stmt = $pdo->prepare($sql);
            try {
                $stmt->execute([
                    ':itemID'   => $input['itemID'],
                    ':itemName' => $input['itemName'],
                    ':category' => $input['category'],
                    ':quantity' => (int)$input['quantity'],
                    ':price'    => (float)$input['price'],
                    ':supplier' => $input['supplier'],
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } catch (PDOException $e) {
                http_response_code(409);
                echo json_encode(['error' => 'Item ID already exists.']);
            }
        }
        break;

    // ── PUT: Update existing item ─────────────────────────────────
    case 'PUT':
        $sql  = 'UPDATE inventory
                 SET itemID=:itemID, itemName=:itemName, category=:category,
                     quantity=:quantity, price=:price, supplier=:supplier
                 WHERE id=:id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'       => (int)$input['id'],
            ':itemID'   => $input['itemID'],
            ':itemName' => $input['itemName'],
            ':category' => $input['category'],
            ':quantity' => (int)$input['quantity'],
            ':price'    => (float)$input['price'],
            ':supplier' => $input['supplier'],
        ]);
        echo json_encode(['success' => true]);
        break;

    // ── DELETE: Remove item ───────────────────────────────────────
    case 'DELETE':
        $id   = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare('DELETE FROM inventory WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
