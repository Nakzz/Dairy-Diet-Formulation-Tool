#!/usr/bin/php

<?php

include '../factory/DatabaseConnectionFactory.php';
$db = FeedValDatabaseConnectionFactory::getConnection();

if ($argc != 2) {
    exit('Usage: ' . basename(__FILE__) . ' file1[,file2,file3...]' . "\n");
}

$files = preg_split('/,\s*/', $argv[1]);

foreach ($files as $file) {
    $rows = getCSVRows($file);
    $columnNames = array_shift($rows);
    foreach ($rows as $row) {
        $query = 'INSERT IGNORE INTO prices SET ';
        for ($i = 0; $i < count($columnNames); $i++) {
            $query .= $columnNames[$i] . "='" . $row[$i] . "'";
            if ($i != count($columnNames) - 1) {
                $query .= ',';
            }
            $query .= ' ';
        }
        $db->exec($query);
    }
}

function getCSVRows($file) {
    $rows = array();
    $handle = fopen($file, 'r');
    while ( ($row = fgetcsv($handle)) !== FALSE ) {
        $rows[] = $row;
    }

    return $rows;
}
