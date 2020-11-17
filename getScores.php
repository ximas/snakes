<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


$conn = mysqli_connect("localhost", $dbUsername, $dbPassword, $dbName);
$sql = "
    select name, score
    from highscores
    order by score desc
    limit 10
";

// $sql = "
//     select name, group_concat(score) score
//     from (
//         select name, score
//         from highscores
//         order by score desc
//         limit 10
//     ) t
//     group by name
// ";

$result = mysqli_query($conn, $sql);
$rows = [];

while($row = mysqli_fetch_assoc($result)) {
    array_push($rows, $row);
}
echo json_encode($rows);