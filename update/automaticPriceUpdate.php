<?php

ChromePhp::log("Started automatic price update sequence ");
require_once "utils/FeedValUpdateAutoload.php";
require_once "factory/DatabaseConnectionFactory.php";



$db = FeedValDatabaseConnectionFactory::getConnection();
$totalChanged =0;

ChromePhp::log("Got Connections");

// $query = 'SELECT INGREDIENT_ID, INGREDIENT, URL, CITY, CLASS FROM ingredients WHERE CLASS IS NOT NULL ORDER BY INGREDIENT_ID ASC';
$query = 'SELECT INGREDIENT_ID, INGREDIENT, URL, CITY, CLASS FROM ingredients ORDER BY INGREDIENT_ID ASC';

foreach ($db->query($query, PDO::FETCH_ASSOC) as $row) {
    $id = $row['INGREDIENT_ID'];
    $name = $row['INGREDIENT'];
    $url = $row['URL'];
    $city = $row['CITY'];
    $class = $row['CLASS'];

    $query2 = 'SELECT INGREDIENT_ID, DATE, PRICE, UNIT FROM prices WHERE INGREDIENT_ID = ' . $id . ' ORDER BY DATE DESC LIMIT 1';

    foreach ($db->query($query2, PDO::FETCH_ASSOC) as $row) {
        // $id = $row['INGREDIENT_ID'];
        $DATE = $row['DATE'];
        $PRICE = $row['PRICE'];
        $UNIT = $row['UNIT'];

        ChromePhp::log("'$name' ($id)");

        ChromePhp::log("    Latest Price Date for '$name' ($id): $DATE");

        $todayDate = DATE("Y-n-d");

        $datetime1 = new DateTime();
        $datetime2 = new DateTime($DATE);
        $interval = ($datetime2->diff($datetime1)->format('%a'));

        ChromePhp::log("    Updated Date:  $todayDate");
        ChromePhp::log("    Date Difference: $interval");

        if ($interval != 0) {

            $sql = "INSERT INTO prices (INGREDIENT_ID, DATE, PRICE, UNIT) VALUES(:id , :date , :price , :unit)
    ON DUPLICATE KEY UPDATE PRICE= :price, DATE=:date
";

// prepare connection with the query
            $stmt = $db->prepare($sql);

// bind parameters to query
            $stmt->bindParam(":id", $id, PDO::PARAM_STR);
            $stmt->bindParam(":date", $todayDate, PDO::PARAM_STR);
            $stmt->bindParam(":price", $PRICE, PDO::PARAM_STR);
            $stmt->bindParam(":unit", $UNIT, PDO::PARAM_STR);

            ChromePhp::log($stmt);

// execute the statement
            if ($stmt->execute()) {
                ChromePhp::log("     Inserted into Mysql");
                $totalChanged++;

            } else {
                ChromePhp::warn("     Failed to insert id: $id");
            }
        } else {
            ChromePhp::log("    Already up-to date.");

        }
    }



}
ChromePhp::log("Total Changes: $totalChanged");

