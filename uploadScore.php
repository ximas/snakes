<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$_POST = json_decode(file_get_contents('php://input'), true);

$conn = mysqli_connect("localhost", $dbUsername, $dbPassword, $dbName);

$name = $_POST["player"];
$score = $_POST["score"];

if ($score && $name) {
    $_score = mysqli_real_escape_string($conn, $score);
    $_name = mysqli_real_escape_string($conn, $name);

    $sql = "insert into highscores (name, score, date) values ('$_name', '$_score', now())";
    
    try {
        mysqli_query($conn, $sql);
        echo 1;
    } catch (exception $e) {
        echo $e;
    }
}
